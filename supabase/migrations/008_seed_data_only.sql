-- KonekSync Demo Seed — Data Only (run after admin API creates auth users)
-- Uses actual UUIDs assigned by the admin API

DO $$
DECLARE
  -- Paste these from the terminal output (already filled in)
  admin_id   uuid := '4c3f30f0-ca68-4935-9822-fe356b1a7be7';
  ayala_id   uuid := '34dd5228-4fcb-4aec-a2e9-045157f86387';
  grn_id     uuid := '48973b02-5401-4f3e-861a-a31539349006';
  bgc_id     uuid := '71d5163a-1ff7-4a35-bbf9-cab47a516785';
  miguel_id  uuid := '20c148e6-d64d-4a54-a613-9199dfd55e89';
  sofia_id   uuid := 'eb06b0a7-9f16-4f77-bf6e-f8c745d7a5d5';
  renz_id    uuid := '68e84bac-b2fb-4068-9774-8ec1dc9eeebd';
  claire_id  uuid := '21afde54-4706-4626-864f-e03c18426074';

  -- Generated IDs
  ayala_biz_id uuid;
  grn_biz_id   uuid;
  bgc_biz_id   uuid;

  shift_ayala1_id uuid;
  shift_ayala2_id uuid;
  shift_grn1_id   uuid;
  shift_grn2_id   uuid;
  shift_bgc1_id   uuid;
  shift_bgc2_id   uuid;
  shift_active_id uuid;
  shift_done1_id  uuid;
  shift_done2_id  uuid;

  app_mig_ayala1    uuid;
  app_sof_grn1      uuid;
  app_renz_bgc1     uuid;
  app_claire_ayala2 uuid;
  app_sof_active    uuid;
  app_mig_done1     uuid;
  app_sof_done2     uuid;
  app_renz_done1    uuid;

  skill_cashier  int;
  skill_customer int;
  skill_food     int;
  skill_barista  int;
  skill_event    int;
  skill_promos   int;
BEGIN

  SELECT id INTO skill_cashier  FROM public.skills WHERE name = 'Cashiering';
  SELECT id INTO skill_customer FROM public.skills WHERE name = 'Customer Service';
  SELECT id INTO skill_food     FROM public.skills WHERE name = 'Food Service';
  SELECT id INTO skill_barista  FROM public.skills WHERE name = 'Barista';
  SELECT id INTO skill_event    FROM public.skills WHERE name = 'Event Staff';
  SELECT id INTO skill_promos   FROM public.skills WHERE name = 'Promotions';

  -- ── Profile locations (REST API can't set geography) ────────────────────────
  UPDATE public.profiles SET location = ST_Point(121.0244, 14.5565)::geography WHERE id = ayala_id;
  UPDATE public.profiles SET location = ST_Point(121.0198, 14.5567)::geography WHERE id = grn_id;
  UPDATE public.profiles SET location = ST_Point(121.0486, 14.5501)::geography WHERE id = bgc_id;
  UPDATE public.profiles SET location = ST_Point(121.0280, 14.5590)::geography WHERE id = miguel_id;
  UPDATE public.profiles SET location = ST_Point(121.0360, 14.5630)::geography WHERE id = sofia_id;
  UPDATE public.profiles SET location = ST_Point(121.0330, 14.5780)::geography WHERE id = renz_id;
  UPDATE public.profiles SET location = ST_Point(121.0200, 14.5520)::geography WHERE id = claire_id;

  -- ── Businesses ───────────────────────────────────────────────────────────────
  INSERT INTO public.businesses (owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (ayala_id, 'Ayala Malls Makati', 'The premier mall destination in Makati''s CBD, home to over 500 retail, dining, and lifestyle stores.', 'Retail', 'Ayala Center, Makati City, Metro Manila', ST_Point(121.0244, 14.5565)::geography, 'Makati', true)
  RETURNING id INTO ayala_biz_id;

  INSERT INTO public.businesses (owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (grn_id, 'Greenbelt Dining Group', 'Managing multiple casual and fine-dining concepts across Greenbelt 3 and 5, Makati.', 'Food & Beverage', 'Greenbelt 3, Ayala Center, Makati City', ST_Point(121.0198, 14.5567)::geography, 'Makati', true)
  RETURNING id INTO grn_biz_id;

  INSERT INTO public.businesses (owner_id, name, description, industry, address, location, city, is_verified)
  VALUES (bgc_id, 'BGC Events Co.', 'Full-service event staffing and production company serving BGC, Makati, and Ortigas.', 'Events', '5th Ave, Bonifacio Global City, Taguig', ST_Point(121.0486, 14.5501)::geography, 'Taguig', true)
  RETURNING id INTO bgc_biz_id;

  -- ── Shifts ───────────────────────────────────────────────────────────────────
  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (ayala_biz_id, 'Cashier – 7.7 Mid-Year Sale', 'Help manage high-traffic express checkout lanes during our biggest sale of the year. Fast-paced — bonus ₱50 if you handle 100+ transactions. Uniform and meals provided.', 'Cashier', skill_cashier, 3, 1, 130.00, '2026-07-01 08:00:00+08', '2026-07-01 20:00:00+08', 'open', ST_Point(121.0244, 14.5565)::geography, 'Ayala Center, Makati City', 'Retail', gen_random_uuid()::text)
  RETURNING id INTO shift_ayala1_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (ayala_biz_id, 'Customer Service Floor Staff', 'Assist shoppers on the floor, handle inquiries, and manage the info kiosk during the 7.7 sale. Must be presentable and fluent in English and Filipino.', 'Customer Service Rep', skill_customer, 2, 0, 120.00, '2026-07-01 10:00:00+08', '2026-07-01 19:00:00+08', 'open', ST_Point(121.0244, 14.5565)::geography, 'Ayala Center, Makati City', 'Retail', gen_random_uuid()::text)
  RETURNING id INTO shift_ayala2_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (grn_biz_id, 'Barista – Weekend Rush', 'Pull espresso shots, craft specialty drinks, and keep the queue moving during our busiest brunch period. Latte art a plus. Training provided for our house menu.', 'Barista', skill_barista, 2, 0, 125.00, '2026-07-01 07:00:00+08', '2026-07-01 15:00:00+08', 'open', ST_Point(121.0198, 14.5567)::geography, 'Greenbelt 3, Makati City', 'Food & Beverage', gen_random_uuid()::text)
  RETURNING id INTO shift_grn1_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (grn_biz_id, 'Food Service Crew – Lunch & Dinner', 'Run food, clear tables, assist kitchen with plating during high-volume service. Tips pooled and shared.', 'Food Crew', skill_food, 4, 0, 115.00, '2026-07-01 11:00:00+08', '2026-07-01 21:00:00+08', 'open', ST_Point(121.0198, 14.5567)::geography, 'Greenbelt 3, Makati City', 'Food & Beverage', gen_random_uuid()::text)
  RETURNING id INTO shift_grn2_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (bgc_biz_id, 'Event Staff – BGC Weekend Market', 'Help set up and manage booths, assist vendors, guide foot traffic for the BGC Weekend Market. Meals and transport allowance provided.', 'Event Staff', skill_event, 5, 0, 140.00, '2026-07-01 06:00:00+08', '2026-07-01 20:00:00+08', 'open', ST_Point(121.0486, 14.5501)::geography, '5th Ave, Bonifacio Global City, Taguig', 'Events', gen_random_uuid()::text)
  RETURNING id INTO shift_bgc1_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (bgc_biz_id, 'Promotions Team – Bonifacio High Street', 'Distribute event flyers and direct guests to vendors along High Street. Outgoing personality required. Uniform provided.', 'Promo Staff', skill_promos, 3, 0, 110.00, '2026-07-01 10:00:00+08', '2026-07-01 18:00:00+08', 'open', ST_Point(121.0486, 14.5501)::geography, 'Bonifacio High Street, BGC, Taguig', 'Events', gen_random_uuid()::text)
  RETURNING id INTO shift_bgc2_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (grn_biz_id, 'Evening Dining Service Crew', 'Assist with dinner service at our Greenbelt 5 outlet. High-end casual dining — attire standards apply.', 'Service Crew', skill_food, 2, 1, 120.00, now() - interval '3 hours', now() + interval '4 hours', 'active', ST_Point(121.0198, 14.5567)::geography, 'Greenbelt 5, Makati City', 'Food & Beverage', gen_random_uuid()::text)
  RETURNING id INTO shift_active_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (ayala_biz_id, 'Cashier – Pre-Sale Setup Day', 'Prepare checkout lanes and set up POS terminals for the upcoming 7.7 sale.', 'Cashier', skill_cashier, 2, 2, 130.00, '2026-06-27 09:00:00+08', '2026-06-27 17:00:00+08', 'completed', ST_Point(121.0244, 14.5565)::geography, 'Ayala Center, Makati City', 'Retail', gen_random_uuid()::text)
  RETURNING id INTO shift_done1_id;

  INSERT INTO public.shifts (business_id, title, description, role_required, skill_id, slots, slots_filled, hourly_rate, time_start, time_end, status, location, address, sector, qr_code)
  VALUES (grn_biz_id, 'Lunch Service Crew', 'Regular lunch service crew for a busy Wednesday midday rush.', 'Service Crew', skill_food, 2, 2, 115.00, '2026-06-25 10:00:00+08', '2026-06-25 16:00:00+08', 'completed', ST_Point(121.0198, 14.5567)::geography, 'Greenbelt 3, Makati City', 'Food & Beverage', gen_random_uuid()::text)
  RETURNING id INTO shift_done2_id;

  -- ── Applications ─────────────────────────────────────────────────────────────
  INSERT INTO public.applications (shift_id, worker_id, status) VALUES (shift_ayala1_id, miguel_id, 'pending')  RETURNING id INTO app_mig_ayala1;
  INSERT INTO public.applications (shift_id, worker_id, status) VALUES (shift_grn1_id,   sofia_id,  'approved') RETURNING id INTO app_sof_grn1;
  INSERT INTO public.applications (shift_id, worker_id, status) VALUES (shift_bgc1_id,   renz_id,   'pending')  RETURNING id INTO app_renz_bgc1;
  INSERT INTO public.applications (shift_id, worker_id, status) VALUES (shift_ayala2_id, claire_id, 'pending')  RETURNING id INTO app_claire_ayala2;
  INSERT INTO public.applications (shift_id, worker_id, status, checked_in_at) VALUES (shift_active_id, sofia_id, 'approved', now() - interval '3 hours') RETURNING id INTO app_sof_active;
  INSERT INTO public.applications (shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked) VALUES (shift_done1_id, miguel_id, 'approved', '2026-06-27 09:00:00+08', '2026-06-27 17:00:00+08', 8.00) RETURNING id INTO app_mig_done1;
  INSERT INTO public.applications (shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked) VALUES (shift_done2_id, sofia_id,  'approved', '2026-06-25 10:00:00+08', '2026-06-25 16:00:00+08', 6.00) RETURNING id INTO app_sof_done2;
  INSERT INTO public.applications (shift_id, worker_id, status, checked_in_at, checked_out_at, hours_worked) VALUES (shift_done1_id, renz_id,   'approved', '2026-06-27 09:00:00+08', '2026-06-27 17:00:00+08', 8.00) RETURNING id INTO app_renz_done1;

  -- ── Transactions ─────────────────────────────────────────────────────────────
  INSERT INTO public.transactions (application_id, worker_id, business_id, amount, platform_fee, net_amount, payment_method, status, payment_reference, completed_at) VALUES
    (app_mig_done1, miguel_id, ayala_biz_id, 1040.00, 52.00, 988.00, 'gcash', 'completed', 'REF-20260627-MIG001', '2026-06-28 10:00:00+08'),
    (app_sof_done2, sofia_id,  grn_biz_id,    690.00, 34.50, 655.50, 'maya',  'completed', 'REF-20260625-SOF001', '2026-06-26 09:00:00+08');

  -- ── Ratings ──────────────────────────────────────────────────────────────────
  INSERT INTO public.ratings (application_id, rater_id, rated_id, score, comment) VALUES
    (app_mig_done1, ayala_id,  miguel_id, 5, 'Miguel was outstanding — fast, accurate, zero complaints. First pick for our next sale.'),
    (app_mig_done1, miguel_id, ayala_id,  5, 'Great workplace, clear instructions, payment released immediately. Highly recommended!'),
    (app_sof_done2, grn_id,    sofia_id,  4, 'Reliable and cheerful. Handled the lunch rush well. Minor delay on drinks during peak but overall solid.'),
    (app_sof_done2, sofia_id,  grn_id,    5, 'Friendly team, delicious staff meal, and super organized briefing. Will definitely apply again!');

  -- ── Disputes ─────────────────────────────────────────────────────────────────
  INSERT INTO public.disputes (application_id, raised_by, reason, description, status) VALUES
    (app_renz_done1, renz_id, 'Underpayment / Non-payment', 'I completed the full 8-hour shift from 9am to 5pm on June 27 but the business released payment for only 6 hours (₱780 instead of ₱1,040). I have my QR check-in and check-out logs to prove the full 8 hours.', 'open');

  -- ── Notifications ─────────────────────────────────────────────────────────────
  INSERT INTO public.notifications (user_id, title, body, data, is_read, created_at) VALUES
    (miguel_id, 'New shift near you!',   'Cashier – 7.7 Mid-Year Sale — ₱130/hr at Ayala Center, Makati City',                      '{"type":"new_shift"}', false, now() - interval '2 hours'),
    (miguel_id, 'New shift near you!',   'Customer Service Floor Staff — ₱120/hr at Ayala Center, Makati City',                     '{"type":"new_shift"}', true,  now() - interval '3 hours'),
    (miguel_id, 'Payment received!',     'Your payout of ₱988.00 for Cashier – Pre-Sale Setup Day has been released to your GCash.', '{"type":"payment"}',   false, '2026-06-28 10:05:00+08'),
    (sofia_id,  'Application approved!', 'Your application for Barista – Weekend Rush has been approved!',                          '{"type":"approved"}',  false, now() - interval '1 hour'),
    (sofia_id,  'Payment received!',     'Your payout of ₱655.50 for Lunch Service Crew has been released to your Maya wallet.',    '{"type":"payment"}',   true,  '2026-06-26 09:05:00+08'),
    (renz_id,   'New shift near you!',   'Event Staff – BGC Weekend Market — ₱140/hr at BGC',                                       '{"type":"new_shift"}', false, now() - interval '4 hours'),
    (renz_id,   'Dispute update',        'Your dispute has been received and is under review. Expect a response within 48 hours.',   '{"type":"dispute"}',   false, now() - interval '1 hour'),
    (claire_id, 'New shift near you!',   'Customer Service Floor Staff — ₱120/hr at Ayala Center, Makati City',                     '{"type":"new_shift"}', false, now() - interval '2 hours');

  -- ── Messages ─────────────────────────────────────────────────────────────────
  INSERT INTO public.messages (sender_id, application_id, body, is_read, created_at) VALUES
    (ayala_id,  app_mig_ayala1, 'Hi Miguel! We reviewed your profile and you look like a great fit. Do you have experience with NCR POS systems?',                         true,  now() - interval '90 minutes'),
    (miguel_id, app_mig_ayala1, 'Hi Ms. Ayala! Yes, I''ve used NCR POS at SM North EDSA for 6 months. I can handle express and regular lanes.',                          true,  now() - interval '80 minutes'),
    (ayala_id,  app_mig_ayala1, 'Perfect! Please arrive at the staff entrance (basement B2) by 7:45am. Bring a valid ID for the guard. Uniform top is white polo.',     false, now() - interval '70 minutes'),
    (miguel_id, app_mig_ayala1, 'Got it! I''ll be there. Thank you for the opportunity!',                                                                               false, now() - interval '60 minutes');

  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'Seed complete! All accounts, shifts, and demo data inserted.';
END $$;
