
-- Reactions
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "see reactions in own conversations"
ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_participant(m.conversation_id, auth.uid())));

CREATE POLICY "add own reactions in own conversations"
ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_participant(m.conversation_id, auth.uid())));

CREATE POLICY "remove own reactions"
ON public.message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Lobby 72h auto-delete
ALTER TABLE public.lobby_messages ALTER COLUMN expires_at SET DEFAULT (now() + interval '72 hours');
UPDATE public.lobby_messages SET expires_at = created_at + interval '72 hours' WHERE expires_at > created_at + interval '72 hours';

-- Cron purge every 10 min
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'axion6-purge-expired') THEN
    PERFORM cron.schedule('axion6-purge-expired', '*/10 * * * *', $cron$ SELECT public.purge_expired_messages(); $cron$);
  END IF;
END $$;
