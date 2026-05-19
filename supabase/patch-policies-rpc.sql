-- Run in Supabase Dashboard → SQL Editor (project: zuwgfdxwuyijbxiqqkxs)
-- Safe to re-run. Applies policies + RPC missing from a partial setup.

DROP POLICY IF EXISTS "public update tables" ON public.restaurant_tables;
CREATE POLICY "public update tables"
  ON public.restaurant_tables
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "public insert logs" ON public.table_status_logs;
CREATE POLICY "public insert logs"
  ON public.table_status_logs
  FOR INSERT
  WITH CHECK (true);

DO $$
BEGIN
  CREATE TYPE public.table_status AS ENUM ('EMPTY', 'OCCUPIED', 'CLEANING', 'RESERVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.set_table_status(
  p_table_id uuid,
  p_new_status public.table_status,
  p_source text DEFAULT 'admin',
  p_payload jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table public.restaurant_tables%ROWTYPE;
  v_previous public.table_status;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_table FROM public.restaurant_tables WHERE id = p_table_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'table not found';
  END IF;

  v_previous := v_table.status;

  UPDATE public.restaurant_tables
  SET
    status = p_new_status,
    updated_at = v_now,
    occupied_at = CASE WHEN p_new_status = 'OCCUPIED' THEN v_now ELSE NULL END
  WHERE id = p_table_id;

  INSERT INTO public.table_status_logs (
    restaurant_id,
    table_id,
    table_number,
    previous_status,
    new_status,
    source,
    payload
  )
  VALUES (
    v_table.restaurant_id,
    v_table.id,
    v_table.table_number,
    v_previous,
    p_new_status,
    COALESCE(NULLIF(trim(p_source), ''), 'admin'),
    COALESCE(p_payload, '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'previous_status', v_previous,
    'new_status', p_new_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_table_status(uuid, public.table_status, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_table_status(uuid, public.table_status, text, jsonb)
  TO anon, authenticated, service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.restaurant_tables REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';

SELECT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'set_table_status'
) AS set_table_status_installed;
