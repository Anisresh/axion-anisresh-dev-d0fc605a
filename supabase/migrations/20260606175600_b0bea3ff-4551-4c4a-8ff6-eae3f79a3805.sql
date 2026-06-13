
-- 1. Trigger so new sign-ups get a profile + settings row automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Backfill existing users that have no profile/settings
INSERT INTO public.profiles (id, username, display_name, avatar_url)
SELECT
  u.id,
  COALESCE(
    NULLIF(lower(regexp_replace(COALESCE(u.raw_user_meta_data->>'username', split_part(u.email,'@',1)), '[^a-z0-9_]', '', 'g')), ''),
    'user' || substr(u.id::text, 1, 6)
  ) || '_' || substr(u.id::text, 1, 4) AS username,
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1), 'Friend') AS display_name,
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_settings (user_id)
SELECT u.id FROM auth.users u
LEFT JOIN public.user_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;

-- 3. Seed permanent public lobby sections (idempotent)
INSERT INTO public.lobbies (slug, name, description) VALUES
  ('announcements', 'Announcements', 'Official updates and news from Axion6'),
  ('general',       'General',       'Open conversation — anything goes (be kind)'),
  ('study',         'Study',         'Quiet focus, study buddies, learning'),
  ('gaming',        'Gaming',        'Games, tournaments, finding teammates'),
  ('technology',    'Technology',    'Tech, code, gadgets, AI')
ON CONFLICT (slug) DO NOTHING;

-- 4. Lobby messages: 60h auto-expiry going forward
ALTER TABLE public.lobby_messages
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '60 hours');

-- Update any existing rows that were stamped with the old 72h default
UPDATE public.lobby_messages
SET expires_at = created_at + interval '60 hours'
WHERE expires_at > created_at + interval '60 hours';

-- 5. Purge function called by pg_cron every 10 minutes
CREATE OR REPLACE FUNCTION public.purge_expired_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.lobby_messages WHERE expires_at < now();
  DELETE FROM public.messages       WHERE expires_at < now();
END;
$$;
