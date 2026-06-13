
-- Read receipts
CREATE TABLE public.message_reads (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.message_reads TO authenticated;
GRANT ALL ON public.message_reads TO service_role;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own conversation receipts" ON public.message_reads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_participant(m.conversation_id, auth.uid()))
);
CREATE POLICY "insert own receipt" ON public.message_reads FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_participant(m.conversation_id, auth.uid()))
);
CREATE POLICY "delete own receipt" ON public.message_reads FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Allow 'voice' kind on messages (already 'text'|'image'|'voice' in app; ensure no DB check blocks it)
-- No-op if no check constraint exists.

-- Realtime for new table + presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;

-- Add chosen theme preset column to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS palette TEXT NOT NULL DEFAULT 'warm-cafe';

-- Voice message duration column
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
