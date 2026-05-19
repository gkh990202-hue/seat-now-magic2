-- Supabase Dashboard → SQL Editor → Run (full setup: schema + RPC + demo data)
-- Safe to re-run: skips objects that already exist.

-- 1) Enum
DO $$
BEGIN
  CREATE TYPE public.table_status AS ENUM ('EMPTY', 'OCCUPIED', 'CLEANING', 'RESERVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  pos_api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  seats INT NOT NULL DEFAULT 4,
  status public.table_status NOT NULL DEFAULT 'EMPTY',
  occupied_at TIMESTAMPTZ,
  layout_x NUMERIC,
  layout_y NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, table_number)
);

ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS layout_x NUMERIC,
  ADD COLUMN IF NOT EXISTS layout_y NUMERIC;

CREATE TABLE IF NOT EXISTS public.table_status_logs (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  previous_status public.table_status,
  new_status public.table_status NOT NULL,
  source TEXT NOT NULL DEFAULT 'pos',
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_restaurant_created
  ON public.table_status_logs (restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_table_created
  ON public.table_status_logs (table_id, created_at DESC);

-- 3) RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_status_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read restaurants" ON public.restaurants;
CREATE POLICY "public read restaurants" ON public.restaurants FOR SELECT USING (true);

DROP POLICY IF EXISTS "public read tables" ON public.restaurant_tables;
CREATE POLICY "public read tables" ON public.restaurant_tables FOR SELECT USING (true);

DROP POLICY IF EXISTS "public read logs" ON public.table_status_logs;
CREATE POLICY "public read logs" ON public.table_status_logs FOR SELECT USING (true);

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

-- 4) Realtime (optional)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.restaurant_tables REPLICA IDENTITY FULL;

-- 5) Status change RPC (bypasses RLS on logs)
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

-- 6) Demo seed
INSERT INTO public.restaurants (id, name, address)
VALUES (
  'a0000001-0001-4001-8001-000000000001',
  '온반',
  '대전 서구 도안동'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

INSERT INTO public.restaurant_tables (restaurant_id, table_number, seats, status)
SELECT
  'a0000001-0001-4001-8001-000000000001',
  n,
  4,
  CASE
    WHEN n <= 2 THEN 'EMPTY'::public.table_status
    WHEN n <= 4 THEN 'OCCUPIED'::public.table_status
    WHEN n = 5 THEN 'CLEANING'::public.table_status
    ELSE 'RESERVED'::public.table_status
  END
FROM generate_series(1, 6) AS n
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

-- 6b) Demo table statuses (re-run safe; only tables 1–6 for demo restaurant)
UPDATE public.restaurant_tables rt
SET
  status = CASE
    WHEN rt.table_number <= 2 THEN 'EMPTY'::public.table_status
    WHEN rt.table_number <= 4 THEN 'OCCUPIED'::public.table_status
    WHEN rt.table_number = 5 THEN 'CLEANING'::public.table_status
    WHEN rt.table_number = 6 THEN 'RESERVED'::public.table_status
    ELSE rt.status
  END,
  occupied_at = CASE
    WHEN rt.table_number BETWEEN 3 AND 4 THEN now()
    ELSE NULL
  END,
  layout_x = CASE
    WHEN rt.table_number IN (1, 4) THEN 24
    WHEN rt.table_number IN (2, 5) THEN 50
    WHEN rt.table_number IN (3, 6) THEN 76
    ELSE rt.layout_x
  END,
  layout_y = CASE
    WHEN rt.table_number BETWEEN 1 AND 3 THEN 28
    WHEN rt.table_number BETWEEN 4 AND 6 THEN 68
    ELSE rt.layout_y
  END,
  updated_at = now()
WHERE rt.restaurant_id = 'a0000001-0001-4001-8001-000000000001'
  AND rt.table_number BETWEEN 1 AND 6;

DELETE FROM public.restaurant_tables
WHERE restaurant_id = 'a0000001-0001-4001-8001-000000000001'
  AND table_number > 6;

-- 7) Refresh PostgREST schema cache (required for rpc/set_table_status)
NOTIFY pgrst, 'reload schema';

-- 8) Verify (Results should show 1 row: installed = true)
SELECT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'set_table_status'
) AS set_table_status_installed;
