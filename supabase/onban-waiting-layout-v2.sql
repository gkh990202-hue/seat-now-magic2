-- 온반 운영 데이터 확장: 주소, 웨이팅, 테이블 이름/크기 편집용 컬럼

ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS table_label TEXT,
  ADD COLUMN IF NOT EXISTS seat_label TEXT,
  ADD COLUMN IF NOT EXISTS layout_w NUMERIC,
  ADD COLUMN IF NOT EXISTS layout_h NUMERIC;

CREATE TABLE IF NOT EXISTS public.waiting_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  people INT NOT NULL DEFAULT 2,
  seating_preference TEXT NOT NULL DEFAULT 'ANY',
  preferred_table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'WAITING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waiting_entries
  ADD COLUMN IF NOT EXISTS seating_preference TEXT NOT NULL DEFAULT 'ANY',
  ADD COLUMN IF NOT EXISTS preferred_table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;

ALTER TABLE public.waiting_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read waiting entries" ON public.waiting_entries;
CREATE POLICY "public read waiting entries"
  ON public.waiting_entries
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "public insert waiting entries" ON public.waiting_entries;
CREATE POLICY "public insert waiting entries"
  ON public.waiting_entries
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "public update waiting entries" ON public.waiting_entries;
CREATE POLICY "public update waiting entries"
  ON public.waiting_entries
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

INSERT INTO public.restaurants (id, name, address)
VALUES (
  'a0000001-0001-4001-8001-000000000001',
  '온반',
  '대전 서구 도안동'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

UPDATE public.restaurant_tables
SET
  table_label = COALESCE(table_label, 'T' || table_number::text),
  seat_label = COALESCE(seat_label, seats::text || '인석'),
  layout_w = COALESCE(layout_w, 24),
  layout_h = COALESCE(layout_h, 22),
  updated_at = now()
WHERE restaurant_id = 'a0000001-0001-4001-8001-000000000001'
  AND table_number BETWEEN 1 AND 6;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.waiting_entries;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.restaurant_tables REPLICA IDENTITY FULL;
ALTER TABLE public.waiting_entries REPLICA IDENTITY FULL;
NOTIFY pgrst, 'reload schema';
