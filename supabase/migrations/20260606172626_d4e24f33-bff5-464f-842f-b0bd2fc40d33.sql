
-- 1) Chat media: restrict direct reads to file owner only (participants view via signed URLs)
DROP POLICY IF EXISTS "Authenticated read chat media" ON storage.objects;
CREATE POLICY "Owner reads own chat media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 2) conversation_participants: only conversation owner can add participants
DROP POLICY IF EXISTS "Add participants" ON public.conversation_participants;
CREATE POLICY "Owner adds participants"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.owner_id = auth.uid()
    )
  );
