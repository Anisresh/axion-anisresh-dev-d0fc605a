
-- Add tables to realtime publication (idempotent)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'workspace_channels',
    'workspace_channel_messages',
    'workspace_polls',
    'workspace_poll_votes',
    'workspace_whiteboard_strokes'
  ]) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- Set replica identity full so updates/deletes carry full row payload
ALTER TABLE public.workspace_channels REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_channel_messages REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_polls REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_poll_votes REPLICA IDENTITY FULL;
ALTER TABLE public.workspace_whiteboard_strokes REPLICA IDENTITY FULL;

-- Fix poll vote update policy to also check workspace membership
DROP POLICY IF EXISTS "members change vote" ON public.workspace_poll_votes;
CREATE POLICY "members change vote" ON public.workspace_poll_votes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()));
