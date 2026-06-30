# KonekSync — Missing Features

Derived from the ISS170 Activity 2 (Ideate & Prototype) spec and SWOT/TOWS analysis documents.
Features are grouped by priority based on their survey scores and strategic importance.

---

## P1 — Core UX Gaps (Breaks promised workflows)

### 1. KYC Document Upload UI (Mobile)
**From spec:** "Workers create accounts using legal information and upload government IDs (Driver's License, Passport, UMID) and their TIN."
**Current state:** The database has a `kyc_document_url` field and the admin can approve/reject KYC, but the mobile app has no screen to actually upload documents. Workers cannot submit their IDs through the app.
**What's needed:**
- A KYC onboarding screen after registration
- File/image picker for government ID upload (front + back)
- TIN input field
- Upload to Supabase Storage, write URL to `kyc_document_url`
- Pending state shown to user while admin reviews

---

### 2. Post-Shift Rating Submission UI
**From spec:** "One-Click Payment & Rating System: Simplifies payroll processing after the shift ends and prompts the business to rate the worker."
**From survey:** Ratings/reviews scored 4.2/5.0 — "Social proof is vital for both sides of the market."
**Current state:** The `ratings` table exists and is wired into the reliability score calculation, but there is no UI anywhere to submit a rating. Workers also cannot rate businesses (dual rating is specified).
**What's needed:**
- Post-shift prompt on business side: rate the worker (1–5 stars + optional comment)
- Post-shift prompt on worker side: rate the business (dual rating system)
- Rating history screen for each user profile
- Display of average rating on worker and business cards

---

### 3. Continuous GPS Tracking During Active Shifts (Privacy-First)
**From spec:** "The system logs exact GPS coordinates and timestamps to prevent wage theft."
**From TOWS (ST Strategy):** "Mitigate tracking anxieties by restructuring the GPS feature to only ping location during active shift hours (clock-in to clock-out) rather than continuous background tracking."
**Current state:** `expo-location` is imported and one-time location fetch works, but there is no tracking loop during shifts — the business dashboard shows check-in/check-out timestamps only.
**What's needed:**
- Background location task that fires on a set interval (e.g., every 5 minutes) only between `checked_in_at` and `checked_out_at`
- `shift_location_logs` table to store timestamped pings
- Business-facing live map on the shift detail screen showing worker's last known location
- Auto-stop tracking on checkout
- Clear in-app disclosure to worker that tracking is active

---

### 4. Worker-Facing Dispute Submission (Mobile)
**From spec:** "Structured Dispute Dashboard" — described as a feature for both the platform and workers.
**From TOWS (WT Strategy):** "Deploy a prominent '1-click dispute' button backed by a fast, human-led resolution team."
**From survey:** "Seamless, 1-click dispute resolution button to handle instances of business underpayment."
**Current state:** The admin dashboard has a full dispute resolution interface, but there is no way for a worker or business to actually *file* a dispute from the mobile app.
**What's needed:**
- "Report an issue" / dispute button on the worker's completed shift screen
- Dispute form: category (underpayment, no-show, hostile environment, etc.) + description
- Status tracker so the worker can follow their open dispute
- Push notification when dispute status changes

---

## P2 — High-Value Features (Mentioned in spec + high survey demand)

### 5. Skill & Certification Upload
**From spec:** "Users can select their proficiencies across various sectors (Logistics, Hospitality, Admin) and upload certifications to unlock higher-paying shifts."
**Current state:** Workers can be assigned skills in the database, but there is no mobile UI to select skills or upload certification files.
**What's needed:**
- Skill multi-select screen during onboarding or from profile settings
- Certification file upload (PDF/image) per skill
- Admin review queue for uploaded certifications
- "Verified" badge on skill once cert is approved

---

### 6. In-App Notification Center
**From survey (Green Hat):** "Value in in-app messaging, training, and insurance" scored 4.3/5.0.
**Current state:** Firebase Cloud Messaging push notifications are wired up and fire when new shifts match a worker, but there is no in-app screen to view notification history. Once a push is dismissed, it is gone.
**What's needed:**
- Notification history screen (bell icon in header)
- `is_read` toggle — mark all read / mark individual as read
- Notifications for: new matching shift, application approved/rejected, payment released, dispute status update
- Badge counter on the tab bar

---

### 7. In-App Messaging / Chat
**From survey (Green Hat):** "Value in in-app messaging, training, and insurance" scored 4.3/5.0.
**From TOWS (WO Strategy):** "Counter early AI mismatch fears by bundling the algorithm matching with in-app chat systems."
**Current state:** Not implemented at all — no tables, no UI, no service.
**What's needed:**
- `messages` table (sender_id, receiver_id, shift_id context, body, created_at, read_at)
- Per-shift conversation thread accessible from the application card
- Real-time updates via Supabase Realtime subscriptions
- Unread message badge

---

### 8. True AI/ML Skill-Based Matching
**From spec:** "The decision support system automatically screens the local talent pool, matching businesses only with workers who meet the skill and reliability requirements."
**Current state:** Skill filtering is rule-based (SQL `WHERE skill_id = ?`). There is no actual AI matching — no ranking by fit, no learning from past shifts, no recommendation engine.
**What's needed:**
- Weighted scoring that factors: skill match, proximity, reliability score, past ratings, completion rate
- Ranked applicant list on the business side (not just filtered)
- Worker feed sorted by best-fit score, not just distance
- Optional: a Supabase Edge Function calling an embedding model to match shift descriptions against worker profiles

---

## P3 — Strategic Add-Ons (From TOWS analysis)

### 9. Micro-Insurance / Safety Net Feature
**From survey (Green Hat):** High demand — scored 4.3/5.0. "Stabilizing addition of basic micro-insurance coverage to safeguard workers against unexpected on-site injuries."
**From TOWS (WO Strategy):** "Make users feel fully protected."
**Current state:** Not implemented at all.
**What's needed:**
- Insurance opt-in toggle during shift application (per-shift coverage)
- Partner integration (e.g., a micro-insurance API) or a manual process with a disclosure screen
- Coverage summary shown to worker before accepting shift
- `insurance_coverage` table linked to `applications`
- Claims flow: worker files incident report post-shift

---

### 10. Incentivized Onboarding Perks (Zero-Fee First Cashouts)
**From TOWS (WO Strategy):** "Soften the friction of required ID uploads by offering immediate perks upon successful verification, such as zero platform fees on their first three cashouts."
**Current state:** Platform fee is hardcoded at 5% with no exceptions.
**What's needed:**
- `promo_credits` or `fee_waiver_count` field on worker profiles
- Fee waiver applied automatically for first N transactions after KYC approval
- Clear display in the payment breakdown when a fee waiver is applied
- Admin control to configure promo parameters

---

### 11. Transparent Fee Breakdown Screen (Dedicated)
**From survey:** "Absolute transparency via an upfront breakdown of all platform transaction fees."
**Current state:** The fee breakdown (gross, 5% fee, net) is shown in the payment confirmation modal only. There is no persistent screen explaining the fee structure.
**What's needed:**
- "How Payouts Work" info screen accessible from the earnings/wallet section
- Fee schedule clearly stated before a worker applies to a shift
- Link to fee policy from the shift detail view

---

### 12. Sector Expansion Tags (Catering, Logistics, Retail)
**From TOWS (SO Strategy):** "Launch hyper-targeted acquisition campaigns in high-turnover local sectors (retail/logistics), advertising immediate local job availability."
**Current state:** Skills are seeded with 15 generic entries. Shifts have no sector/industry tag.
**What's needed:**
- `sector` field on shifts (Retail, Logistics, Food Service, Healthcare, Admin, Catering)
- Sector filter on the worker shift feed
- Business onboarding step to select their industry
- Admin analytics breakdown by sector

---

## Summary Table

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 1 | KYC Document Upload UI | P1 | Medium |
| 2 | Post-Shift Dual Rating UI | P1 | Low |
| 3 | Continuous GPS Tracking (Shift Hours Only) | P1 | High |
| 4 | Worker Dispute Submission (Mobile) | P1 | Medium |
| 5 | Skill & Certification Upload | P2 | Medium |
| 6 | In-App Notification Center | P2 | Low |
| 7 | In-App Messaging / Chat | P2 | High |
| 8 | True AI/ML Skill Matching | P2 | High |
| 9 | Micro-Insurance / Safety Net | P3 | High |
| 10 | Zero-Fee Onboarding Perks | P3 | Low |
| 11 | Transparent Fee Breakdown Screen | P3 | Low |
| 12 | Sector Expansion Tags | P3 | Low |
