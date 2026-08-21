CREATE TABLE IF NOT EXISTS public.family_invites (
  id varchar(160) PRIMARY KEY,
  family_id varchar(128) NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  code_hash varchar(128) NOT NULL,
  role varchar(32) NOT NULL DEFAULT 'admin',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by_openid varchar(128),
  created_by_openid varchar(128) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS family_invites_lookup_idx ON public.family_invites (code_hash, used_at, expires_at);
REVOKE ALL ON public.family_invites FROM anon, authenticated;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.share_snapshots ADD COLUMN IF NOT EXISTS token_hash varchar(128);
ALTER TABLE public.share_snapshots ADD COLUMN IF NOT EXISTS created_by_openid varchar(128);
