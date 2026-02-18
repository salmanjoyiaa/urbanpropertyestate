-- ============================================================================
-- Migration 004: Default Availability Slots + Agent Marketplace Management
--
-- 1. Add agent_id column to household_items (maps seller to agent)
-- 2. Add agent_id column to marketplace_requests (routes lead to agent)
-- 3. Default Mon-Fri 9-5 availability for all published properties
-- 4. RLS policies for agent CRUD on household_items / marketplace_requests
-- ============================================================================

-- ========================
-- 1. AGENT_ID ON HOUSEHOLD ITEMS
-- ========================
-- Add agent_id so agents can own marketplace items independently of seller_id
ALTER TABLE public.household_items
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill: existing items get agent_id = seller_id
UPDATE public.household_items
SET agent_id = seller_id
WHERE agent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_household_items_agent ON public.household_items(agent_id);

-- ========================
-- 2. AGENT_ID ON MARKETPLACE REQUESTS
-- ========================
ALTER TABLE public.marketplace_requests
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill: copy seller_id to agent_id for existing requests
UPDATE public.marketplace_requests
SET agent_id = seller_id
WHERE agent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_requests_agent ON public.marketplace_requests(agent_id);

-- ========================
-- 3. DEFAULT AVAILABILITY FUNCTION (Mon-Fri 9AM-5PM hourly slots, 90 days)
-- ========================
CREATE OR REPLACE FUNCTION public.generate_default_availability(p_property_id UUID)
RETURNS void AS $$
DECLARE
  d DATE;
  h INT;
BEGIN
  -- Generate slots for the next 90 days, Mon-Fri only
  FOR d IN
    SELECT generate_series(
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '90 days',
      '1 day'::interval
    )::date
  LOOP
    -- Skip weekends (0=Sun, 6=Sat in extract(dow ...))
    IF EXTRACT(DOW FROM d) IN (0, 6) THEN
      CONTINUE;
    END IF;

    -- Create hourly slots from 09:00 to 17:00
    FOR h IN 9..16 LOOP
      INSERT INTO public.availability_slots (property_id, slot_date, start_time, end_time, capacity, is_available)
      VALUES (
        p_property_id,
        d,
        make_time(h, 0, 0),
        make_time(h + 1, 0, 0),
        1,
        TRUE
      )
      ON CONFLICT (property_id, slot_date, start_time) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- 4. TRIGGER: Auto-generate slots when property is published
-- ========================
CREATE OR REPLACE FUNCTION public.on_property_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when status changes to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    PERFORM public.generate_default_availability(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_property_published_slots ON public.properties;
CREATE TRIGGER trg_property_published_slots
  AFTER INSERT OR UPDATE OF status ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.on_property_published();

-- ========================
-- 5. BACKFILL: Generate slots for all existing published properties
-- ========================
DO $$
DECLARE
  prop RECORD;
BEGIN
  FOR prop IN SELECT id FROM public.properties WHERE status = 'published' LOOP
    PERFORM public.generate_default_availability(prop.id);
  END LOOP;
END;
$$;

-- ========================
-- 6. RLS POLICIES for agent access to household_items
-- ========================

-- Agents can SELECT their own items (all statuses)
DROP POLICY IF EXISTS "agents_select_own_items" ON public.household_items;
CREATE POLICY "agents_select_own_items"
  ON public.household_items FOR SELECT
  USING (
    agent_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );

-- Agents can INSERT items (and auto-set agent_id)
DROP POLICY IF EXISTS "agents_insert_items" ON public.household_items;
CREATE POLICY "agents_insert_items"
  ON public.household_items FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND seller_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );

-- Agents can UPDATE their own items
DROP POLICY IF EXISTS "agents_update_own_items" ON public.household_items;
CREATE POLICY "agents_update_own_items"
  ON public.household_items FOR UPDATE
  USING (
    agent_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  )
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );

-- Agents can DELETE their own items
DROP POLICY IF EXISTS "agents_delete_own_items" ON public.household_items;
CREATE POLICY "agents_delete_own_items"
  ON public.household_items FOR DELETE
  USING (
    agent_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );

-- ========================
-- 7. RLS POLICIES for agent access to household_item_photos
-- ========================

-- Agents can manage photos for their own items
DROP POLICY IF EXISTS "agents_insert_item_photos" ON public.household_item_photos;
CREATE POLICY "agents_insert_item_photos"
  ON public.household_item_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_items hi
      WHERE hi.id = item_id AND hi.agent_id = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );

DROP POLICY IF EXISTS "agents_update_item_photos" ON public.household_item_photos;
CREATE POLICY "agents_update_item_photos"
  ON public.household_item_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_items hi
      WHERE hi.id = item_id AND hi.agent_id = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );

DROP POLICY IF EXISTS "agents_delete_item_photos" ON public.household_item_photos;
CREATE POLICY "agents_delete_item_photos"
  ON public.household_item_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_items hi
      WHERE hi.id = item_id AND hi.agent_id = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );

-- ========================
-- 8. RLS POLICIES for agents reading their marketplace requests
-- ========================
DROP POLICY IF EXISTS "agents_select_own_marketplace_requests" ON public.marketplace_requests;
CREATE POLICY "agents_select_own_marketplace_requests"
  ON public.marketplace_requests FOR SELECT
  USING (
    agent_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('agent', 'admin'))
  );
