-- UrbanEstate Seed Data
-- Run AFTER migration.sql and AFTER creating test users via Supabase Auth
-- 
-- IMPORTANT: Replace the UUIDs below with actual user IDs from your auth.users table.
-- You can create users at: Supabase Dashboard > Authentication > Users > Add User
--
-- Example steps:
-- 1. Create user: ahmed@example.com (password: test123456)
-- 2. Create user: fatima@example.com (password: test123456)  
-- 3. Copy their UUIDs from the Users table
-- 4. Replace the placeholder UUIDs below

-- =============================================
-- PLACEHOLDER UUIDs — UPDATE THESE!
-- =============================================
-- Agent 1: ahmed@example.com  → Replace '11111111-1111-1111-1111-111111111111'
-- Agent 2: fatima@example.com → Replace '22222222-2222-2222-2222-222222222222'

-- =============================================
-- PROFILES (will be auto-created by trigger, but update them)
-- =============================================
UPDATE public.profiles
SET
  name = 'Zuhab Gohar',
  phone = '+923177779990',
  whatsapp_number = '923177779990',
  bio = 'Experienced real estate agent specializing in Lahore''s premium neighborhoods. Over 10 years of helping families find their perfect rental homes.',
  service_areas = ARRAY['Iqbal Town', 'DHA', 'Johar Town'],
  is_public = true
WHERE id = '036a28d0-fdf4-456b-9c65-df2ea8ed4e92';

UPDATE public.profiles
SET
  name = 'Salman Iqbal',
  phone = '+923218636506',
  whatsapp_number = '923218636506',
  bio = 'Lahore-based agent with expertise in affordable family homes and apartments. Known for transparent dealings and responsive communication.',
  service_areas = ARRAY['Gulberg', 'Cantt', 'Bahria Town'],
  is_public = true
WHERE id = 'f9ab1410-a594-4957-aab0-02578229bcb0';

-- =============================================
-- PROPERTIES
-- =============================================

-- Ahmed's properties (Karachi)
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '036a28d0-fdf4-456b-9c65-df2ea8ed4e92',
   'Modern 2BR Apartment in Gulshan', 'apartment', 45000, 90000, 'PKR',
   'Karachi', 'Gulshan-e-Iqbal', 'Block 10-A, Street 5',
   2, 1, 1100, true,
   ARRAY['AC', 'Parking', 'Elevator', 'Security', 'Generator'],
   'Beautifully furnished 2-bedroom apartment in the heart of Gulshan-e-Iqbal. Recently renovated with modern kitchen, spacious living room, and 24/7 security. Walking distance to markets and schools. Perfect for a small family or working professionals.',
   'published'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '036a28d0-fdf4-456b-9c65-df2ea8ed4e92',
   'Spacious 3BR House in DHA Phase 6', 'house', 85000, 170000, 'PKR',
   'Karachi', 'DHA', 'Phase 6, Street 12, Lane 3',
   3, 2, 2200, false,
   ARRAY['Parking', 'Garden', 'Servant Quarter', 'Water Tank', 'CCTV'],
   'A well-maintained 3-bedroom independent house in DHA Phase 6. Features include a lush front garden, dedicated parking for 2 cars, servant quarter, and separate dining area. Ideal for families looking for a peaceful residential environment.',
   'published'),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '036a28d0-fdf4-456b-9c65-df2ea8ed4e92',
   'Premium Studio Flat in Clifton', 'flat', 30000, 60000, 'PKR',
   'Karachi', 'Clifton', 'Block 5, Sea View Apartments',
   1, 1, 650, true,
   ARRAY['AC', 'WiFi', 'Gym', 'Elevator', 'Laundry', 'Security'],
   'Compact yet luxurious studio flat with sea-facing views. Fully furnished with modern amenities including gym access, high-speed WiFi, and in-building laundry. Perfect for single professionals or couples.',
   'published');

-- Fatima's properties (Lahore)
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'f9ab1410-a594-4957-aab0-02578229bcb0',
   'Elegant 4BR House in Gulberg', 'house', 120000, 240000, 'PKR',
   'Lahore', 'Gulberg', 'Main Boulevard, Block III',
   4, 3, 3500, true,
   ARRAY['AC', 'Parking', 'Garden', 'Generator', 'Servant Quarter', 'Security', 'CCTV'],
   'A stunning 4-bedroom fully furnished house located on Gulberg Main Boulevard. Features marble flooring, modular kitchen, large lawn, and a beautifully designed drawing room. Perfect for executives or large families.',
   'published'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'f9ab1410-a594-4957-aab0-02578229bcb0',
   'Cozy 2BR Apartment in DHA Lahore', 'apartment', 55000, 110000, 'PKR',
   'Lahore', 'DHA', 'Phase 5, Sector C',
   2, 2, 1300, false,
   ARRAY['Parking', 'Elevator', 'Security', 'Balcony', 'Generator'],
   'Brand new 2-bedroom apartment in DHA Phase 5. Featuring an open-plan living area, modern bathrooms, and a spacious balcony with city views. Close to restaurants, shopping malls, and hospitals.',
   'published'),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'f9ab1410-a594-4957-aab0-02578229bcb0',
   'Budget-Friendly Flat in Bahria Town', 'flat', 25000, 50000, 'PKR',
   'Lahore', 'Bahria Town', 'Sector B, Safari Villas',
   2, 1, 900, false,
   ARRAY['Parking', 'Security', 'Water Tank'],
   'Affordable 2-bedroom flat in the secure community of Bahria Town Lahore. Gated community with parks, mosques, and commercial areas nearby. Great value for budget-conscious families.',
   'draft');

-- =============================================
-- PROPERTY PHOTOS (using placeholder images)
-- =============================================
INSERT INTO public.property_photos (property_id, url, position, is_cover) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 0, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 1, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', 2, false),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 0, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 1, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', 2, false),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 0, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80', 1, false),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 0, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80', 1, false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80', 2, false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', 3, false),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', 0, true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80', 1, false),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80', 0, true);

-- =============================================
-- PROPERTY BLOCKS (sample unavailable dates)
-- =============================================
INSERT INTO public.property_blocks (property_id, start_date, end_date, note) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-03-01', '2026-03-15', 'Reserved for maintenance'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-04-10', '2026-04-20', 'Tenant moving out'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-03-05', '2026-03-25', 'Under renovation'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '2026-02-20', '2026-03-10', 'Current tenant lease ending'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2026-04-01', '2026-04-30', 'Booked for April');
