-- ==========================================================
-- UrbanRealEstate Multi-Region Seed Data
-- Markets: US, Europe (UK/Spain/Italy), Middle East (UAE/Saudi)
-- Plus: leads, availability blocks, translations, flags
--
-- Run AFTER: migration.sql, seed.sql, ai_migration.sql
-- ==========================================================

-- =============================================
-- 1. INTERNATIONAL AGENT PROFILES
-- NOTE: These use generated UUIDs.
-- If you want them tied to auth users, first create
-- the users in Supabase Auth, then update the IDs below.
-- =============================================

-- US Agent - New York
INSERT INTO public.profiles (id, name, phone, whatsapp_number, bio, service_areas, is_public)
VALUES ('a1000000-0001-4000-a000-000000000001',
  'Michael Torres',
  '+12125551001',
  '12125551001',
  'Licensed NYC real estate agent specializing in Manhattan and Brooklyn luxury rentals. 12 years of experience helping professionals find their ideal urban home.',
  ARRAY['Manhattan', 'Brooklyn', 'Queens'],
  true
) ON CONFLICT (id) DO NOTHING;

-- US Agent - Miami
INSERT INTO public.profiles (id, name, phone, whatsapp_number, bio, service_areas, is_public)
VALUES ('a1000000-0002-4000-a000-000000000002',
  'Sarah Mitchell',
  '+13055551002',
  '13055551002',
  'South Florida specialist focused on Brickell, Wynwood, and Miami Beach. Known for matching tenants with beachfront and downtown lifestyle properties.',
  ARRAY['Brickell', 'Wynwood', 'Miami Beach', 'Coral Gables'],
  true
) ON CONFLICT (id) DO NOTHING;

-- UK Agent - London
INSERT INTO public.profiles (id, name, phone, whatsapp_number, bio, service_areas, is_public)
VALUES ('a1000000-0003-4000-a000-000000000003',
  'James Whitfield',
  '+447700900123',
  '447700900123',
  'ARLA-qualified letting agent in Central London. Expert in Kensington, Chelsea, and Mayfair premium lets for international executives and diplomats.',
  ARRAY['Kensington', 'Chelsea', 'Mayfair', 'Canary Wharf'],
  true
) ON CONFLICT (id) DO NOTHING;

-- Spain Agent - Barcelona
INSERT INTO public.profiles (id, name, phone, whatsapp_number, bio, service_areas, is_public)
VALUES ('a1000000-0004-4000-a000-000000000004',
  'Elena García',
  '+34612345678',
  '34612345678',
  'Agente inmobiliaria en Barcelona. Specialized in Eixample, Gràcia, and Barceloneta. Fluent in English, Spanish, and Catalan.',
  ARRAY['Eixample', 'Gràcia', 'Barceloneta', 'Born'],
  true
) ON CONFLICT (id) DO NOTHING;

-- UAE Agent - Dubai
INSERT INTO public.profiles (id, name, phone, whatsapp_number, bio, service_areas, is_public)
VALUES ('a1000000-0005-4000-a000-000000000005',
  'Omar Al-Rashid',
  '+971501234567',
  '971501234567',
  'RERA-certified broker in Dubai with 8+ years of experience. Specializing in Marina, Downtown, and JBR luxury apartments for expats and investors.',
  ARRAY['Dubai Marina', 'Downtown Dubai', 'JBR', 'Business Bay', 'Palm Jumeirah'],
  true
) ON CONFLICT (id) DO NOTHING;

-- Saudi Agent - Riyadh
INSERT INTO public.profiles (id, name, phone, whatsapp_number, bio, service_areas, is_public)
VALUES ('a1000000-0006-4000-a000-000000000006',
  'Abdulaziz Al-Saud',
  '+966501234567',
  '966501234567',
  'Professional real estate consultant based in Riyadh. Expert in Al Olaya, Diplomatic Quarter, and King Abdullah Financial District.',
  ARRAY['Al Olaya', 'Diplomatic Quarter', 'KAFD', 'Al Malqa'],
  true
) ON CONFLICT (id) DO NOTHING;

-- Italy Agent - Rome
INSERT INTO public.profiles (id, name, phone, whatsapp_number, bio, service_areas, is_public)
VALUES ('a1000000-0007-4000-a000-000000000007',
  'Marco Bianchi',
  '+393912345678',
  '393912345678',
  'Agente immobiliare a Roma. Specialized in Trastevere, Centro Storico, and Prati. Expert in historic apartment rentals for international tenants.',
  ARRAY['Trastevere', 'Centro Storico', 'Prati', 'Testaccio'],
  true
) ON CONFLICT (id) DO NOTHING;


-- =============================================
-- 2. US PROPERTIES
-- =============================================
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status) VALUES

-- NEW YORK
('b1000000-0001-4000-b000-000000000001', 'a1000000-0001-4000-a000-000000000001',
 'Luxury 2BR Condo in Midtown Manhattan', 'apartment', 4500, 9000, 'USD',
 'New York', 'Midtown', '350 W 42nd St, Apt 18C',
 2, 2, 1100, true,
 ARRAY['Doorman', 'Gym', 'Rooftop', 'Laundry', 'AC', 'Elevator', 'Parking'],
 'Stunning fully furnished 2-bedroom condo in the heart of Midtown Manhattan. Floor-to-ceiling windows with breathtaking city views. Full-size kitchen with stainless steel appliances. Building features 24-hour doorman, state-of-the-art fitness center, and landscaped rooftop terrace. Steps from Times Square, Bryant Park, and multiple subway lines.',
 'published'),

('b1000000-0002-4000-b000-000000000002', 'a1000000-0001-4000-a000-000000000001',
 'Modern 1BR in Brooklyn Heights', 'apartment', 2800, 5600, 'USD',
 'New York', 'Brooklyn Heights', '85 Montague St, Unit 4A',
 1, 1, 750, false,
 ARRAY['Elevator', 'Laundry', 'AC', 'Bike Storage', 'Rooftop'],
 'Charming 1-bedroom apartment in tree-lined Brooklyn Heights. Exposed brick walls, hardwood floors, and abundant natural light. Walk to Brooklyn Bridge Park, the Promenade, and excellent restaurants. Easy commute to Manhattan via 2/3/4/5 trains.',
 'published'),

('b1000000-0003-4000-b000-000000000003', 'a1000000-0001-4000-a000-000000000001',
 'Spacious 3BR Family Home in Queens', 'house', 3200, 6400, 'USD',
 'New York', 'Forest Hills', '108-15 72nd Ave',
 3, 2, 1800, false,
 ARRAY['Garden', 'Parking', 'Washer/Dryer', 'Basement', 'AC'],
 'Beautiful 3-bedroom detached house in the family-friendly Forest Hills neighborhood. Large backyard, private driveway for 2 cars, finished basement, and eat-in kitchen. Excellent school district. Near Forest Hills Gardens, shopping, and the E/F/M/R trains.',
 'published'),

-- MIAMI
('b1000000-0004-4000-b000-000000000004', 'a1000000-0002-4000-a000-000000000002',
 'Oceanfront Studio in South Beach', 'flat', 2200, 4400, 'USD',
 'Miami', 'South Beach', '1500 Ocean Dr, Suite 701',
 1, 1, 550, true,
 ARRAY['Pool', 'Beach Access', 'Gym', 'Concierge', 'AC', 'Parking'],
 'Wake up to ocean views in this fully furnished studio on iconic Ocean Drive. Resort-style amenities including infinity pool, private beach access, and on-site concierge. Walking distance to Lincoln Road, Art Deco Historic District, and Miami''s legendary nightlife.',
 'published'),

('b1000000-0005-4000-b000-000000000005', 'a1000000-0002-4000-a000-000000000002',
 'Modern 2BR Loft in Wynwood Arts District', 'apartment', 3100, 6200, 'USD',
 'Miami', 'Wynwood', '250 NW 24th St, Loft 3B',
 2, 2, 1350, true,
 ARRAY['AC', 'Gym', 'Rooftop Pool', 'Smart Home', 'Parking', 'Bike Storage'],
 'Industrial-chic loft in the heart of Wynwood Arts District. Soaring 14-foot ceilings, polished concrete floors, and smart home technology throughout. Building features rooftop pool with skyline views. Surrounded by galleries, craft breweries, and the famous Wynwood Walls.',
 'published'),

('b1000000-0006-4000-b000-000000000006', 'a1000000-0002-4000-a000-000000000002',
 'Elegant 3BR Penthouse in Brickell', 'apartment', 5500, 11000, 'USD',
 'Miami', 'Brickell', '1010 Brickell Ave, PH 42',
 3, 3, 2100, true,
 ARRAY['Pool', 'Spa', 'Gym', 'Concierge', 'Valet Parking', 'Smart Home', 'AC', 'Balcony'],
 'Breathtaking penthouse in Brickell''s most prestigious tower. Panoramic bay and city views from wraparound terrace. Chef''s kitchen with Sub-Zero and Wolf appliances. Five-star amenities: resort pool, spa, private cinema, wine cellar, and 24-hour concierge.',
 'published');


-- =============================================
-- 3. UK PROPERTIES (London)
-- =============================================
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status) VALUES

('b1000000-0007-4000-b000-000000000007', 'a1000000-0003-4000-a000-000000000003',
 'Elegant 2BR Flat in Kensington', 'flat', 3200, 7400, 'GBP',
 'London', 'Kensington', '45 Kensington Church St, Flat 2',
 2, 1, 850, true,
 ARRAY['Garden Access', 'Washer/Dryer', 'Dishwasher', 'Period Features', 'Central Heating'],
 'Beautifully appointed 2-bedroom flat in a stunning Victorian conversion on Kensington Church Street. Original period features including high ceilings and ornate cornicing, combined with modern comforts. Access to communal gardens. Minutes from High Street Kensington tube.',
 'published'),

('b1000000-0008-4000-b000-000000000008', 'a1000000-0003-4000-a000-000000000003',
 'Luxury 1BR Apartment in Canary Wharf', 'apartment', 2400, 5540, 'GBP',
 'London', 'Canary Wharf', 'Pan Peninsula, E14 9HN',
 1, 1, 650, true,
 ARRAY['Concierge', 'Gym', 'Pool', 'Parking', 'Balcony', 'AC'],
 'Sleek 1-bedroom apartment in the iconic Pan Peninsula tower. Floor-to-ceiling windows with stunning Docklands views. Building features include 25m swimming pool, gym, spa, and 24-hour concierge. Direct access to Canary Wharf shopping and Jubilee line.',
 'published'),

('b1000000-0009-4000-b000-000000000009', 'a1000000-0003-4000-a000-000000000003',
 'Charming 3BR Townhouse in Chelsea', 'house', 5800, 13340, 'GBP',
 'London', 'Chelsea', '12 Flood Street, SW3',
 3, 2, 1600, false,
 ARRAY['Garden', 'Period Features', 'Central Heating', 'Washer/Dryer', 'Storage'],
 'Exquisite Georgian townhouse on a quiet Chelsea side street. Three generous bedrooms, two reception rooms, and a private south-facing garden. Original fireplaces and shutters throughout. Walking distance to Sloane Square, King''s Road, and the Thames.',
 'published');


-- =============================================
-- 4. SPAIN PROPERTIES (Barcelona)
-- =============================================
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status) VALUES

('b1000000-0010-4000-b000-000000000010', 'a1000000-0004-4000-a000-000000000004',
 'Bright 2BR Apartment in Eixample', 'apartment', 1800, 3600, 'EUR',
 'Barcelona', 'Eixample', 'Carrer de Valencia, 285, 3-1',
 2, 1, 900, true,
 ARRAY['AC', 'Balcony', 'Elevator', 'Washer/Dryer', 'Central Heating'],
 'Stunning modernist apartment on a classic Eixample boulevard. High ceilings with original tile floors and abundant natural light through interior patio windows. Two spacious bedrooms, fully equipped kitchen, and charming balcony. Steps from Passeig de Gràcia and La Pedrera.',
 'published'),

('b1000000-0011-4000-b000-000000000011', 'a1000000-0004-4000-a000-000000000004',
 'Bohemian Studio in Gràcia', 'flat', 950, 1900, 'EUR',
 'Barcelona', 'Gràcia', 'Carrer de Verdi, 42, Àtic',
 1, 1, 450, true,
 ARRAY['Rooftop Terrace', 'AC', 'WiFi', 'Washer/Dryer'],
 'Cozy top-floor studio in the artsy Gràcia neighborhood. Private rooftop terrace with panoramic city views. Surrounded by independent boutiques, tapas bars, and Plaça del Sol. Easy access to Park Güell and Diagonal metro station.',
 'published'),

('b1000000-0012-4000-b000-000000000012', 'a1000000-0004-4000-a000-000000000004',
 'Beachfront 3BR in Barceloneta', 'apartment', 2800, 5600, 'EUR',
 'Barcelona', 'Barceloneta', 'Passeig Marítim de la Barceloneta, 15',
 3, 2, 1200, false,
 ARRAY['Beach Access', 'AC', 'Elevator', 'Balcony', 'Parking'],
 'Exceptional 3-bedroom apartment directly on the Barceloneta promenade. Wake up to Mediterranean sea views from the master bedroom. Open-plan living with terrace for al fresco dining. Steps from the beach, W Hotel, and Barcelona''s best seafood restaurants.',
 'published');


-- =============================================
-- 5. ITALY PROPERTIES (Rome)
-- =============================================
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status) VALUES

('b1000000-0013-4000-b000-000000000013', 'a1000000-0007-4000-a000-000000000007',
 'Historic 2BR in Trastevere', 'flat', 1600, 3200, 'EUR',
 'Rome', 'Trastevere', 'Via della Lungara, 18, Int. 3',
 2, 1, 800, true,
 ARRAY['AC', 'Washer/Dryer', 'Central Heating', 'Period Features'],
 'Charming apartment in a 17th-century palazzo in the heart of Trastevere. Terracotta floors, exposed wooden beams, and views of ivy-covered walls. Two comfortable bedrooms and a fully renovated kitchen. Steps from Piazza di Santa Maria and the Tiber river.',
 'published'),

('b1000000-0014-4000-b000-000000000014', 'a1000000-0007-4000-a000-000000000007',
 'Elegant 1BR near the Colosseum', 'apartment', 1400, 2800, 'EUR',
 'Rome', 'Centro Storico', 'Via dei Fori Imperiali, 45, P.2',
 1, 1, 550, true,
 ARRAY['AC', 'Elevator', 'WiFi', 'Central Heating'],
 'Live in the shadow of the Colosseum in this beautifully restored 1-bedroom apartment. Classical Roman architecture meets modern amenities. Views of the Forum from the bedroom window. Outstanding central location with excellent public transport connections.',
 'published');


-- =============================================
-- 6. UAE PROPERTIES (Dubai)
-- =============================================
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status) VALUES

('b1000000-0015-4000-b000-000000000015', 'a1000000-0005-4000-a000-000000000005',
 'Stunning 2BR with Marina View', 'apartment', 95000, 95000, 'AED',
 'Dubai', 'Dubai Marina', 'Marina Gate Tower 1, Unit 2301',
 2, 2, 1300, true,
 ARRAY['Pool', 'Gym', 'Concierge', 'Parking', 'AC', 'Balcony', 'Kids Play Area'],
 'Breathtaking 2-bedroom apartment with floor-to-ceiling windows overlooking Dubai Marina and the Arabian Sea. Fully furnished to the highest standard with designer furniture. Building has infinity pool, premium gym, kids'' play area, and 24/7 concierge. Walk to Marina Mall, JBR Beach, and the tram.',
 'published'),

('b1000000-0016-4000-b000-000000000016', 'a1000000-0005-4000-a000-000000000005',
 'Premium 1BR in Downtown Dubai', 'apartment', 75000, 75000, 'AED',
 'Dubai', 'Downtown Dubai', 'Boulevard Point, Unit 1504',
 1, 1, 850, true,
 ARRAY['Pool', 'Gym', 'Parking', 'AC', 'Concierge', 'SPA', 'Sauna'],
 'Luxurious 1-bedroom apartment with direct Burj Khalifa and Dubai Fountain views. Premium finishes throughout including marble bathrooms and fully fitted kitchen. Resort amenities including temperature-controlled pool, full-service spa, and valet parking. Steps from Dubai Mall.',
 'published'),

('b1000000-0017-4000-b000-000000000017', 'a1000000-0005-4000-a000-000000000005',
 'Exclusive 3BR Villa on Palm Jumeirah', 'house', 280000, 280000, 'AED',
 'Dubai', 'Palm Jumeirah', 'Frond N, Garden Homes',
 3, 4, 3800, true,
 ARRAY['Private Beach', 'Private Pool', 'Garden', 'Maid Room', 'Parking', 'AC', 'Smart Home', 'BBQ Area'],
 'Spectacular 3-bedroom garden villa on the Palm Jumeirah with private beach access. Expansive living spaces, private swimming pool, landscaped garden, and BBQ terrace. Includes maid''s room and driver''s room. Minutes from Nakheel Mall, Atlantis Hotel, and The Pointe.',
 'published'),

('b1000000-0018-4000-b000-000000000018', 'a1000000-0005-4000-a000-000000000005',
 'Smart Studio in Business Bay', 'flat', 42000, 42000, 'AED',
 'Dubai', 'Business Bay', 'Damac Towers, Unit 809',
 1, 1, 500, true,
 ARRAY['Pool', 'Gym', 'AC', 'Parking', 'Smart Home', 'Concierge'],
 'Compact smart studio in the buzzing Business Bay district. Fully automated with smart lighting, curtains, and climate control. Modern kitchen with integrated appliances. Building features rooftop infinity pool and fully equipped gym. Near Dubai Canal boardwalk.',
 'published');


-- =============================================
-- 7. SAUDI PROPERTIES (Riyadh)
-- =============================================
INSERT INTO public.properties (id, agent_id, title, type, rent, deposit, currency, city, area, street_address, beds, baths, size_sqft, furnished, amenities, description, status) VALUES

('b1000000-0019-4000-b000-000000000019', 'a1000000-0006-4000-a000-000000000006',
 'Executive 3BR in Al Olaya', 'apartment', 120000, 120000, 'SAR',
 'Riyadh', 'Al Olaya', 'Olaya Towers, Unit 2205',
 3, 3, 2200, true,
 ARRAY['Pool', 'Gym', 'Parking', 'AC', 'Maid Room', 'Concierge', 'Elevator'],
 'Premium 3-bedroom executive apartment in the heart of Riyadh''s business district. High-end finishes with marble floors and custom cabinetry. Includes maid''s room and dedicated parking. Building offers pool, gym, and 24-hour security. Walking distance to Kingdom Centre and Al Faisaliah Tower.',
 'published'),

('b1000000-0020-4000-b000-000000000020', 'a1000000-0006-4000-a000-000000000006',
 'Modern 2BR Compound Villa in Diplomatic Quarter', 'house', 95000, 95000, 'SAR',
 'Riyadh', 'Diplomatic Quarter', 'DQ Compound 7, Villa 14',
 2, 2, 1800, true,
 ARRAY['Pool', 'Gym', 'Garden', 'Parking', 'AC', 'Security', 'Kids Play Area', 'Tennis Court'],
 'Fully furnished 2-bedroom villa in a premium Western compound in the Diplomatic Quarter. Shared amenities include pool, tennis courts, gym, and children''s playground. 24/7 security with gated access. Popular with expat families and embassy staff. Near IKEA, Panorama Mall.',
 'published');


-- =============================================
-- 8. PROPERTY PHOTOS (all markets)
-- =============================================
INSERT INTO public.property_photos (property_id, url, position, is_cover) VALUES
-- NYC
('b1000000-0001-4000-b000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 0, true),
('b1000000-0001-4000-b000-000000000001', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 1, false),
('b1000000-0001-4000-b000-000000000001', 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80', 2, false),
('b1000000-0002-4000-b000-000000000002', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 0, true),
('b1000000-0002-4000-b000-000000000002', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', 1, false),
('b1000000-0003-4000-b000-000000000003', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 0, true),
('b1000000-0003-4000-b000-000000000003', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 1, false),
('b1000000-0003-4000-b000-000000000003', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', 2, false),
-- Miami
('b1000000-0004-4000-b000-000000000004', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', 0, true),
('b1000000-0004-4000-b000-000000000004', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 1, false),
('b1000000-0005-4000-b000-000000000005', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', 0, true),
('b1000000-0005-4000-b000-000000000005', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 1, false),
('b1000000-0005-4000-b000-000000000005', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80', 2, false),
('b1000000-0006-4000-b000-000000000006', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', 0, true),
('b1000000-0006-4000-b000-000000000006', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80', 1, false),
('b1000000-0006-4000-b000-000000000006', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', 2, false),
-- London
('b1000000-0007-4000-b000-000000000007', 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80', 0, true),
('b1000000-0007-4000-b000-000000000007', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', 1, false),
('b1000000-0008-4000-b000-000000000008', 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80', 0, true),
('b1000000-0008-4000-b000-000000000008', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80', 1, false),
('b1000000-0009-4000-b000-000000000009', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 0, true),
('b1000000-0009-4000-b000-000000000009', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 1, false),
('b1000000-0009-4000-b000-000000000009', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', 2, false),
-- Barcelona
('b1000000-0010-4000-b000-000000000010', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80', 0, true),
('b1000000-0010-4000-b000-000000000010', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 1, false),
('b1000000-0011-4000-b000-000000000011', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 0, true),
('b1000000-0012-4000-b000-000000000012', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', 0, true),
('b1000000-0012-4000-b000-000000000012', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', 1, false),
('b1000000-0012-4000-b000-000000000012', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', 2, false),
-- Rome
('b1000000-0013-4000-b000-000000000013', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', 0, true),
('b1000000-0013-4000-b000-000000000013', 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80', 1, false),
('b1000000-0014-4000-b000-000000000014', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 0, true),
('b1000000-0014-4000-b000-000000000014', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&q=80', 1, false),
-- Dubai
('b1000000-0015-4000-b000-000000000015', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', 0, true),
('b1000000-0015-4000-b000-000000000015', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 1, false),
('b1000000-0015-4000-b000-000000000015', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', 2, false),
('b1000000-0016-4000-b000-000000000016', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 0, true),
('b1000000-0016-4000-b000-000000000016', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 1, false),
('b1000000-0017-4000-b000-000000000017', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 0, true),
('b1000000-0017-4000-b000-000000000017', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 1, false),
('b1000000-0017-4000-b000-000000000017', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', 2, false),
('b1000000-0017-4000-b000-000000000017', 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80', 3, false),
('b1000000-0018-4000-b000-000000000018', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80', 0, true),
-- Riyadh
('b1000000-0019-4000-b000-000000000019', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80', 0, true),
('b1000000-0019-4000-b000-000000000019', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', 1, false),
('b1000000-0019-4000-b000-000000000019', 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80', 2, false),
('b1000000-0020-4000-b000-000000000020', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 0, true),
('b1000000-0020-4000-b000-000000000020', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 1, false),
('b1000000-0020-4000-b000-000000000020', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', 2, false);


-- =============================================
-- 9. AVAILABILITY BLOCKS (all markets)
-- =============================================
INSERT INTO public.property_blocks (property_id, start_date, end_date, note) VALUES
-- NYC
('b1000000-0001-4000-b000-000000000001', '2026-03-01', '2026-03-10', 'Current tenant moving out'),
('b1000000-0001-4000-b000-000000000001', '2026-04-15', '2026-04-20', 'Deep cleaning & staging'),
('b1000000-0003-4000-b000-000000000003', '2026-02-15', '2026-03-01', 'Lease renewal period'),
-- Miami
('b1000000-0004-4000-b000-000000000004', '2026-03-15', '2026-04-15', 'Spring break booking'),
('b1000000-0006-4000-b000-000000000006', '2026-05-01', '2026-05-15', 'Annual maintenance'),
-- London
('b1000000-0007-4000-b000-000000000007', '2026-03-01', '2026-03-20', 'Tenant notice period'),
('b1000000-0009-4000-b000-000000000009', '2026-04-01', '2026-06-30', 'Long-term lease in progress'),
-- Barcelona
('b1000000-0012-4000-b000-000000000012', '2026-06-01', '2026-08-31', 'Summer seasonal booking'),
-- Dubai
('b1000000-0015-4000-b000-000000000015', '2026-03-01', '2026-03-15', 'Handover preparation'),
('b1000000-0017-4000-b000-000000000017', '2026-02-20', '2026-04-30', 'Current tenant'),
-- Riyadh
('b1000000-0019-4000-b000-000000000019', '2026-04-01', '2026-04-10', 'Renovation works');


-- =============================================
-- 10. SAMPLE LEADS (for lead CRM)
-- =============================================
INSERT INTO public.leads (property_id, agent_id, contact_name, contact_phone, contact_email, message, source, temperature, score, ai_reasons, suggested_follow_up, follow_up_delay, status) VALUES

-- Hot leads
('b1000000-0001-4000-b000-000000000001', 'a1000000-0001-4000-a000-000000000001',
 'David Chen', '+12125559001', 'david.chen@gmail.com',
 'Hi Michael, I saw the Midtown apartment and I love it! I can move in March 15th. Can we schedule a viewing this weekend? I have all documents ready.',
 'whatsapp', 'hot', 92,
 ARRAY['Mentions specific move-in date', 'Requests viewing', 'Documents ready', 'Specific property interest'],
 'Respond immediately. Schedule a viewing and share property documents.',
 60, 'contacted'),

('b1000000-0015-4000-b000-000000000015', 'a1000000-0005-4000-a000-000000000005',
 'Priya Sharma', '+971501239001', 'priya.sharma@company.ae',
 'Salam Omar, I need to rent the Marina apartment ASAP. My company is relocating me and I need to sign within the week. Budget is up to 100k AED. Please send the contract.',
 'whatsapp', 'hot', 95,
 ARRAY['Urgent timeline', 'Corporate relocation', 'Budget confirmed above asking', 'Ready to sign'],
 'Respond immediately. Send contract draft and schedule same-day viewing.',
 30, 'qualified'),

-- Warm leads
('b1000000-0007-4000-b000-000000000007', 'a1000000-0003-4000-a000-000000000003',
 'Emma Watson', '+447700901234', 'emma.w@outlook.co.uk',
 'Hello James, I am interested in the Kensington flat. Could you tell me more about the lease terms and whether pets are allowed? I am looking to move in around April.',
 'form', 'warm', 65,
 ARRAY['Asks about lease terms', 'Mentions move-in timeline', 'Specific questions about policies'],
 'Send detailed listing info and pet policy. Ask about their budget and requirements.',
 1440, 'new'),

('b1000000-0010-4000-b000-000000000010', 'a1000000-0004-4000-a000-000000000004',
 'Thomas Mueller', '+491701234567', 'thomas.m@web.de',
 'Hola Elena, I found the Eixample apartment on your website. I will be moving to Barcelona for work in May. Can you send me more photos and floor plan?',
 'email', 'warm', 58,
 ARRAY['Work relocation', 'Specific timeline', 'Requests additional info'],
 'Send additional photos, floor plan, and neighborhood guide. Follow up in 24 hours.',
 1440, 'contacted'),

('b1000000-0005-4000-b000-000000000005', 'a1000000-0002-4000-a000-000000000002',
 'Ana Rodriguez', '+13055559002', 'ana.rod@hotmail.com',
 'Hi Sarah, the Wynwood loft looks amazing! What are the monthly utilities like? Also, is the parking included in the rent? I might be interested for a summer lease.',
 'whatsapp', 'warm', 55,
 ARRAY['Asks about utilities', 'Inquires about parking', 'Summer timeline - may be short-term'],
 'Send utility estimates and parking details. Ask about lease length preference.',
 1440, 'new'),

-- Cold leads
('b1000000-0004-4000-b000-000000000004', 'a1000000-0002-4000-a000-000000000002',
 'John Doe', '+10005550000', 'random@email.com',
 'Hi, just browsing. Maybe sometime next year.',
 'form', 'cold', 15,
 ARRAY['No specific timeline', 'Non-committal language', 'No property details mentioned'],
 'Add to nurture list. Send weekly property digest.',
 4320, 'new'),

('b1000000-0019-4000-b000-000000000019', 'a1000000-0006-4000-a000-000000000006',
 'Ahmed Test', '+966500000000', 'test@test.com',
 'Looking at options',
 'form', 'cold', 20,
 ARRAY['Very vague inquiry', 'No specific requirements'],
 'Add to nurture list. Send weekly property digest.',
 4320, 'new');


-- =============================================
-- 11. LISTING TRANSLATIONS (sample)
-- =============================================
INSERT INTO public.listing_translations (property_id, language_code, title, description, generated_by, model_used) VALUES

-- Dubai listings in Arabic
('b1000000-0015-4000-b000-000000000015', 'ar',
 'شقة رائعة بغرفتي نوم مع إطلالة على المارينا',
 'شقة مذهلة بغرفتي نوم مع نوافذ ممتدة من الأرض إلى السقف تطل على مارينا دبي والبحر العربي. مفروشة بالكامل بأعلى المعايير مع أثاث مصمم. يضم المبنى مسبح لامتناهي ونادي رياضي متميز ومنطقة لعب للأطفال وخدمة استقبال على مدار الساعة.',
 'ai', 'llama-3.3-70b-versatile'),

('b1000000-0017-4000-b000-000000000017', 'ar',
 'فيلا حصرية بثلاث غرف نوم في نخلة جميرا',
 'فيلا حديقة رائعة بثلاث غرف نوم على نخلة جميرا مع إمكانية الوصول إلى الشاطئ الخاص. مساحات معيشة واسعة ومسبح خاص وحديقة منسقة ومنطقة شواء.',
 'ai', 'llama-3.3-70b-versatile'),

-- Barcelona listings in Spanish
('b1000000-0010-4000-b000-000000000010', 'es',
 'Luminoso Apartamento de 2 Habitaciones en el Eixample',
 'Impresionante apartamento modernista en un bulevar clásico del Eixample. Techos altos con suelos de baldosas originales y abundante luz natural. Dos amplias habitaciones, cocina totalmente equipada y encantador balcón. A pasos del Passeig de Gràcia y La Pedrera.',
 'ai', 'llama-3.3-70b-versatile'),

('b1000000-0012-4000-b000-000000000012', 'es',
 'Apartamento de 3 Habitaciones Frente al Mar en la Barceloneta',
 'Excepcional apartamento de 3 dormitorios directamente en el paseo marítimo de la Barceloneta. Despierta con vistas al mar Mediterráneo desde el dormitorio principal. Salón abierto con terraza para comer al aire libre.',
 'ai', 'llama-3.3-70b-versatile'),

-- Rome listings in Italian
('b1000000-0013-4000-b000-000000000013', 'it',
 'Storico Bilocale a Trastevere',
 'Affascinante appartamento in un palazzo del XVII secolo nel cuore di Trastevere. Pavimenti in cotto, travi in legno a vista e vista su muri coperti di edera. Due comode camere da letto e una cucina completamente ristrutturata.',
 'ai', 'llama-3.3-70b-versatile'),

-- Riyadh listing in Arabic
('b1000000-0019-4000-b000-000000000019', 'ar',
 'شقة تنفيذية بثلاث غرف نوم في العليا',
 'شقة تنفيذية فاخرة بثلاث غرف نوم في قلب حي الأعمال بالرياض. تشطيبات عالية الجودة مع أرضيات رخامية وخزائن مخصصة. تضم غرفة خادمة ومواقف سيارات مخصصة.',
 'ai', 'llama-3.3-70b-versatile');


-- =============================================
-- 12. LISTING FLAGS (sample fraud/compliance)
-- =============================================
INSERT INTO public.listing_flags (property_id, flag_type, severity, reason, details, status) VALUES

('b1000000-0018-4000-b000-000000000018', 'ai_detected', 'low',
 'Pricing slightly below area average for Business Bay studios',
 '{"riskScore": 25, "flags": [{"type": "pricing", "severity": "low", "description": "12% below area median"}], "recommendation": "approve"}'::jsonb,
 'resolved');


-- =============================================
-- DONE! Multi-region seed data loaded.
-- Summary:
--   7 international agents
--   20 properties (US/UK/Spain/Italy/UAE/Saudi)
--   48 property photos
--   11 availability blocks
--   7 sample leads (hot/warm/cold)
--   6 listing translations (AR/ES/IT)
--   1 sample listing flag
-- =============================================
