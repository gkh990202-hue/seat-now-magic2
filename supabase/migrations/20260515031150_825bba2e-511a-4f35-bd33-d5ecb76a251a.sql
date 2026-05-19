
CREATE TYPE public.table_status AS ENUM ('EMPTY', 'OCCUPIED', 'CLEANING', 'RESERVED');

CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  pos_api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  seats INT NOT NULL DEFAULT 4,
  status public.table_status NOT NULL DEFAULT 'EMPTY',
  occupied_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, table_number)
);

CREATE TABLE public.table_status_logs (
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

CREATE INDEX idx_logs_restaurant_created ON public.table_status_logs (restaurant_id, created_at DESC);
CREATE INDEX idx_logs_table_created ON public.table_status_logs (table_id, created_at DESC);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "public read tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "public read logs" ON public.table_status_logs FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
ALTER TABLE public.restaurant_tables REPLICA IDENTITY FULL;
