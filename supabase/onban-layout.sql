-- Supabase SQL Editor에서 실행하세요.
-- 매장명을 "온반"으로 바꾸고, 6개 테이블의 배치 좌표를 추가합니다.

ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS layout_x NUMERIC,
  ADD COLUMN IF NOT EXISTS layout_y NUMERIC;

INSERT INTO public.restaurants (id, name, address)
VALUES (
  'a0000001-0001-4001-8001-000000000001',
  '온반',
  '대전 서구 도안동'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address;

INSERT INTO public.restaurant_tables (
  restaurant_id,
  table_number,
  seats,
  status,
  layout_x,
  layout_y
)
VALUES
  ('a0000001-0001-4001-8001-000000000001', 1, 4, 'EMPTY'::public.table_status, 24, 28),
  ('a0000001-0001-4001-8001-000000000001', 2, 4, 'EMPTY'::public.table_status, 50, 28),
  ('a0000001-0001-4001-8001-000000000001', 3, 4, 'OCCUPIED'::public.table_status, 76, 28),
  ('a0000001-0001-4001-8001-000000000001', 4, 4, 'OCCUPIED'::public.table_status, 24, 68),
  ('a0000001-0001-4001-8001-000000000001', 5, 4, 'CLEANING'::public.table_status, 50, 68),
  ('a0000001-0001-4001-8001-000000000001', 6, 4, 'RESERVED'::public.table_status, 76, 68)
ON CONFLICT (restaurant_id, table_number) DO UPDATE SET
  seats = EXCLUDED.seats,
  status = EXCLUDED.status,
  layout_x = COALESCE(public.restaurant_tables.layout_x, EXCLUDED.layout_x),
  layout_y = COALESCE(public.restaurant_tables.layout_y, EXCLUDED.layout_y),
  occupied_at = CASE
    WHEN EXCLUDED.status = 'OCCUPIED' THEN now()
    ELSE NULL
  END,
  updated_at = now();

DELETE FROM public.restaurant_tables
WHERE restaurant_id = 'a0000001-0001-4001-8001-000000000001'
  AND table_number > 6;

ALTER TABLE public.restaurant_tables REPLICA IDENTITY FULL;
NOTIFY pgrst, 'reload schema';
