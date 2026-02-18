-- ============================================================================
-- Admin-first workflow migration
-- - New signups default to agent
-- - Booking requests are admin-reviewed first
-- - Marketplace customer requests queue for admin approval
-- - Admin full management for marketplace tables
-- ============================================================================

-- 1) Signup default role => agent
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'agent';

-- Keep existing rows unchanged unless role is NULL (defensive)
UPDATE public.profiles
SET role = 'agent'
WHERE role IS NULL;

-- Update auth trigger function to set agent role on signup
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

-- 2) New marketplace customer request queue
CREATE TABLE IF NOT EXISTS public.marketplace_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.household_items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) >= 2),
  customer_phone TEXT NOT NULL CHECK (length(trim(customer_phone)) >= 7),
  customer_email TEXT,
  customer_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  idempotency_key TEXT UNIQUE,
  admin_actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_decision_note TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_requests_status_created
  ON public.marketplace_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_requests_seller
  ON public.marketplace_requests(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_requests_item
  ON public.marketplace_requests(item_id, created_at DESC);

DROP TRIGGER IF EXISTS update_marketplace_requests_updated_at ON public.marketplace_requests;
CREATE TRIGGER update_marketplace_requests_updated_at
  BEFORE UPDATE ON public.marketplace_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.marketplace_requests ENABLE ROW LEVEL SECURITY;

-- Public can submit request only for available items
DROP POLICY IF EXISTS "marketplace_requests_insert_public" ON public.marketplace_requests;
CREATE POLICY "marketplace_requests_insert_public"
  ON public.marketplace_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_items hi
      WHERE hi.id = item_id
        AND hi.seller_id = seller_id
        AND hi.status = 'available'
    )
  );

-- Admins can fully manage requests
DROP POLICY IF EXISTS "marketplace_requests_admin_all" ON public.marketplace_requests;
CREATE POLICY "marketplace_requests_admin_all"
  ON public.marketplace_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 3) Booking policies -> admin-first review flow
DROP POLICY IF EXISTS "bookings_select_agent" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_agent" ON public.bookings;

-- Agents can only read approved/completed bookings for their own properties.
-- Pending requests stay visible to admin only.
DROP POLICY IF EXISTS "bookings_select_agent_approved" ON public.bookings;
CREATE POLICY "bookings_select_agent_approved"
  ON public.bookings FOR SELECT
  USING (
    status IN ('confirmed', 'completed')
    AND EXISTS (
      SELECT 1 FROM public.properties pr
      WHERE pr.id = property_id
        AND pr.agent_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'agent'
    )
  );

-- 4) Admin access on leads and marketplace inventory
DROP POLICY IF EXISTS "leads_admin_all" ON public.leads;
CREATE POLICY "leads_admin_all"
  ON public.leads FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "household_items_admin_all" ON public.household_items;
CREATE POLICY "household_items_admin_all"
  ON public.household_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "household_item_photos_admin_all" ON public.household_item_photos;
CREATE POLICY "household_item_photos_admin_all"
  ON public.household_item_photos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
