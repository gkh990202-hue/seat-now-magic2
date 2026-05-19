-- 웨이팅 자리 선택 확장: 상관없음 / 원하는 자리 구분

ALTER TABLE public.waiting_entries
  ADD COLUMN IF NOT EXISTS seating_preference TEXT NOT NULL DEFAULT 'ANY',
  ADD COLUMN IF NOT EXISTS preferred_table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL;

UPDATE public.waiting_entries
SET seating_preference = 'ANY'
WHERE seating_preference IS NULL;

NOTIFY pgrst, 'reload schema';
