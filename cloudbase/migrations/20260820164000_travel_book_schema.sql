CREATE TABLE IF NOT EXISTS public.families (
  id varchar(128) PRIMARY KEY,
  name varchar(200) NOT NULL DEFAULT '我们的家',
  member_openids jsonb NOT NULL DEFAULT '[]'::jsonb,
  admin_openids jsonb NOT NULL DEFAULT '[]'::jsonb,
  child_profile_id varchar(128),
  ai_quota jsonb NOT NULL DEFAULT '{"month":"","plansUsed":0,"plansLimit":5,"editsUsed":0,"editsLimit":20}'::jsonb,
  invite_code varchar(32),
  invite_expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id varchar(128) PRIMARY KEY,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_openid varchar(128),
  role varchar(32) NOT NULL DEFAULT 'parent',
  child_nickname varchar(64),
  child_birthday date,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trips (
  id varchar(160) PRIMARY KEY,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  status varchar(32) NOT NULL DEFAULT 'draft',
  start_date date,
  end_date date,
  title varchar(240) NOT NULL,
  representative jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.share_snapshots (
  token varchar(220) PRIMARY KEY,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  trip_id varchar(160) NOT NULL,
  title varchar(240),
  date_range varchar(120),
  memory text,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id varchar(160) PRIMARY KEY,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  action varchar(32) NOT NULL,
  form jsonb,
  draft jsonb,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS families_member_openids_idx ON public.families USING gin (member_openids);
CREATE INDEX IF NOT EXISTS profiles_family_id_idx ON public.profiles (family_id);
CREATE INDEX IF NOT EXISTS trips_family_dates_idx ON public.trips (family_id, start_date DESC);
CREATE INDEX IF NOT EXISTS trips_family_deleted_idx ON public.trips (family_id, deleted_at);
CREATE INDEX IF NOT EXISTS shares_expiry_idx ON public.share_snapshots (family_id, expires_at);
CREATE INDEX IF NOT EXISTS ai_sessions_family_idx ON public.ai_sessions (family_id, created_at DESC);

REVOKE ALL ON public.families, public.profiles, public.trips, public.share_snapshots, public.ai_sessions FROM anon, authenticated;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
