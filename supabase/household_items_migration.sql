-- ==========================================================
-- Used Household Items â€” Schema & Seed Data
-- A marketplace for tenants/landlords selling used furniture
-- and household items across US/Europe/Middle East
--
-- Run in Supabase SQL Editor AFTER all previous migrations
-- ==========================================================

-- =============================================
-- 1. HOUSEHOLD ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.household_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'furniture', 'electronics', 'appliances', 'kitchen',
    'bedroom', 'bathroom', 'decor', 'lighting',
    'storage', 'outdoor', 'kids', 'other'
  )),
  price INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('like_new', 'good', 'fair', 'used')),
  description TEXT DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  delivery_available BOOLEAN DEFAULT false,
  is_negotiable BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. HOUSEHOLD ITEM PHOTOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.household_item_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.household_items(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_household_items_seller ON public.household_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_household_items_category ON public.household_items(category);
CREATE INDEX IF NOT EXISTS idx_household_items_city ON public.household_items(city);
CREATE INDEX IF NOT EXISTS idx_household_items_status ON public.household_items(status);
CREATE INDEX IF NOT EXISTS idx_household_items_price ON public.household_items(price);
CREATE INDEX IF NOT EXISTS idx_household_item_photos_item ON public.household_item_photos(item_id);

-- =============================================
-- 4. RLS POLICIES
-- =============================================
ALTER TABLE public.household_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_item_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view available items
CREATE POLICY "Anyone can view available household items"
  ON public.household_items FOR SELECT
  USING (status = 'available');

-- Sellers manage their own items
CREATE POLICY "Sellers can manage their own items"
  ON public.household_items FOR ALL
  USING (auth.uid() = seller_id);

-- Anyone can view item photos
CREATE POLICY "Anyone can view household item photos"
  ON public.household_item_photos FOR SELECT
  USING (true);

-- Sellers manage their item photos
CREATE POLICY "Sellers can manage their item photos"
  ON public.household_item_photos FOR ALL
  USING (
    item_id IN (
      SELECT id FROM public.household_items WHERE seller_id = auth.uid()
    )
  );

-- Auto-update timestamp
DROP TRIGGER IF EXISTS update_household_items_updated_at ON public.household_items;
CREATE TRIGGER update_household_items_updated_at
  BEFORE UPDATE ON public.household_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- =============================================
-- 5. SEED DATA â€” US ITEMS
-- =============================================
INSERT INTO public.household_items (id, seller_id, title, category, price, currency, condition, description, city, area, delivery_available, is_negotiable, status) VALUES

-- New York items (sold by Michael Torres)
('c1000000-0001-4000-c000-000000000001', 'fe5fadba-9c0d-4411-ba6c-a6cdd053b7de',
 'West Elm Mid-Century Sofa - Walnut', 'furniture', 650, 'USD', 'good',
 'Beautiful mid-century modern sofa from West Elm. Walnut legs, dark gray upholstery. Minor wear on armrests but structurally perfect. Originally $1,299. Moving out, must sell!',
 'New York', 'Manhattan', true, true, 'available'),

('c1000000-0002-4000-c000-000000000002', 'fe5fadba-9c0d-4411-ba6c-a6cdd053b7de',
 'Samsung 55" 4K Smart TV (2024)', 'electronics', 380, 'USD', 'like_new',
 'Samsung Crystal UHD 55-inch Smart TV. Bought 6 months ago, barely used. Comes with original box, remote, and wall mount bracket. Perfect condition.',
 'New York', 'Brooklyn Heights', false, true, 'available'),

('c1000000-0003-4000-c000-000000000003', 'fe5fadba-9c0d-4411-ba6c-a6cdd053b7de',
 'KitchenAid Artisan Stand Mixer - Red', 'kitchen', 180, 'USD', 'good',
 'Classic KitchenAid 5-quart mixer in Empire Red. Includes 3 attachments (flat beater, dough hook, whisk). Some scratches on the bowl but works perfectly.',
 'New York', 'Manhattan', false, false, 'available'),

-- Miami items (sold by Sarah Mitchell)
('c1000000-0004-4000-c000-000000000004', '7eb08b19-8434-462e-90dc-fddd232eb413',
 'IKEA MALM Queen Bed Frame - White', 'bedroom', 120, 'USD', 'good',
 'IKEA MALM queen bed frame in white. Includes 2 storage drawers underneath. Easy to disassemble. Some minor scratches on the headboard. Mattress NOT included.',
 'Miami', 'Brickell', true, true, 'available'),

('c1000000-0005-4000-c000-000000000005', '7eb08b19-8434-462e-90dc-fddd232eb413',
 'Dyson V12 Cordless Vacuum', 'appliances', 280, 'USD', 'like_new',
 'Dyson V12 Detect Slim vacuum. Laser dust detection, 60 min battery. Used for 3 months in a small apartment. All attachments included. Sells for $650 new.',
 'Miami', 'Wynwood', false, true, 'available'),

('c1000000-0006-4000-c000-000000000006', '7eb08b19-8434-462e-90dc-fddd232eb413',
 'Patio Dining Set - 4 Chairs + Table', 'outdoor', 350, 'USD', 'fair',
 'Aluminum patio dining set, weather-resistant. White table (48") with 4 cushioned chairs. Some sun fading on cushions but frames in great shape. Perfect for a balcony or small patio.',
 'Miami', 'Miami Beach', true, true, 'available'),


-- =============================================
-- 6. SEED DATA â€” UK ITEMS (London)
-- =============================================
('c1000000-0007-4000-c000-000000000007', 'fd3307c7-59af-48a7-b409-bd4d0c94fa4f',
 'John Lewis Leather Armchair', 'furniture', 320, 'GBP', 'good',
 'Gorgeous tan leather armchair from John Lewis. Solid oak legs, deep comfortable seat. Slight patina adds character. Was Â£750 new. Collection from Kensington.',
 'London', 'Kensington', false, true, 'available'),

('c1000000-0008-4000-c000-000000000008', 'fd3307c7-59af-48a7-b409-bd4d0c94fa4f',
 'Smeg Retro Fridge - Pastel Blue', 'appliances', 450, 'GBP', 'good',
 'Iconic Smeg FAB28 retro fridge in pastel blue. 248L capacity. A few minor dents on the side (not visible when positioned). Still under warranty until Dec 2026.',
 'London', 'Chelsea', true, true, 'available'),

('c1000000-0009-4000-c000-000000000009', 'fd3307c7-59af-48a7-b409-bd4d0c94fa4f',
 'Bosch Washing Machine 9kg', 'appliances', 200, 'GBP', 'fair',
 'Bosch Serie 6 washing machine. 9kg capacity, 1400rpm spin. Works perfectly, selling because new flat has one built-in. Can arrange delivery in London for Â£30.',
 'London', 'Canary Wharf', true, true, 'available'),


-- =============================================
-- 7. SEED DATA â€” SPAIN ITEMS (Barcelona)
-- =============================================
('c1000000-0010-4000-c000-000000000010', '32d99c56-3932-4b5d-a40a-79bcfc7a9186',
 'IKEA KALLAX Shelf Unit 4x4 - White', 'storage', 60, 'EUR', 'good',
 'IKEA KALLAX 4x4 shelf unit. Great condition, white finish. Perfect as a room divider or bookshelf. Can be disassembled for transport. Includes 4 insert boxes.',
 'Barcelona', 'Eixample', false, false, 'available'),

('c1000000-0011-4000-c000-000000000011', '32d99c56-3932-4b5d-a40a-79bcfc7a9186',
 'Philips Hue Starter Kit - 4 Bulbs + Bridge', 'lighting', 85, 'EUR', 'like_new',
 'Philips Hue White & Color Ambiance starter kit. 4 E27 smart bulbs + Hue Bridge. App controlled, voice compatible. Only used for 2 months. Perfect for smart home setup.',
 'Barcelona', 'GrÃ cia', false, true, 'available'),

('c1000000-0012-4000-c000-000000000012', '32d99c56-3932-4b5d-a40a-79bcfc7a9186',
 'Handmade Moroccan Rug 200x300cm', 'decor', 280, 'EUR', 'good',
 'Authentic handwoven Berber rug from Morocco. Soft wool, geometric patterns in cream and terracotta. 200x300cm. Adds warmth and character to any living room. Professionally cleaned.',
 'Barcelona', 'Born', false, true, 'available'),


-- =============================================
-- 8. SEED DATA â€” ITALY ITEMS (Rome)
-- =============================================
('c1000000-0013-4000-c000-000000000013', '9f0a31ce-302d-4479-a3fa-8f0b1d5d7926',
 'Antique Italian Writing Desk', 'furniture', 450, 'EUR', 'fair',
 'Beautiful antique wooden writing desk, circa 1950s. Solid walnut with brass handles. Two drawers and a leather-inlay writing surface. Some age-related wear adds to its charm.',
 'Rome', 'Trastevere', false, true, 'available'),

('c1000000-0014-4000-c000-000000000014', '9f0a31ce-302d-4479-a3fa-8f0b1d5d7926',
 'DeLonghi Magnifica Espresso Machine', 'kitchen', 220, 'EUR', 'good',
 'DeLonghi Magnifica S fully automatic espresso machine. Built-in grinder, milk frother. Descaled regularly, works perfectly. Make cafÃ©-quality espresso at home. Was â‚¬550 new.',
 'Rome', 'Centro Storico', false, true, 'available'),


-- =============================================
-- 9. SEED DATA â€” UAE ITEMS (Dubai)
-- =============================================
('c1000000-0015-4000-c000-000000000015', '041520e2-115f-451b-9b14-2d8f24883cc5',
 'L-Shaped Sectional Sofa - Beige', 'furniture', 1800, 'AED', 'like_new',
 'Premium L-shaped sectional sofa in beige linen. Seats 5-6 comfortably. Only 4 months old, selling due to relocation. Includes 6 accent cushions. Delivery available in Dubai.',
 'Dubai', 'Dubai Marina', true, true, 'available'),

('c1000000-0016-4000-c000-000000000016', '041520e2-115f-451b-9b14-2d8f24883cc5',
 'LG 65" OLED TV with Soundbar', 'electronics', 3200, 'AED', 'good',
 'LG C3 65-inch OLED 4K TV with LG Soundbar. Stunning picture quality, Dolby Vision & Atmos. Wall mount included. Selling as upgrading to 77-inch. Was 6,500 AED new.',
 'Dubai', 'Downtown Dubai', false, true, 'available'),

('c1000000-0017-4000-c000-000000000017', '041520e2-115f-451b-9b14-2d8f24883cc5',
 'Kids Bedroom Set - Bunk Bed + Wardrobe', 'kids', 2500, 'AED', 'good',
 'Complete kids bedroom set from Pottery Barn Kids. Bunk bed (converts to 2 singles), matching wardrobe, and study desk. White finish. Ideal for ages 4-12. Can deliver in Dubai.',
 'Dubai', 'JBR', true, true, 'available'),

('c1000000-0018-4000-c000-000000000018', '041520e2-115f-451b-9b14-2d8f24883cc5',
 'Samsung French Door Fridge - Silver', 'appliances', 2800, 'AED', 'like_new',
 'Samsung RF28T5001SR French Door refrigerator. 28 cu. ft., twin cooling plus. Ice maker, water dispenser. Only 6 months old, selling because villa has built-in. Still under warranty.',
 'Dubai', 'Palm Jumeirah', true, false, 'available'),


-- =============================================
-- 10. SEED DATA â€” SAUDI ITEMS (Riyadh)
-- =============================================
('c1000000-0019-4000-c000-000000000019', '144c444d-105c-48e9-b375-6d8202c131ad',
 'Majlis Seating Set - 8 Pieces', 'furniture', 3500, 'SAR', 'good',
 'Traditional Arabic majlis seating set. 8 floor cushions with backrests in burgundy and gold. Premium fabric, hand-stitched details. Perfect for a formal sitting room or guest area.',
 'Riyadh', 'Al Olaya', false, true, 'available'),

('c1000000-0020-4000-c000-000000000020', '144c444d-105c-48e9-b375-6d8202c131ad',
 'Split AC Unit - 2 Ton Carrier', 'appliances', 1200, 'SAR', 'fair',
 'Carrier 2-ton split AC unit. Powerful cooling, essential for Riyadh summers. Used for 2 years, professionally serviced every 6 months. Installation can be arranged.',
 'Riyadh', 'Diplomatic Quarter', true, true, 'available'),

-- Pakistan items (Karachi â€” reusing existing agent)
('c1000000-0021-4000-c000-000000000021', '036a28d0-fdf4-456b-9c65-df2ea8ed4e92',
 'Habitt Dining Table + 6 Chairs - Sheesham', 'furniture', 45000, 'PKR', 'good',
 'Solid sheesham wood dining table from Habitt with 6 matching chairs. Seats 6-8 comfortably. Minor scratches on surface, chairs in excellent condition. Was PKR 85,000 new.',
 'Karachi', 'DHA', true, true, 'available'),

('c1000000-0022-4000-c000-000000000022', '036a28d0-fdf4-456b-9c65-df2ea8ed4e92',
 'Haier Inverter AC 1.5 Ton', 'appliances', 55000, 'PKR', 'good',
 'Haier 1.5 ton DC inverter AC. Energy efficient, cool and heat mode. Used 1 season, still under warranty. Includes original remote and wall bracket.',
 'Karachi', 'Gulshan-e-Iqbal', true, false, 'available'),

('c1000000-0023-4000-c000-000000000023', 'f9ab1410-a594-4957-aab0-02578229bcb0',
 'Interwood King Bed + Side Tables', 'bedroom', 65000, 'PKR', 'like_new',
 'Premium king-size bed frame from Interwood with 2 matching side tables. High-gloss walnut finish, modern design. Only 3 months old, relocating abroad. Mattress not included.',
 'Lahore', 'DHA', true, true, 'available'),

('c1000000-0024-4000-c000-000000000024', 'f9ab1410-a594-4957-aab0-02578229bcb0',
 'Dawlance Full-Size Washing Machine', 'appliances', 25000, 'PKR', 'fair',
 'Dawlance DW-8100 twin tub washing machine. 12kg capacity. Works well, some cosmetic wear. Ideal for a family. Can deliver within Lahore.',
 'Lahore', 'Gulberg', true, true, 'available');


-- =============================================
-- 11. HOUSEHOLD ITEM PHOTOS
-- =============================================
INSERT INTO public.household_item_photos (item_id, url, position, is_cover) VALUES
-- Furniture
('c1000000-0001-4000-c000-000000000001', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', 0, true),
('c1000000-0001-4000-c000-000000000001', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80', 1, false),
-- Electronics
('c1000000-0002-4000-c000-000000000002', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80', 0, true),
-- Kitchen
('c1000000-0003-4000-c000-000000000003', 'https://images.unsplash.com/photo-1594385208974-2f8bb07b6a32?w=800&q=80', 0, true),
-- Bedroom
('c1000000-0004-4000-c000-000000000004', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80', 0, true),
-- Appliances
('c1000000-0005-4000-c000-000000000005', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', 0, true),
-- Outdoor
('c1000000-0006-4000-c000-000000000006', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', 0, true),
-- UK Furniture
('c1000000-0007-4000-c000-000000000007', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', 0, true),
-- UK Appliances
('c1000000-0008-4000-c000-000000000008', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80', 0, true),
('c1000000-0009-4000-c000-000000000009', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80', 0, true),
-- Spain Storage
('c1000000-0010-4000-c000-000000000010', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80', 0, true),
-- Spain Lighting
('c1000000-0011-4000-c000-000000000011', 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=80', 0, true),
-- Spain Decor
('c1000000-0012-4000-c000-000000000012', 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80', 0, true),
-- Italy Furniture
('c1000000-0013-4000-c000-000000000013', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80', 0, true),
-- Italy Kitchen
('c1000000-0014-4000-c000-000000000014', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', 0, true),
-- Dubai Furniture
('c1000000-0015-4000-c000-000000000015', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', 0, true),
('c1000000-0015-4000-c000-000000000015', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80', 1, false),
-- Dubai Electronics
('c1000000-0016-4000-c000-000000000016', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80', 0, true),
-- Dubai Kids
('c1000000-0017-4000-c000-000000000017', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80', 0, true),
-- Dubai Appliances
('c1000000-0018-4000-c000-000000000018', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80', 0, true),
-- Saudi Furniture
('c1000000-0019-4000-c000-000000000019', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', 0, true),
-- Saudi Appliances
('c1000000-0020-4000-c000-000000000020', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80', 0, true),
-- Pakistan
('c1000000-0021-4000-c000-000000000021', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80', 0, true),
('c1000000-0022-4000-c000-000000000022', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80', 0, true),
('c1000000-0023-4000-c000-000000000023', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80', 0, true),
('c1000000-0024-4000-c000-000000000024', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80', 0, true);


-- =============================================
-- DONE! Household items marketplace created.
-- Summary:
--   1 household_items table
--   1 household_item_photos table
--   24 used items across 7 cities
--   26 item photos
--   RLS policies configured
-- =============================================
