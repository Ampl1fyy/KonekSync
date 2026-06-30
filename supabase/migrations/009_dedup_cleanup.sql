-- KonekSync: Remove duplicate seed data
-- Seed was run twice (04:22:41 and 07:16:57 on 2026-06-30)
-- Also removes stale May shifts from the original seed
-- Run in Supabase SQL Editor

BEGIN;

-- 1. Ratings linked to duplicate/old applications
DELETE FROM public.ratings
WHERE application_id IN (
  '0b24167c-4797-4029-9b82-53112793f39b',
  'a5981434-0d02-4266-aa09-c6c0870f6ea2',
  'ec13a296-b1dc-495d-a630-20b4b6f94a25',
  'c50a0bd7-98cd-46ea-b421-07bcabba957b',
  '4786810a-9b97-4ee4-bb0a-09aff8f88d20',
  '68962915-8334-45a6-baa6-34d19e613699',
  '4b32e4d4-3ee6-48f3-aa07-7cda03242007',
  'd3967c8a-6dd1-43b2-8223-6289cac928b5',
  '78fd789d-383e-415b-b833-051485151e9e'
);

-- 2. Disputes linked to duplicate/old applications
DELETE FROM public.disputes
WHERE application_id IN (
  '0b24167c-4797-4029-9b82-53112793f39b',
  'a5981434-0d02-4266-aa09-c6c0870f6ea2',
  'ec13a296-b1dc-495d-a630-20b4b6f94a25',
  'c50a0bd7-98cd-46ea-b421-07bcabba957b',
  '4786810a-9b97-4ee4-bb0a-09aff8f88d20',
  '68962915-8334-45a6-baa6-34d19e613699',
  '4b32e4d4-3ee6-48f3-aa07-7cda03242007',
  'd3967c8a-6dd1-43b2-8223-6289cac928b5',
  '78fd789d-383e-415b-b833-051485151e9e'
);

-- 3. Messages linked to duplicate/old applications
DELETE FROM public.messages
WHERE application_id IN (
  '0b24167c-4797-4029-9b82-53112793f39b',
  'a5981434-0d02-4266-aa09-c6c0870f6ea2',
  'ec13a296-b1dc-495d-a630-20b4b6f94a25',
  'c50a0bd7-98cd-46ea-b421-07bcabba957b',
  '4786810a-9b97-4ee4-bb0a-09aff8f88d20',
  '68962915-8334-45a6-baa6-34d19e613699',
  '4b32e4d4-3ee6-48f3-aa07-7cda03242007',
  'd3967c8a-6dd1-43b2-8223-6289cac928b5',
  '78fd789d-383e-415b-b833-051485151e9e'
);

-- 4. Duplicate transactions (second seed run)
DELETE FROM public.transactions
WHERE id IN (
  'a6b0bacd-d39b-4b02-b191-9f3c95b7a81f',
  '37ef849f-f8d3-4f3b-b4b2-800000980f23'
);

-- 5. Duplicate + old applications
DELETE FROM public.applications
WHERE id IN (
  '0b24167c-4797-4029-9b82-53112793f39b',
  'a5981434-0d02-4266-aa09-c6c0870f6ea2',
  'ec13a296-b1dc-495d-a630-20b4b6f94a25',
  'c50a0bd7-98cd-46ea-b421-07bcabba957b',
  '4786810a-9b97-4ee4-bb0a-09aff8f88d20',
  '68962915-8334-45a6-baa6-34d19e613699',
  '4b32e4d4-3ee6-48f3-aa07-7cda03242007',
  'd3967c8a-6dd1-43b2-8223-6289cac928b5',
  '78fd789d-383e-415b-b833-051485151e9e'
);

-- 6. Duplicate shifts (second run) + stale May shifts
DELETE FROM public.shifts
WHERE id IN (
  -- Second seed run duplicates
  '30f575ba-ad1a-4a30-9fbc-36599df3c5cf',
  'a42e4f07-72af-4ea4-8532-7cdaf175f2ad',
  '17f37ffd-af1d-45d7-addc-8d5973073f73',
  '5bd69075-a07c-4c82-9e64-e8fa24fdfcab',
  '4e28f3b9-76c4-4165-b8d6-c6b92d750d82',
  '19f5cc9e-f2a8-4767-ba88-1e72a523782a',
  '291a8dd4-b7b5-40c1-9bcb-040bff37acc7',
  '951b961c-f7df-411f-ac21-29e3547875da',
  '5cf97366-95fe-4b70-b86f-43ca6982e0d1',
  -- Old May shifts (pre-demo)
  'cf62be49-07bb-440b-b6e6-a9938ed87909',
  '09ad5ffd-4cc0-4775-b140-866ea498abdc',
  '2d396305-1c22-40d2-ade1-3a1f492a085a',
  '465cf8c9-3c20-4a69-be81-2dd757c4f293',
  'd1ae7c78-b445-475f-ba5e-9df53e22e1c6',
  '1de34c42-236f-4810-a0d7-6c503c559acf',
  '2543722e-97de-40e0-add6-4b4f42e8f4a0',
  '36ed60a1-41dc-468f-b107-62818cfb7c0f',
  'b135fbe0-fdd1-4391-80cc-d48c928bc68f',
  'b977a355-1c29-45a2-ba71-a51b2e547afc'
);

COMMIT;

-- Verify
SELECT COUNT(*) as shifts_remaining FROM public.shifts;
SELECT COUNT(*) as transactions_remaining FROM public.transactions;
SELECT COUNT(*) as applications_remaining FROM public.applications;
