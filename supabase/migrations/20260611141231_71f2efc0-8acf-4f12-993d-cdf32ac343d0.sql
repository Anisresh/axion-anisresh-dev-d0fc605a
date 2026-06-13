
-- CHANNELS
CREATE TABLE public.workspace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_channels TO authenticated;
GRANT ALL ON public.workspace_channels TO service_role;
ALTER TABLE public.workspace_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read channels" ON public.workspace_channels FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members write channels" ON public.workspace_channels FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "creators delete channels" ON public.workspace_channels FOR DELETE TO authenticated
  USING (created_by = auth.uid());
CREATE INDEX ON public.workspace_channels(workspace_id);

CREATE TABLE public.workspace_channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.workspace_channel_messages TO authenticated;
GRANT ALL ON public.workspace_channel_messages TO service_role;
ALTER TABLE public.workspace_channel_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read ch msgs" ON public.workspace_channel_messages FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members write ch msgs" ON public.workspace_channel_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "authors delete ch msgs" ON public.workspace_channel_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE INDEX ON public.workspace_channel_messages(channel_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_channel_messages;

-- FILES
CREATE TABLE public.workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  mime TEXT,
  size BIGINT,
  uploader_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.workspace_files TO authenticated;
GRANT ALL ON public.workspace_files TO service_role;
ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read files" ON public.workspace_files FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members upload files" ON public.workspace_files FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND uploader_id = auth.uid());
CREATE POLICY "uploaders delete files" ON public.workspace_files FOR DELETE TO authenticated
  USING (uploader_id = auth.uid());
CREATE INDEX ON public.workspace_files(workspace_id);

-- EVENTS
CREATE TABLE public.workspace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  meet_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_events TO authenticated;
GRANT ALL ON public.workspace_events TO service_role;
ALTER TABLE public.workspace_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read events" ON public.workspace_events FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members write events" ON public.workspace_events FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "creators update events" ON public.workspace_events FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "creators delete events" ON public.workspace_events FOR DELETE TO authenticated
  USING (created_by = auth.uid());
CREATE INDEX ON public.workspace_events(workspace_id, starts_at);

-- POLLS
CREATE TABLE public.workspace_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  closed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_polls TO authenticated;
GRANT ALL ON public.workspace_polls TO service_role;
ALTER TABLE public.workspace_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read polls" ON public.workspace_polls FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members write polls" ON public.workspace_polls FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "creators update polls" ON public.workspace_polls FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "creators delete polls" ON public.workspace_polls FOR DELETE TO authenticated
  USING (created_by = auth.uid());
CREATE INDEX ON public.workspace_polls(workspace_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_polls;

CREATE TABLE public.workspace_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.workspace_polls(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_poll_votes TO authenticated;
GRANT ALL ON public.workspace_poll_votes TO service_role;
ALTER TABLE public.workspace_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read votes" ON public.workspace_poll_votes FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members cast vote" ON public.workspace_poll_votes FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "members change vote" ON public.workspace_poll_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_poll_votes;

-- EXPENSES
CREATE TABLE public.workspace_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT,
  paid_by UUID NOT NULL,
  split_with UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.workspace_expenses TO authenticated;
GRANT ALL ON public.workspace_expenses TO service_role;
ALTER TABLE public.workspace_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read expenses" ON public.workspace_expenses FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members add expenses" ON public.workspace_expenses FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND paid_by = auth.uid());
CREATE POLICY "payers delete expenses" ON public.workspace_expenses FOR DELETE TO authenticated
  USING (paid_by = auth.uid());
CREATE INDEX ON public.workspace_expenses(workspace_id);

-- AI MESSAGES
CREATE TABLE public.workspace_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.workspace_ai_messages TO authenticated;
GRANT ALL ON public.workspace_ai_messages TO service_role;
ALTER TABLE public.workspace_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read ai" ON public.workspace_ai_messages FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members write ai" ON public.workspace_ai_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE INDEX ON public.workspace_ai_messages(workspace_id, created_at);

-- WHITEBOARD
CREATE TABLE public.workspace_whiteboard_strokes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.workspace_whiteboard_strokes TO authenticated;
GRANT ALL ON public.workspace_whiteboard_strokes TO service_role;
ALTER TABLE public.workspace_whiteboard_strokes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read strokes" ON public.workspace_whiteboard_strokes FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members write strokes" ON public.workspace_whiteboard_strokes FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "members clear strokes" ON public.workspace_whiteboard_strokes FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE INDEX ON public.workspace_whiteboard_strokes(workspace_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_whiteboard_strokes;
