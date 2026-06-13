
GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_participant(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Addressee updates friendship status" ON public.friendships;
DROP POLICY IF EXISTS "Update own friendships" ON public.friendships;
CREATE POLICY "Addressee updates friendship status"
  ON public.friendships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id AND status = 'pending')
  WITH CHECK (auth.uid() = addressee_id AND requester_id <> auth.uid());
