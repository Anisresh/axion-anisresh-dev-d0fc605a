
-- 1) Reviews: explicit deny on public SELECT (only service_role/admin reads)
DROP POLICY IF EXISTS "no public reads on reviews" ON public.reviews;
CREATE POLICY "no public reads on reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (false);

-- 2) Consolidate is_participant to app_private and update message_reactions policies
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.is_participant(c uuid, u uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = c AND user_id = u);
$$;

REVOKE ALL ON FUNCTION app_private.is_participant(uuid, uuid) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "see reactions in own conversations" ON public.message_reactions;
CREATE POLICY "see reactions in own conversations" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_reactions.message_id
      AND app_private.is_participant(m.conversation_id, auth.uid())
  ));

DROP POLICY IF EXISTS "add own reactions in own conversations" ON public.message_reactions;
CREATE POLICY "add own reactions in own conversations" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND app_private.is_participant(m.conversation_id, auth.uid())
    )
  );

-- Now safe to drop the duplicate public function
DROP FUNCTION IF EXISTS public.is_participant(uuid, uuid);

-- 3) Lock down SECURITY DEFINER helpers — not meant to be called by clients
REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_expired_messages() FROM PUBLIC, anon, authenticated;
