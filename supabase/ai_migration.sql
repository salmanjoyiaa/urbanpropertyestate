-- =============================================
-- AI Features Database Migration
-- Run this in Supabase SQL Editor AFTER 
-- migration.sql, seed.sql, and storage setup
-- =============================================

-- ===========================================
-- 1. LISTING TRANSLATIONS TABLE
-- Stores AI-generated multilingual translations
-- ===========================================
CREATE TABLE IF NOT EXISTS public.listing_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  language_code TEXT NOT NULL,            -- 'ar', 'es', 'it', 'fr'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  generated_by TEXT DEFAULT 'ai',         -- 'ai' or 'manual'
  model_used TEXT,                        -- e.g., 'llama-3.3-70b-versatile'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One translation per language per property
  UNIQUE(property_id, language_code)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_translations_property 
  ON public.listing_translations(property_id);
CREATE INDEX IF NOT EXISTS idx_translations_language 
  ON public.listing_translations(language_code);

-- RLS Policies
ALTER TABLE public.listing_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view translations"
  ON public.listing_translations FOR SELECT
  USING (true);

CREATE POLICY "Agents can manage their property translations"
  ON public.listing_translations FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE agent_id = auth.uid()
    )
  );

-- ===========================================
-- 2. AI AUDIT LOG TABLE
-- Tracks all AI operations for transparency
-- ===========================================
CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,                  -- 'copilot', 'search', 'summarize', 'whatsapp', etc.
  model TEXT NOT NULL,                    -- model used
  input_summary TEXT,                     -- truncated input (no PII)
  output_summary TEXT,                    -- truncated output
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  compliance_passed BOOLEAN,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by feature and user
CREATE INDEX IF NOT EXISTS idx_audit_feature 
  ON public.ai_audit_log(feature);
CREATE INDEX IF NOT EXISTS idx_audit_user 
  ON public.ai_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created 
  ON public.ai_audit_log(created_at DESC);

-- RLS Policies
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON public.ai_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.ai_audit_log FOR INSERT
  WITH CHECK (true);

-- ===========================================
-- 3. LEADS TABLE
-- Stores inbound lead inquiries with AI scoring
-- ===========================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'whatsapp',         -- 'whatsapp', 'form', 'call', 'email'
  
  -- AI Classification
  temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('hot', 'warm', 'cold')),
  score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  ai_reasons TEXT[] DEFAULT '{}',
  suggested_follow_up TEXT,
  follow_up_delay INTEGER DEFAULT 1440,   -- minutes
  
  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_agent 
  ON public.leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_property 
  ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_temperature 
  ON public.leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_status 
  ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created 
  ON public.leads(created_at DESC);

-- RLS Policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can manage their own leads"
  ON public.leads FOR ALL
  USING (auth.uid() = agent_id);

CREATE POLICY "Anyone can create a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- ===========================================
-- 4. CONSENT LOG TABLE
-- GDPR/privacy compliance - tracks data consent
-- ===========================================
CREATE TABLE IF NOT EXISTS public.consent_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,             -- 'ai_processing', 'data_storage', 'marketing', 'analytics'
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  version TEXT DEFAULT '1.0',             -- consent form version
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_consent_user 
  ON public.consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_type 
  ON public.consent_log(consent_type);

-- RLS Policies
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent records"
  ON public.consent_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consent"
  ON public.consent_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can revoke their own consent"
  ON public.consent_log FOR UPDATE
  USING (auth.uid() = user_id);

-- ===========================================
-- 5. LISTING FLAGS TABLE
-- Fraud detection & compliance flags
-- ===========================================
CREATE TABLE IF NOT EXISTS public.listing_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  flagged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('fraud', 'compliance', 'user_report', 'ai_detected')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason TEXT NOT NULL,
  details JSONB DEFAULT '{}',             -- AI analysis details (risk score, flags, etc.)
  
  -- Resolution
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flags_property 
  ON public.listing_flags(property_id);
CREATE INDEX IF NOT EXISTS idx_flags_type 
  ON public.listing_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_flags_status 
  ON public.listing_flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_severity 
  ON public.listing_flags(severity);

-- RLS Policies
ALTER TABLE public.listing_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view flags on their properties"
  ON public.listing_flags FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE agent_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create a flag"
  ON public.listing_flags FOR INSERT
  WITH CHECK (true);

-- ===========================================
-- 6. UPDATED_AT TRIGGERS
-- Auto-update updated_at on row changes
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_listing_translations_updated_at ON public.listing_translations;
CREATE TRIGGER update_listing_translations_updated_at
  BEFORE UPDATE ON public.listing_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================
-- DONE! All AI tables created successfully.
-- ===========================================
