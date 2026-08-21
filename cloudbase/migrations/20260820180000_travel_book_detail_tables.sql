CREATE TABLE IF NOT EXISTS public.trip_days (
  id varchar(180) PRIMARY KEY, trip_id varchar(160) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE, day_number integer NOT NULL, date date,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.places (
  id varchar(200) PRIMARY KEY, trip_id varchar(160) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id varchar(180) REFERENCES public.trip_days(id) ON DELETE CASCADE, family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name varchar(240) NOT NULL, latitude double precision, longitude double precision, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id varchar(200) PRIMARY KEY, trip_id varchar(160) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE, day_id varchar(180) NOT NULL,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE, parent_note text, child_quote text, favorite text, photo_story text,
  is_draft boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.photos (
  id varchar(200) PRIMARY KEY, trip_id varchar(160) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE, day_id varchar(180) NOT NULL,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE, original_file_id text, display_file_id text, caption text,
  sort_order integer NOT NULL DEFAULT 0, share_selected boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS trip_days_trip_order_idx ON public.trip_days (trip_id, day_number);
CREATE INDEX IF NOT EXISTS places_day_idx ON public.places (day_id);
CREATE INDEX IF NOT EXISTS diaries_trip_day_idx ON public.diary_entries (trip_id, day_id);
CREATE INDEX IF NOT EXISTS photos_trip_day_order_idx ON public.photos (trip_id, day_id, sort_order);
REVOKE ALL ON public.trip_days, public.places, public.diary_entries, public.photos FROM anon, authenticated;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
