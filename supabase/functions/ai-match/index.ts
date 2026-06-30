/**
 * KonekSync AI Matching Engine
 *
 * Opt-in endpoint: called only when a worker taps "Find My Best Matches".
 * Uses Claude to rank nearby shifts by fit score based on worker profile.
 *
 * Deploy: supabase functions deploy ai-match
 * Required env var: ANTHROPIC_API_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY is not set in Edge Function secrets.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { worker_id, shift_ids } = await req.json();
    if (!worker_id) {
      return new Response(JSON.stringify({ error: 'worker_id is required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── 1. Fetch worker profile + skills ──────────────────────────────────────
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, city, reliability_score, average_rating, total_ratings, fee_waiver_count')
      .eq('id', worker_id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Worker not found' }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { data: workerSkills } = await supabase
      .from('worker_skills')
      .select('skills(name, category)')
      .eq('worker_id', worker_id);

    const skills = (workerSkills ?? []).map((ws: any) => ws.skills?.name).filter(Boolean);

    // ── 2. Fetch shifts to rank ───────────────────────────────────────────────
    let shiftsQuery = supabase
      .from('shifts')
      .select('id, title, description, role_required, hourly_rate, time_start, time_end, address, sector, slots, slots_filled, skills(name)')
      .eq('status', 'open')
      .gt('time_start', new Date().toISOString())
      .order('time_start', { ascending: true })
      .limit(20);

    if (shift_ids && shift_ids.length > 0) {
      shiftsQuery = shiftsQuery.in('id', shift_ids);
    }

    const { data: shifts } = await shiftsQuery;

    if (!shifts || shifts.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Build Claude prompt ────────────────────────────────────────────────
    const workerContext = `
WORKER PROFILE:
- Name: ${profile.full_name}
- City: ${profile.city ?? 'Metro Manila'}
- Skills: ${skills.length > 0 ? skills.join(', ') : 'None listed'}
- Reliability Score: ${profile.reliability_score}/5.00
- Average Rating: ${profile.average_rating}/5.00 (${profile.total_ratings} ratings)
`.trim();

    const shiftsContext = shifts.map((s: any, i: number) => {
      const hours = ((new Date(s.time_end).getTime() - new Date(s.time_start).getTime()) / 3600000).toFixed(1);
      const requiredSkill = s.skills?.name ?? s.role_required;
      const slotsLeft = s.slots - s.slots_filled;
      return `SHIFT ${i + 1}:
- ID: ${s.id}
- Title: ${s.title}
- Required Skill: ${requiredSkill}
- Sector: ${s.sector ?? 'General'}
- Pay: ₱${s.hourly_rate}/hr (${hours}h shift = ₱${(parseFloat(s.hourly_rate) * parseFloat(hours)).toFixed(0)} total)
- Date: ${new Date(s.time_start).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
- Location: ${s.address}
- Slots available: ${slotsLeft}
- Description: ${s.description ?? s.role_required}`;
    }).join('\n\n');

    const prompt = `You are a job matching assistant for KonekSync, a Philippine gig-work platform.

${workerContext}

AVAILABLE SHIFTS:
${shiftsContext}

TASK:
Rank ALL ${shifts.length} shifts from best to worst match for this worker. For each shift:
1. Calculate a fit_score from 0 to 100 based on:
   - Skill match (40 pts): Does the worker have the required skill?
   - Pay value (20 pts): Higher pay relative to others scores better
   - Schedule compatibility (20 pts): Reasonable start time, not too early
   - Sector alignment (20 pts): Does the sector suit their skill profile?
2. Write a match_reason (max 15 words, conversational Filipino-English tone)

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "matches": [
    {"shift_id": "...", "fit_score": 95, "match_reason": "Perfect skill match, highest pay, ideal morning schedule"},
    ...
  ]
}

Order by fit_score descending. Include every shift.`;

    // ── 4. Call Google Gemini ─────────────────────────────────────────────────
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return new Response(JSON.stringify({ error: 'AI service unavailable. Please try again.' }), {
        status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiRes.json();
    const rawContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // ── 5. Parse and return ───────────────────────────────────────────────────
    let parsed: { matches: Array<{ shift_id: string; fit_score: number; match_reason: string }> };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Attempt to extract JSON from response if it has extra text
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Failed to parse Claude response:', rawContent);
        return new Response(JSON.stringify({ error: 'Could not parse AI response.' }), {
          status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
    }

    // Enrich with shift details for the client
    const shiftMap = Object.fromEntries(shifts.map((s: any) => [s.id, s]));
    const enrichedMatches = parsed.matches.map((m) => ({
      ...m,
      shift: shiftMap[m.shift_id] ?? null,
    })).filter((m) => m.shift !== null);

    return new Response(JSON.stringify({ matches: enrichedMatches }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('ai-match error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
