import { supabase } from './supabase';

export async function submitRating(params: {
  applicationId: string;
  raterId: string;
  ratedId: string;
  score: number;
  comment?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('ratings').insert({
    application_id: params.applicationId,
    rater_id:       params.raterId,
    rated_id:       params.ratedId,
    score:          params.score,
    comment:        params.comment?.trim() || null,
  });

  return { error: error?.message ?? null };
}

export async function hasRated(applicationId: string, raterId: string): Promise<boolean> {
  const { data } = await supabase
    .from('ratings')
    .select('id')
    .eq('application_id', applicationId)
    .eq('rater_id', raterId)
    .maybeSingle();

  return data !== null;
}
