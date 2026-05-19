-- Allow anon/publishable key to update table status (admin UI, POS) when service_role is not used.
-- Prefer SUPABASE_SERVICE_ROLE_KEY in production and tighten these policies later.

CREATE POLICY "public update tables"
  ON public.restaurant_tables
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public insert logs"
  ON public.table_status_logs
  FOR INSERT
  WITH CHECK (true);
