-- Demo seed (safe to re-run)
INSERT INTO public.restaurants (id, name, address)
VALUES (
  'a0000001-0001-4001-8001-000000000001',
  '성수 라멘공방',
  '서울 성동구 성수동'
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
