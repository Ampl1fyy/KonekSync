// Replaces broken SQL-inserted auth users with properly GoTrue-created ones.
// Deletes the old rows (cascades to profiles/businesses/shifts), recreates everything.
// Run once: node scripts/fix-seed-auth.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const OLD_UUIDS = [
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000003',
];

async function deleteOldUsers() {
  console.log('Deleting broken SQL-inserted auth users...');
  for (const id of OLD_UUIDS) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error && !error.message.includes('not found') && !error.message.includes('User not found')) {
      console.warn(`  ! Could not delete ${id}: ${error.message}`);
    }
  }
  // Also nuke directly via SQL in case GoTrue can't see them
  const { error } = await supabase.rpc('delete_old_seed_users');
  if (error) {
    // RPC won't exist yet on first run — that's fine, we'll handle it below
  }
}

async function createUser(email, password, metadata) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw new Error(`Failed to create ${email}: ${error.message}`);
  console.log(`  ✓  ${email}  →  ${data.user.id}`);
  return data.user.id;
}

async function main() {
  await deleteOldUsers();

  console.log('\nCreating auth users via GoTrue admin API...');

  const bizOwnerId  = await createUser('business@trabahost.ph', 'Password123!',
    { full_name: 'Maria Santos',    role: 'business', phone: '+639171234567' });
  const bulOwnerId  = await createUser('bulacan@trabahost.ph',  'Password123!',
    { full_name: 'Carlo Mendoza',   role: 'business', phone: '+639221234567' });
  const jazzOwnerId = await createUser('smjazz@trabahost.ph',   'Password123!',
    { full_name: 'Liza Fontanilla', role: 'business', phone: '+639231234567' });
  const worker1Id   = await createUser('juan@trabahost.ph',      'Password123!',
    { full_name: 'Juan dela Cruz',  role: 'worker',   phone: '+639181234567' });
  const worker2Id   = await createUser('ana@trabahost.ph',       'Password123!',
    { full_name: 'Ana Reyes',       role: 'worker',   phone: '+639191234567' });
  const worker3Id   = await createUser('pedro@trabahost.ph',     'Password123!',
    { full_name: 'Pedro Garcia',    role: 'worker',   phone: '+639201234567' });

  console.log('\nUpdating profiles...');

  const profileUpdates = [
    { id: bizOwnerId,  role: 'business', phone: '+639171234567', city: 'Quezon City',
      location: 'SRID=4326;POINT(121.0437 14.6760)', kyc_status: 'verified', is_active: true },
    { id: bulOwnerId,  role: 'business', phone: '+639221234567', city: 'Guiguinto',
      location: 'SRID=4326;POINT(120.8812 14.8348)', kyc_status: 'verified', is_active: true },
    { id: jazzOwnerId, role: 'business', phone: '+639231234567', city: 'Makati',
      location: 'SRID=4326;POINT(121.0144 14.5578)', kyc_status: 'verified', is_active: true },
    { id: worker1Id,   role: 'worker',   phone: '+639181234567', city: 'Quezon City',
      location: 'SRID=4326;POINT(121.0500 14.6800)', kyc_status: 'verified', is_active: true,
      reliability_score: 4.80, average_rating: 4.75, total_ratings: 8,
      e_wallet_number: '09181234567', e_wallet_provider: 'gcash' },
    { id: worker2Id,   role: 'worker',   phone: '+639191234567', city: 'Quezon City',
      location: 'SRID=4326;POINT(121.0400 14.6700)', kyc_status: 'verified', is_active: true,
      reliability_score: 4.50, average_rating: 4.60, total_ratings: 5,
      e_wallet_number: '09191234567', e_wallet_provider: 'maya' },
    { id: worker3Id,   role: 'worker',   phone: '+639201234567', city: 'Quezon City',
      location: 'SRID=4326;POINT(121.0350 14.6650)', kyc_status: 'pending', is_active: true },
  ];

  for (const p of profileUpdates) {
    const { error } = await supabase.from('profiles').update(p).eq('id', p.id);
    if (error) console.error(`  ✗  profile ${p.id}: ${error.message}`);
    else console.log(`  ✓  profile updated`);
  }

  // Skill IDs (seeded by 001_initial_schema.sql)
  const { data: skills } = await supabase.from('skills').select('id, name');
  const skill = (name) => skills.find(s => s.name === name)?.id ?? null;

  console.log('\nInserting businesses...');

  const { data: biz1, error: e1 } = await supabase.from('businesses').insert({
    owner_id: bizOwnerId,
    name: 'SM Supermarket North EDSA',
    description: 'One of the largest supermarket chains in the Philippines.',
    industry: 'Retail',
    address: 'SM City North EDSA, Quezon City, Metro Manila',
    location: 'SRID=4326;POINT(121.0322 14.6563)',
    city: 'Quezon City', is_verified: true,
  }).select('id').single();
  if (e1) { console.error('  ✗  SM North EDSA:', e1.message); return; }
  console.log(`  ✓  SM Supermarket North EDSA  →  ${biz1.id}`);

  const { data: biz2, error: e2 } = await supabase.from('businesses').insert({
    owner_id: bulOwnerId,
    name: 'Mendoza Rice Trading',
    description: 'Family-owned rice trading and distribution business.',
    industry: 'Agriculture / Logistics',
    address: 'Purok 3, Malis, Guiguinto, Bulacan',
    location: 'SRID=4326;POINT(120.8812 14.8348)',
    city: 'Guiguinto', is_verified: true,
  }).select('id').single();
  if (e2) { console.error('  ✗  Mendoza Rice Trading:', e2.message); return; }
  console.log(`  ✓  Mendoza Rice Trading  →  ${biz2.id}`);

  const { data: biz3, error: e3 } = await supabase.from('businesses').insert({
    owner_id: jazzOwnerId,
    name: 'SM Jazz Makati',
    description: 'Lifestyle mall in the heart of Makati\'s Bel-Air district.',
    industry: 'Retail',
    address: 'Jazz Mall, Nicanor Garcia St, Bel-Air, Makati City',
    location: 'SRID=4326;POINT(121.0144 14.5578)',
    city: 'Makati', is_verified: true,
  }).select('id').single();
  if (e3) { console.error('  ✗  SM Jazz Makati:', e3.message); return; }
  console.log(`  ✓  SM Jazz Makati  →  ${biz3.id}`);

  console.log('\nInserting shifts...');

  const shifts = [
    // SM North EDSA
    { business_id: biz1.id, title: 'Cashier – Weekend Sale', role_required: 'Cashier',
      skill_id: skill('Cashiering'), slots: 3, hourly_rate: 120,
      time_start: offset('+2 days'), time_end: offset('+2 days', 8),
      description: 'Help manage checkout lanes during our weekend sale. Uniform provided.' },
    { business_id: biz1.id, title: 'Customer Service Rep', role_required: 'Customer Service Rep',
      skill_id: skill('Customer Service'), slots: 2, hourly_rate: 110,
      time_start: offset('+3 days'), time_end: offset('+3 days', 6),
      description: 'Assist customers on the floor and answer inquiries.' },
    { business_id: biz1.id, title: 'Food Court Crew', role_required: 'Food Crew',
      skill_id: skill('Food Service'), slots: 2, slots_filled: 2, hourly_rate: 115,
      time_start: offset('+1 day'), time_end: offset('+1 day', 7), status: 'filled',
      description: 'Assist in the SM Food Court with food prep and serving.' },
    // Bulacan
    { business_id: biz2.id, title: 'Rice Sack Sorter', role_required: 'Warehouse Staff',
      skill_id: null, slots: 4, hourly_rate: 100,
      time_start: offset('+1 day'), time_end: offset('+1 day', 8),
      description: 'Sort and stack 50kg rice sacks. Meals provided.' },
    { business_id: biz2.id, title: 'Delivery Assistant', role_required: 'Delivery Helper',
      skill_id: null, slots: 2, hourly_rate: 110,
      time_start: offset('+2 days'), time_end: offset('+2 days', 9),
      description: 'Assist driver delivering rice sacks across Bulacan.' },
    // SM Jazz Makati – May 7
    { business_id: biz3.id, title: 'Cashier – Morning Shift', role_required: 'Cashier',
      skill_id: skill('Cashiering'), slots: 3, hourly_rate: 120,
      time_start: '2026-05-07T08:00:00+08:00', time_end: '2026-05-07T16:00:00+08:00',
      description: 'Morning checkout lanes during mall hours. Uniform provided.' },
    { business_id: biz3.id, title: 'Customer Service Associate', role_required: 'Customer Service Rep',
      skill_id: skill('Customer Service'), slots: 2, hourly_rate: 110,
      time_start: '2026-05-07T10:00:00+08:00', time_end: '2026-05-07T18:00:00+08:00',
      description: 'Assist shoppers with inquiries and mall services.' },
    { business_id: biz3.id, title: 'Food Court Crew', role_required: 'Food Crew',
      skill_id: skill('Food Service'), slots: 4, hourly_rate: 115,
      time_start: '2026-05-07T11:00:00+08:00', time_end: '2026-05-07T19:00:00+08:00',
      description: 'Food prep and serving during peak lunch and dinner hours.' },
    { business_id: biz3.id, title: 'Promotions & Leafleting Staff', role_required: 'Promo Staff',
      skill_id: skill('Promotions'), slots: 3, hourly_rate: 105,
      time_start: '2026-05-07T12:00:00+08:00', time_end: '2026-05-07T20:00:00+08:00',
      description: 'Distribute flyers and assist with in-mall activations.' },
    { business_id: biz3.id, title: 'Cashier – Evening Shift', role_required: 'Cashier',
      skill_id: skill('Cashiering'), slots: 2, hourly_rate: 120,
      time_start: '2026-05-07T14:00:00+08:00', time_end: '2026-05-07T22:00:00+08:00',
      description: 'Cover the evening rush. POS experience is a plus.' },
  ];

  for (const s of shifts) {
    const row = {
      status: 'open', slots_filled: 0, qr_code: crypto.randomUUID(),
      location: s.business_id === biz1.id
        ? 'SRID=4326;POINT(121.0322 14.6563)'
        : s.business_id === biz2.id
        ? 'SRID=4326;POINT(120.8812 14.8348)'
        : 'SRID=4326;POINT(121.0144 14.5578)',
      address: s.business_id === biz1.id
        ? 'SM City North EDSA, Quezon City'
        : s.business_id === biz2.id
        ? 'Purok 3, Malis, Guiguinto, Bulacan'
        : 'Jazz Mall, Nicanor Garcia St, Bel-Air, Makati City',
      ...s,
    };
    const { error } = await supabase.from('shifts').insert(row);
    if (error) console.error(`  ✗  ${s.title}: ${error.message}`);
    else console.log(`  ✓  ${s.title}`);
  }

  console.log('\n─────────────────────────────────────────');
  console.log('Seed complete! Login credentials (all use Password123!):');
  console.log(`  business@trabahost.ph  (SM North EDSA)`);
  console.log(`  bulacan@trabahost.ph   (Mendoza Rice Trading)`);
  console.log(`  smjazz@trabahost.ph    (SM Jazz Makati)`);
  console.log(`  juan@trabahost.ph      (worker)`);
  console.log(`  ana@trabahost.ph       (worker)`);
  console.log(`  pedro@trabahost.ph     (worker)`);
  console.log('─────────────────────────────────────────\n');

  console.log('To make smjazz an admin, run in Supabase SQL Editor:');
  console.log(`  UPDATE public.profiles SET role = 'admin' WHERE id = '${jazzOwnerId}';`);
}

function offset(day, hours = 0) {
  const d = new Date();
  if (day === '+1 day')  d.setDate(d.getDate() + 1);
  if (day === '+2 days') d.setDate(d.getDate() + 2);
  if (day === '+3 days') d.setDate(d.getDate() + 3);
  d.setHours(9 + hours, 0, 0, 0);
  return d.toISOString();
}

main().catch((err) => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
