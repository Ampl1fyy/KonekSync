-- ─────────────────────────────────────────────────────────────────────────────
-- KonekSync — Makati Presentation Demo Seed
-- Run in Supabase SQL Editor before your July 1 presentation
-- ─────────────────────────────────────────────────────────────────────────────
-- ACCOUNTS (all passwords: KonekSync2026!)
--
--  WORKERS
--    miguel@koneksync.ph   — Miguel Ramos        (KYC verified, ★4.9, Cashiering/Customer Service)
--    sofia@koneksync.ph    — Sofia Lim           (KYC verified, ★4.7, Food Service/Barista/Event Staff)
--    renz@koneksync.ph     — Renz Dela Torre     (KYC pending,  ★new, Event Staff/Promotions)
--    claire@koneksync.ph   — Claire Santos       (KYC verified, ★4.5, Customer Service/Data Entry)
--
--  BUSINESSES
--    ayala@koneksync.ph    — Ayala Malls Makati  (Retail, Ayala Center)
--    greenbelt@koneksync.ph — Greenbelt Dining Group (F&B, Greenbelt 3)
--    bgc@koneksync.ph      — BGC Events Co.      (Events, Bonifacio Global City)
--
--  ADMIN
--    admin@koneksync.ph    — KonekSync Admin
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- Admin
  admin_id          uuid := 'aaaa0000-0000-0000-0000-000000000000';

  -- Business owners
  ayala_owner_id    uuid := 'aaaa0000-0000-0000-0000-000000000001';
  grn_owner_id      uuid := 'aaaa0000-0000-0000-0000-000000000002';
  bgc_owner_id      uuid := 'aaaa0000-0000-0000-0000-000000000003';

  -- Workers
  miguel_id         uuid := 'bbbb0000-0000-0000-0000-000000000001';
  sofia_id          uuid := 'bbbb0000-0000-0000-0000-000000000002';
  renz_id           uuid := 'bbbb0000-0000-0000-0000-000000000003';
  claire_id         uuid := 'bbbb0000-0000-0000-0000-000000000004';

  -- Businesses
  ayala_biz_id      uuid := 'cccc0000-0000-0000-0000-000000000001';
  grn_biz_id        uuid := 'cccc0000-0000-0000-0000-000000000002';
  bgc_biz_id        uuid := 'cccc0000-0000-0000-0000-000000000003';

  -- Shifts (July 1 = open for presentation day)
  shift_ayala1_id   uuid := 'dddd0000-0000-0000-0000-000000000001'; -- Cashier 7.7 Sale
  shift_ayala2_id   uuid := 'dddd0000-0000-0000-0000-000000000002'; -- Customer Service
  shift_grn1_id     uuid := 'dddd0000-0000-0000-0000-000000000003'; -- Barista
  shift_grn2_id     uuid := 'dddd0000-0000-0000-0000-000000000004'; -- Food Crew
  shift_bgc1_id     uuid := 'dddd0000-0000-0000-0000-000000000005'; -- Event Staff
  shift_bgc2_id     uuid := 'dddd0000-0000-0000-0000-000000000006'; -- Promotions
  shift_active_id   uuid := 'dddd0000-0000-0000-0000-000000000007'; -- Active now (Greenbelt eve)
  shift_done1_id    uuid := 'dddd0000-0000-0000-0000-000000000008'; -- Completed Ayala
  shift_done2_id    uuid := 'dddd0000-0000-0000-0000-000000000009'; -- Completed Greenbelt

  -- Applications
  app_mig_ayala1    uuid := 'eeee0000-0000-0000-0000-000000000001'; -- Miguel → Cashier (pending)
  app_sof_grn1      uuid := 'eeee0000-0000-0000-0000-000000000002'; -- Sofia → Barista (approved)
  app_renz_bgc1     uuid := 'eeee0000-0000-0000-0000-000000000003'; -- Renz → Event Staff (pending)
  app_claire_ayala2 uuid := 'eeee0000-0000-0000-0000-000000000004'; -- Claire → Cust. Service (pending)
  app_sof_active    uuid := 'eeee0000-0000-0000-0000-000000000005'; -- Sofia → Active shift (approved, checked in)
  app_mig_done1     uuid := 'eeee0000-0000-0000-0000-000000000006'; -- Miguel → Completed
  app_sof_done2     uuid := 'eeee0000-0000-0000-0000-000000000007'; -- Sofia → Completed
  app_renz_done1    uuid := 'eeee0000-0000-0000-0000-000000000008'; -- Renz → Completed (has dispute)

  -- Skill IDs
  skill_cashier     int;
  skill_customer    int;
  skill_food        int;
  skill_barista     int;
  skill_event       int;
  skill_promos      int;
  skill_dataentry   int;

BEGIN

  -- ── Resolve skill IDs ──────────────────────────────────────────────────────
  SELECT id INTO skill_cashier  FROM public.skills WHERE name = 'Cashiering';
  SELECT id INTO skill_customer FROM public.skills WHERE name = 'Customer Service';
  SELECT id INTO skill_food     FROM public.skills WHERE name = 'Food Service';
  SELECT id INTO skill_barista  FROM public.skills WHERE name = 'Barista';
  SELECT id INTO skill_event    FROM public.skills WHERE name = 'Event Staff';
  SELECT id INTO skill_promos   FROM public.skills WHERE name = 'Promotions';
  SELECT id INTO skill_dataentry FROM public.skills WHERE name = 'Data Entry';


  -- ─────────────────────────────────────────
  -- AUTH USERS
  -- ─────────────────────────────────────────

  -- Admin
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"KonekSync Admin","role":"admin"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Ayala business owner
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (ayala_owner_id, '00000000-0000-0000-0000-000000000000', 'ayala@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Patricia Ayala","role":"business","phone":"+639171110001"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Greenbelt business owner
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (grn_owner_id, '00000000-0000-0000-0000-000000000000', 'greenbelt@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Marco Villanueva","role":"business","phone":"+639172220002"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- BGC business owner
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (bgc_owner_id, '00000000-0000-0000-0000-000000000000', 'bgc@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Donna Cruz","role":"business","phone":"+639173330003"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Worker: Miguel
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (miguel_id, '00000000-0000-0000-0000-000000000000', 'miguel@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Miguel Ramos","role":"worker","phone":"+639181110001"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Worker: Sofia
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (sofia_id, '00000000-0000-0000-0000-000000000000', 'sofia@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Sofia Lim","role":"worker","phone":"+639182220002"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Worker: Renz
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (renz_id, '00000000-0000-0000-0000-000000000000', 'renz@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Renz Dela Torre","role":"worker","phone":"+639183330003"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Worker: Claire
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (claire_id, '00000000-0000-0000-0000-000000000000', 'claire@koneksync.ph', crypt('KonekSync2026!', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Claire Santos","role":"worker","phone":"+639184440004"}', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;


  -- ─────────────────────────────────────────
  -- AUTH IDENTITIES (required by Supabase GoTrue for email login)
  -- ─────────────────────────────────────────

  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), 'admin@koneksync.ph',      admin_id,       jsonb_build_object('sub', admin_id::text,       'email', 'admin@koneksync.ph',      'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
    (gen_random_uuid(), 'ayala@koneksync.ph',      ayala_owner_id, jsonb_build_object('sub', ayala_owner_id::text, 'email', 'ayala@koneksync.ph',      'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
    (gen_random_uuid(), 'greenbelt@koneksync.ph',  grn_owner_id,   jsonb_build_object('sub', grn_owner_id::text,   'email', 'greenbelt@koneksync.ph',  'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
    (gen_random_uuid(), 'bgc@koneksync.ph',        bgc_owner_id,   jsonb_build_object('sub', bgc_owner_id::text,   'email', 'bgc@koneksync.ph',        'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
    (gen_random_uuid(), 'miguel@koneksync.ph',     miguel_id,      jsonb_build_object('sub', miguel_id::text,      'email', 'miguel@koneksync.ph',     'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
    (gen_random_uuid(), 'sofia@koneksync.ph',      sofia_id,       jsonb_build_object('sub', sofia_id::text,       'email', 'sofia@koneksync.ph',      'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
    (gen_random_uuid(), 'renz@koneksync.ph',       renz_id,        jsonb_build_object('sub', renz_id::text,        'email', 'renz@koneksync.ph',       'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
    (gen_random_uuid(), 'claire@koneksync.ph',     claire_id,      jsonb_build_object('sub', claire_id::text,      'email', 'claire@koneksync.ph',     'email_verified', false, 'phone_verified', false), 'email', now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;


  -- ─────────────────────────────────────────
  -- PROFILES
  -- ─────────────────────────────────────────

  -- Admin
  UPDATE public.profiles SET role = 'admin', city = 'Makati', kyc_status = 'verified', is_active = true WHERE id = admin_id;

  -- Business owners
  UPDATE public.profiles SET role = 'business', phone = '+639171110001', city = 'Makati',
    location = ST_Point(121.0244, 14.5565)::geography, kyc_status = 'verified', is_active = true WHERE id = ayala_owner_id;

  UPDATE public.profiles SET role = 'business', phone = '+639172220002', city = 'Makati',
    location = ST_Point(121.0198, 14.5567)::geography, kyc_status = 'verified', is_active = true WHERE id = grn_owner_id;

  UPDATE public.profiles SET role = 'business', phone = '+639173330003', city = 'Taguig',
    location = ST_Point(121.0486, 14.5501)::geography, kyc_status = 'verified', is_active = true WHERE id = bgc_owner_id;

  -- Workers
  UPDATE public.profiles SET
    phone = '+639181110001', city = 'Makati',
    location = ST_Point(121.0280, 14.5590)::geography,
    kyc_status = 'verified', reliability_score = 4.90, average_rating = 4.90,
    total_ratings = 22, e_wallet_number = '09181110001', e_wallet_provider = 'gcash',
    fee_waiver_count = 3, is_active = true
  WHERE id = miguel_id;

  UPDATE public.profiles SET
    phone = '+639182220002', city = 'Pasig',
    location = ST_Point(121.0360, 14.5630)::geography,
    kyc_status = 'verified', reliability_score = 4.70, average_rating = 4.75,
    total_ratings = 18, e_wallet_number = '09182220002', e_wallet_provider = 'maya',
    fee_waiver_count = 0, is_active = true
  WHERE id = sofia_id;

  UPDATE public.profiles SET
    phone = '+639183330003', city = 'Mandaluyong',
    location = ST_Point(121.0330, 14.5780)::geography,
    kyc_status = 'pending', reliability_score = 5.00, average_rating = 0.00,
    total_ratings = 0, is_active = true
  WHERE id = renz_id;

  UPDATE public.profiles SET
    phone = '+639184440004', city = 'Makati',
    location = ST_Point(121.0200, 14.5520)::geography,
    kyc_status = 'verified', reliability_score = 4.50, average_rating = 4.50,
    total_ratings = 10, e_wallet_number = '09184440004', e_wallet_provider = 'gcash',
    fee_waiver_count = 0, is_active = true
  WHERE id = claire_id;

  -- Worker skills
  INSERT INTO public.worker_skills (worker_id, skill_id) VALUES
    (miguel_id, skill_cashier),
    (miguel_id, skill_customer),
    (sofia_id,  skill_food),
    (sofia_id,  skill_barista),
    (sofia_id,  skill_event),
    (renz_id,   skill_event),
    (renz_id,   skill_promos),
    (claire_id, skill_customer),
    (claire_id, skill_dataentry)
  ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- BUSINESSES
  -- ─────────────────────────────────────────

  INSERT INTO public.businesses (id, owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (
    ayala_biz_id, ayala_owner_id,
    'Ayala Malls Makati',
    'The premier mall destination in Makati''s CBD, home to over 500 retail, dining, and lifestyle stores.',
    'Retail',
    'Ayala Center, Makati City, Metro Manila',
    ST_Point(121.0244, 14.5565)::geography,
    'Makati', true
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.businesses (id, owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (
    grn_biz_id, grn_owner_id,
    'Greenbelt Dining Group',
    'Managing multiple casual and fine-dining concepts across Greenbelt 3 and 5, Makati.',
    'Food & Beverage',
    'Greenbelt 3, Ayala Center, Makati City',
    ST_Point(121.0198, 14.5567)::geography,
    'Makati', true
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.businesses (id, owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (
    bgc_biz_id, bgc_owner_id,
    'BGC Events Co.',
    'Full-service event staffing and production company serving BGC, Makati, and Ortigas.',
    'Events',
    '5th Ave, Bonifacio Global City, Taguig',
    ST_Point(121.0486, 14.5501)::geography,
    'Taguig', true
  ) ON CONFLICT (id) DO NOTHING;


  -- ─────────────────────────────────────────
  -- SHIFTS — July 1, 2026 (open for presentation)
  -- ─────────────────────────────────────────

  -- Ayala 1: Cashier – 7.7 Mid-Year Sale (flagship demo shift)
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_ayala1_id, ayala_biz_id,
    'Cashier – 7.7 Mid-Year Sale',
    'Help manage high-traffic express checkout lanes during our biggest sale of the year. Fast-paced environment — bonus ₱50 if you handle 100+ transactions. Uniform and meals provided.',
    'Cashier', skill_cashier, 3, 1, 130.00,
    '2026-07-01 08:00:00+08', '2026-07-01 20:00:00+08',
    'open', ST_Point(121.0244, 14.5565)::geography,
    'Ayala Center, Makati City', 'Retail', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Ayala 2: Customer Service Floor Staff
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_ayala2_id, ayala_biz_id,
    'Customer Service Floor Staff',
    'Assist shoppers on the floor, handle inquiries, escort to stores, and manage the info kiosk during the 7.7 sale. Must be presentable and fluent in English and Filipino.',
    'Customer Service Rep', skill_customer, 2, 0, 120.00,
    '2026-07-01 10:00:00+08', '2026-07-01 19:00:00+08',
    'open', ST_Point(121.0244, 14.5565)::geography,
    'Ayala Center, Makati City', 'Retail', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Greenbelt 1: Barista – Weekend Rush
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_grn1_id, grn_biz_id,
    'Barista – Weekend Rush',
    'Pull espresso shots, craft specialty drinks, and keep the queue moving during our busiest brunch period. Latte art a plus. Training provided for our house menu.',
    'Barista', skill_barista, 2, 0, 125.00,
    '2026-07-01 07:00:00+08', '2026-07-01 15:00:00+08',
    'open', ST_Point(121.0198, 14.5567)::geography,
    'Greenbelt 3, Makati City', 'Food & Beverage', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Greenbelt 2: Food Service Crew
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_grn2_id, grn_biz_id,
    'Food Service Crew – Lunch & Dinner',
    'Run food, clear tables, assist kitchen with plating, and ensure guest satisfaction during our high-volume lunch and dinner service. Team-oriented — tips pooled and shared.',
    'Food Crew', skill_food, 4, 0, 115.00,
    '2026-07-01 11:00:00+08', '2026-07-01 21:00:00+08',
    'open', ST_Point(121.0198, 14.5567)::geography,
    'Greenbelt 3, Makati City', 'Food & Beverage', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- BGC 1: Event Staff – BGC Market
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_bgc1_id, bgc_biz_id,
    'Event Staff – BGC Weekend Market',
    'Help set up and manage booths, assist vendors, guide foot traffic, and handle crowd control for the BGC Weekend Market. Long day — meals and transport allowance provided.',
    'Event Staff', skill_event, 5, 0, 140.00,
    '2026-07-01 06:00:00+08', '2026-07-01 20:00:00+08',
    'open', ST_Point(121.0486, 14.5501)::geography,
    '5th Ave, Bonifacio Global City, Taguig', 'Events', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- BGC 2: Promotions Staff
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_bgc2_id, bgc_biz_id,
    'Promotions Team – Bonifacio High Street',
    'Distribute event flyers, engage passersby, and direct guests to our participating vendors along High Street. Outgoing personality required. Uniform provided.',
    'Promo Staff', skill_promos, 3, 0, 110.00,
    '2026-07-01 10:00:00+08', '2026-07-01 18:00:00+08',
    'open', ST_Point(121.0486, 14.5501)::geography,
    'Bonifacio High Street, BGC, Taguig', 'Events', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Active shift (currently live on June 30 for demo)
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_active_id, grn_biz_id,
    'Evening Dining Service Crew',
    'Assist with dinner service at our Greenbelt 5 outlet. High-end casual dining — attire and grooming standards apply.',
    'Service Crew', skill_food, 2, 1, 120.00,
    now() - interval '3 hours',
    now() + interval '4 hours',
    'active', ST_Point(121.0198, 14.5567)::geography,
    'Greenbelt 5, Makati City', 'Food & Beverage', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Completed shift 1 (June 27)
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_done1_id, ayala_biz_id,
    'Cashier – Pre-Sale Setup Day',
    'Prepare checkout lanes, stock receipt paper, set up POS terminals for the upcoming 7.7 sale.',
    'Cashier', skill_cashier, 2, 2, 130.00,
    '2026-06-27 09:00:00+08', '2026-06-27 17:00:00+08',
    'completed', ST_Point(121.0244, 14.5565)::geography,
    'Ayala Center, Makati City', 'Retail', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;

  -- Completed shift 2 (June 25)
  INSERT INTO public.shifts (id, business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (
    shift_done2_id, grn_biz_id,
    'Lunch Service Crew',
    'Regular lunch service crew for a busy Wednesday midday rush.',
    'Service Crew', skill_food, 2, 2, 115.00,
    '2026-06-25 10:00:00+08', '2026-06-25 16:00:00+08',
    'completed', ST_Point(121.0198, 14.5567)::geography,
    'Greenbelt 3, Makati City', 'Food & Beverage', gen_random_uuid()::text
  ) ON CONFLICT (id) DO NOTHING;


  -- ─────────────────────────────────────────
  -- APPLICATIONS
  -- ─────────────────────────────────────────

  -- Miguel → Cashier 7.7 (pending — shows in Ayala's applicant queue)
  INSERT INTO public.applications (id, shift_id, worker_id, status)
  VALUES (app_mig_ayala1, shift_ayala1_id, miguel_id, 'pending')
  ON CONFLICT DO NOTHING;

  -- Sofia → Barista (approved — shows in her My Shifts)
  INSERT INTO public.applications (id, shift_id, worker_id, status)
  VALUES (app_sof_grn1, shift_grn1_id, sofia_id, 'approved')
  ON CONFLICT DO NOTHING;

  -- Renz → Event Staff BGC (pending)
  INSERT INTO public.applications (id, shift_id, worker_id, status)
  VALUES (app_renz_bgc1, shift_bgc1_id, renz_id, 'pending')
  ON CONFLICT DO NOTHING;

  -- Claire → Customer Service Ayala (pending)
  INSERT INTO public.applications (id, shift_id, worker_id, status)
  VALUES (app_claire_ayala2, shift_ayala2_id, claire_id, 'pending')
  ON CONFLICT DO NOTHING;

  -- Sofia → Active evening shift (approved, checked in)
  INSERT INTO public.applications (id, shift_id, worker_id, status, checked_in_at)
  VALUES (app_sof_active, shift_active_id, sofia_id, 'approved', now() - interval '3 hours')
  ON CONFLICT DO NOTHING;

  -- Miguel → Completed shift 1 (done, rated)
  INSERT INTO public.applications (id, shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked)
  VALUES (app_mig_done1, shift_done1_id, miguel_id, 'approved',
    '2026-06-27 09:00:00+08', '2026-06-27 17:00:00+08', 8.00)
  ON CONFLICT DO NOTHING;

  -- Sofia → Completed shift 2 (done, rated)
  INSERT INTO public.applications (id, shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked)
  VALUES (app_sof_done2, shift_done2_id, sofia_id, 'approved',
    '2026-06-25 10:00:00+08', '2026-06-25 16:00:00+08', 6.00)
  ON CONFLICT DO NOTHING;

  -- Renz → Completed (old shift at Ayala, for dispute demo)
  INSERT INTO public.applications (id, shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked)
  VALUES (app_renz_done1, shift_done1_id, renz_id, 'approved',
    '2026-06-27 09:00:00+08', '2026-06-27 17:00:00+08', 8.00)
  ON CONFLICT DO NOTHING;

  -- Update slots_filled
  UPDATE public.shifts SET slots_filled = 1 WHERE id = shift_ayala1_id;
  UPDATE public.shifts SET slots_filled = 1 WHERE id = shift_done1_id;
  UPDATE public.shifts SET slots_filled = 2 WHERE id = shift_done2_id;


  -- ─────────────────────────────────────────
  -- TRANSACTIONS (completed shifts)
  -- ─────────────────────────────────────────

  INSERT INTO public.transactions (application_id, worker_id, business_id, amount, platform_fee, net_amount, payment_method, status, payment_reference, completed_at)
  VALUES (
    app_mig_done1, miguel_id, ayala_biz_id,
    1040.00, 52.00, 988.00,   -- ₱130/hr × 8hrs, 5% fee, waiver applied (net = full amount demo)
    'gcash', 'completed',
    'REF-20260627-MIG001', '2026-06-28 10:00:00+08'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.transactions (application_id, worker_id, business_id, amount, platform_fee, net_amount, payment_method, status, payment_reference, completed_at)
  VALUES (
    app_sof_done2, sofia_id, grn_biz_id,
    690.00, 34.50, 655.50,    -- ₱115/hr × 6hrs, 5% fee
    'maya', 'completed',
    'REF-20260625-SOF001', '2026-06-26 09:00:00+08'
  ) ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- RATINGS
  -- ─────────────────────────────────────────

  -- Ayala rated Miguel: 5 stars
  INSERT INTO public.ratings (application_id, rater_id, rated_id, score, comment)
  VALUES (app_mig_done1, ayala_owner_id, miguel_id, 5, 'Miguel was outstanding — fast, accurate, zero complaints from customers. First pick for our next sale.')
  ON CONFLICT DO NOTHING;

  -- Miguel rated Ayala: 5 stars
  INSERT INTO public.ratings (application_id, rater_id, rated_id, score, comment)
  VALUES (app_mig_done1, miguel_id, ayala_owner_id, 5, 'Great workplace, clear instructions, and they released payment immediately after the shift. Highly recommended!')
  ON CONFLICT DO NOTHING;

  -- Greenbelt rated Sofia: 4 stars
  INSERT INTO public.ratings (application_id, rater_id, rated_id, score, comment)
  VALUES (app_sof_done2, grn_owner_id, sofia_id, 4, 'Reliable and cheerful. Handled the lunch rush well. Minor delay on drink orders during peak but overall solid.')
  ON CONFLICT DO NOTHING;

  -- Sofia rated Greenbelt: 5 stars
  INSERT INTO public.ratings (application_id, rater_id, rated_id, score, comment)
  VALUES (app_sof_done2, sofia_id, grn_owner_id, 5, 'Friendly team, delicious staff meal, and super organized briefing. Will definitely apply again!')
  ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- DISPUTES (for admin demo)
  -- ─────────────────────────────────────────

  INSERT INTO public.disputes (application_id, raised_by, reason, description, status)
  VALUES (
    app_renz_done1, renz_id,
    'Underpayment / Non-payment',
    'I completed the full 8-hour shift from 9am to 5pm on June 27 but the business released payment for only 6 hours (₱780 instead of ₱1,040). I have my QR check-in and check-out logs to prove the full 8 hours.',
    'open'
  ) ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- NOTIFICATIONS
  -- ─────────────────────────────────────────

  INSERT INTO public.notifications (user_id, title, body, data, is_read, created_at) VALUES
    (miguel_id, 'New shift near you!', 'Cashier – 7.7 Mid-Year Sale — ₱130/hr at Ayala Center, Makati City', '{"shift_id":"dddd0000-0000-0000-0000-000000000001","type":"new_shift"}', false, now() - interval '2 hours'),
    (miguel_id, 'New shift near you!', 'Customer Service Floor Staff — ₱120/hr at Ayala Center, Makati City', '{"shift_id":"dddd0000-0000-0000-0000-000000000002","type":"new_shift"}', true, now() - interval '3 hours'),
    (miguel_id, 'Payment received!', 'Your payout of ₱988.00 for Cashier – Pre-Sale Setup Day has been released to your GCash.', '{"type":"payment","reference":"REF-20260627-MIG001"}', false, '2026-06-28 10:05:00+08'),
    (sofia_id,  'Application approved!', 'Your application for Barista – Weekend Rush at Greenbelt Dining Group has been approved!', '{"shift_id":"dddd0000-0000-0000-0000-000000000003","type":"application_approved"}', false, now() - interval '1 hour'),
    (sofia_id,  'Payment received!', 'Your payout of ₱655.50 for Lunch Service Crew has been released to your Maya wallet.', '{"type":"payment","reference":"REF-20260625-SOF001"}', true, '2026-06-26 09:05:00+08'),
    (renz_id,   'New shift near you!', 'Event Staff – BGC Weekend Market — ₱140/hr at 5th Ave, Bonifacio Global City', '{"shift_id":"dddd0000-0000-0000-0000-000000000005","type":"new_shift"}', false, now() - interval '4 hours'),
    (renz_id,   'Dispute update', 'Your dispute (Underpayment) has been received and is under review by our team. Expect a response within 48 hours.', '{"type":"dispute_update"}', false, now() - interval '1 hour'),
    (claire_id, 'New shift near you!', 'Customer Service Floor Staff — ₱120/hr at Ayala Center, Makati City', '{"shift_id":"dddd0000-0000-0000-0000-000000000002","type":"new_shift"}', false, now() - interval '2 hours')
  ON CONFLICT DO NOTHING;


  -- ─────────────────────────────────────────
  -- MESSAGES (chat demo between Miguel and Ayala)
  -- ─────────────────────────────────────────

  INSERT INTO public.messages (sender_id, application_id, body, is_read, created_at) VALUES
    (ayala_owner_id, app_mig_ayala1,
     'Hi Miguel! We reviewed your profile and you look like a great fit. Just confirming — do you have experience with NCR POS systems?',
     true, now() - interval '90 minutes'),
    (miguel_id, app_mig_ayala1,
     'Hi Ms. Ayala! Yes, I''ve used NCR POS at SM North EDSA for 6 months. I can handle express and regular lanes.',
     true, now() - interval '80 minutes'),
    (ayala_owner_id, app_mig_ayala1,
     'Perfect! Please arrive at the staff entrance (basement B2) by 7:45am. Bring a valid ID for the guard. Uniform top is white polo.',
     false, now() - interval '70 minutes'),
    (miguel_id, app_mig_ayala1,
     'Got it! I''ll be there. Thank you for the opportunity!',
     false, now() - interval '60 minutes');


  RAISE NOTICE '─────────────────────────────────────────────────────────';
  RAISE NOTICE 'KonekSync Makati Demo Seed — COMPLETE';
  RAISE NOTICE '';
  RAISE NOTICE 'All passwords: KonekSync2026!';
  RAISE NOTICE '';
  RAISE NOTICE 'WORKERS:';
  RAISE NOTICE '  miguel@koneksync.ph    (verified, 4.9 stars, Cashiering/CS)';
  RAISE NOTICE '  sofia@koneksync.ph     (verified, 4.7 stars, Barista/Food/Events)';
  RAISE NOTICE '  renz@koneksync.ph      (KYC pending, new, Events/Promotions)';
  RAISE NOTICE '  claire@koneksync.ph    (verified, 4.5 stars, CS/Admin)';
  RAISE NOTICE '';
  RAISE NOTICE 'BUSINESSES:';
  RAISE NOTICE '  ayala@koneksync.ph     (Ayala Malls Makati — Retail)';
  RAISE NOTICE '  greenbelt@koneksync.ph (Greenbelt Dining Group — F&B)';
  RAISE NOTICE '  bgc@koneksync.ph       (BGC Events Co. — Events)';
  RAISE NOTICE '';
  RAISE NOTICE 'ADMIN:';
  RAISE NOTICE '  admin@koneksync.ph';
  RAISE NOTICE '';
  RAISE NOTICE '6 open shifts on July 1 in Makati/BGC area.';
  RAISE NOTICE '─────────────────────────────────────────────────────────';

END $$;
