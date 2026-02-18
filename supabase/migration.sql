-- UrbanEstate Database Schema Migration
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. PROFILES TABLE (extends auth.users)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  photo_url TEXT,
  bio TEXT,
  service_areas TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('customer', 'agent', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'agent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 2. PROPERTIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'flat')),
  rent INTEGER NOT NULL DEFAULT 0,
  deposit INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  city TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  street_address TEXT DEFAULT '',
  beds INTEGER NOT NULL DEFAULT 1,
  baths INTEGER NOT NULL DEFAULT 1,
  size_sqft INTEGER,
  furnished BOOLEAN DEFAULT false,
  amenities TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. PROPERTY PHOTOS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.property_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 4. PROPERTY BLOCKS TABLE (unavailable dates)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.property_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 5. INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city_area ON public.properties(city, area);
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON public.property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_blocks_property_id ON public.property_blocks(property_id);

-- ===========================================
-- 6. UPDATED_AT TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_properties ON public.properties;
CREATE TRIGGER set_updated_at_properties
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================
-- 7. ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_blocks ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- PROPERTIES policies
CREATE POLICY "Published properties are viewable by everyone"
  ON public.properties FOR SELECT
  USING (status = 'published' OR agent_id = auth.uid());

CREATE POLICY "Agents can create their own properties"
  ON public.properties FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own properties"
  ON public.properties FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can delete their own properties"
  ON public.properties FOR DELETE
  USING (agent_id = auth.uid());

-- PROPERTY PHOTOS policies
CREATE POLICY "Property photos are viewable by everyone"
  ON public.property_photos FOR SELECT
  USING (true);

CREATE POLICY "Agents can manage their property photos"
  ON public.property_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update their property photos"
  ON public.property_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can delete their property photos"
  ON public.property_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    )
  );

-- PROPERTY BLOCKS policies
CREATE POLICY "Property blocks are viewable by everyone"
  ON public.property_blocks FOR SELECT
  USING (true);

CREATE POLICY "Agents can manage their property blocks"
  ON public.property_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update their property blocks"
  ON public.property_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can delete their property blocks"
  ON public.property_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_id AND agent_id = auth.uid()
    )
  );
