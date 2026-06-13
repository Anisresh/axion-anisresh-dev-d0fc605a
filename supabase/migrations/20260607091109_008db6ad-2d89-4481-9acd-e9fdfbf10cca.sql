
-- Attach the new-user trigger so signups get a profile + settings row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing users that don't have one
INSERT INTO public.profiles (id, username, display_name)
SELECT u.id,
       lower(regexp_replace(coalesce(split_part(u.email,'@',1), 'user'), '[^a-z0-9_]', '', 'g')) || substr(u.id::text, 1, 4),
       coalesce(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1), 'Friend')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Backfill settings
INSERT INTO public.user_settings (user_id)
SELECT u.id FROM auth.users u
LEFT JOIN public.user_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;
