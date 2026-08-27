CREATE TABLE IF NOT EXISTS public.destinations (
  id varchar(160) PRIMARY KEY,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  slug varchar(220) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'inbox',
  cover_image text,
  summary text,
  representative_latitude double precision,
  representative_longitude double precision,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS destinations_family_slug_idx ON public.destinations (family_id, slug);
CREATE INDEX IF NOT EXISTS destinations_family_status_idx ON public.destinations (family_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.destination_items (
  id varchar(200) PRIMARY KEY,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  destination_id varchar(160) NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  type varchar(32) NOT NULL DEFAULT 'note',
  title varchar(240) NOT NULL,
  summary text,
  content text,
  latitude double precision,
  longitude double precision,
  address text,
  source_url text,
  source_name varchar(80),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(32) NOT NULL DEFAULT 'inbox',
  verify_required boolean NOT NULL DEFAULT true,
  cover_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS destination_items_lookup_idx ON public.destination_items (family_id, destination_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.destination_trip_links (
  destination_id varchar(160) NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  trip_id varchar(160) NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  relation_type varchar(32) NOT NULL DEFAULT 'reference',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (destination_id, trip_id)
);
REVOKE ALL ON public.destinations, public.destination_items, public.destination_trip_links FROM anon, authenticated;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_trip_links ENABLE ROW LEVEL SECURITY;
