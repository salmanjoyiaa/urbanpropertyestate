-- ============================================================================
-- Visit Scheduling System Migration
-- Adds: role to profiles, availability_slots, bookings, audit_logs, rate_limit_tracker
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ STEP 1: ADD ROLE COLUMN TO EXISTING PROFILES TABLE ============
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
CHECK (role IN ('customer', 'agent', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============ STEP 2: CREATE AVAILABILITY SLOTS TABLE ============
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT DEFAULT 1 CHECK (capacity > 0),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_slots_property_id ON availability_slots(property_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_slot_date ON availability_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_is_available ON availability_slots(is_available);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_slots_unique ON availability_slots(property_id, slot_date, start_time);

-- Composite index for common query pattern: available slots for a property on future dates
CREATE INDEX IF NOT EXISTS idx_availability_slots_lookup
  ON availability_slots(property_id, slot_date, is_available)
  WHERE is_available = TRUE;

-- ============ STEP 3: CREATE BOOKINGS TABLE ============
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL CHECK (length(trim(customer_name)) >= 2),
  customer_phone TEXT NOT NULL CHECK (length(trim(customer_phone)) >= 7),
  customer_nationality TEXT,
  customer_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Unique constraint to prevent double-booking on same slot (excluding cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot_unique
  ON bookings(slot_id) WHERE status != 'cancelled';

-- ============ STEP 4: CREATE AUDIT LOGS TABLE ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============ STEP 5: CREATE RATE LIMIT TRACKER TABLE ============
CREATE TABLE IF NOT EXISTS rate_limit_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT,
  fingerprint TEXT,
  action TEXT NOT NULL,
  count INT DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_ip
  ON rate_limit_tracker(ip_address, action, window_start DESC);

-- ============ STEP 6: AUTO-UPDATE updated_at TRIGGER ============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to availability_slots
DROP TRIGGER IF EXISTS update_availability_slots_updated_at ON availability_slots;
CREATE TRIGGER update_availability_slots_updated_at
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ STEP 7: ENABLE RLS ON ALL NEW TABLES ============
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracker ENABLE ROW LEVEL SECURITY;

-- ============ STEP 8: RLS POLICIES ============

-- ---- AVAILABILITY SLOTS ----

-- Public: read available slots for published properties
CREATE POLICY "availability_slots_select_public" ON availability_slots
  FOR SELECT USING (
    is_available = TRUE AND
    slot_date >= CURRENT_DATE AND
    EXISTS (
      SELECT 1 FROM properties WHERE id = property_id AND status = 'published'
    )
  );

-- Agents: full CRUD on slots for own properties
CREATE POLICY "availability_slots_agent_select" ON availability_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "availability_slots_agent_insert" ON availability_slots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "availability_slots_agent_update" ON availability_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

CREATE POLICY "availability_slots_agent_delete" ON availability_slots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

-- Admins: full access
CREATE POLICY "availability_slots_admin_all" ON availability_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- BOOKINGS ----

-- Public: insert bookings (visit requests) — anyone can book
CREATE POLICY "bookings_insert_public" ON bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM availability_slots WHERE id = slot_id AND is_available = TRUE
    ) AND
    EXISTS (
      SELECT 1 FROM properties WHERE id = property_id AND status = 'published'
    )
  );

-- Agents: read bookings for own properties
CREATE POLICY "bookings_select_agent" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

-- Agents: update booking status for own properties
CREATE POLICY "bookings_update_agent" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties WHERE id = property_id AND agent_id = auth.uid()
    ) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

-- Admins: full access
CREATE POLICY "bookings_admin_all" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- AUDIT LOGS ----

-- Admins: read only
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone can insert (server actions log via anon key)
CREATE POLICY "audit_logs_insert_all" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- Append-only: no updates or deletes
CREATE POLICY "audit_logs_no_update" ON audit_logs
  FOR UPDATE USING (FALSE);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
  FOR DELETE USING (FALSE);

-- ---- RATE LIMIT TRACKER ----

-- System: insert and read (server actions manage this)
CREATE POLICY "rate_limit_insert" ON rate_limit_tracker
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "rate_limit_select" ON rate_limit_tracker
  FOR SELECT USING (TRUE);

CREATE POLICY "rate_limit_update" ON rate_limit_tracker
  FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- ============ STEP 9: UPDATE EXISTING PROFILES RLS FOR ROLE ENFORCEMENT ============
-- Note: Run these only if you haven't already set up RLS on profiles.
-- If profiles already has RLS policies, you may need to DROP and recreate them.

-- Ensure profiles has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Set existing agent profiles (users who already have properties)
UPDATE profiles SET role = 'agent'
WHERE id IN (SELECT DISTINCT agent_id FROM properties)
AND role = 'customer';
