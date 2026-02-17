-- ============================================================================
-- Atomic Rate Limiting RPC
-- Replaces in-memory rate limiting with DB-backed atomic counters.
-- Works correctly across serverless invocations (no shared memory).
-- ============================================================================

-- Atomic rate-limit check-and-increment function.
-- Returns TRUE if the request is allowed, FALSE if rate-limited.
-- Uses SELECT ... FOR UPDATE to prevent race conditions.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_record rate_limit_tracker%ROWTYPE;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Try to find an existing record within the current window (with row lock)
  SELECT * INTO v_record
  FROM rate_limit_tracker
  WHERE ip_address = p_identifier
    AND action = p_action
    AND window_start >= v_window_start
  ORDER BY window_start DESC
  LIMIT 1
  FOR UPDATE;

  IF v_record.id IS NOT NULL THEN
    -- Record found — check if limit is exceeded
    IF v_record.count >= p_max_requests THEN
      RETURN FALSE;
    END IF;

    -- Increment atomically
    UPDATE rate_limit_tracker
    SET count = count + 1
    WHERE id = v_record.id;

    RETURN TRUE;
  ELSE
    -- No record in window — create a new one
    INSERT INTO rate_limit_tracker (ip_address, action, count, window_start)
    VALUES (p_identifier, p_action, 1, NOW());

    RETURN TRUE;
  END IF;
END;
$$;

-- Periodic cleanup: delete expired rate-limit records older than 1 hour.
-- Call this via a Supabase cron job or pg_cron extension.
CREATE OR REPLACE FUNCTION cleanup_rate_limit_tracker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_tracker
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Admin-only policies for property_blocks (missing from base migration)
-- Allow admins to manage property_blocks for any property
CREATE POLICY "property_blocks_admin_all" ON public.property_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
