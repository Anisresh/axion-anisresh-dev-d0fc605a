
-- tasks
CREATE TABLE public.workspace_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  due_at timestamptz,
  assigned_to uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_tasks TO authenticated;
GRANT ALL ON public.workspace_tasks TO service_role;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks members read" ON public.workspace_tasks FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "tasks members insert" ON public.workspace_tasks FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "tasks members update" ON public.workspace_tasks FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "tasks owner delete" ON public.workspace_tasks FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.workspace_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notes
CREATE TABLE public.workspace_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_notes TO authenticated;
GRANT ALL ON public.workspace_notes TO service_role;
ALTER TABLE public.workspace_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes members read" ON public.workspace_notes FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "notes members insert" ON public.workspace_notes FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "notes members update" ON public.workspace_notes FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "notes owner delete" ON public.workspace_notes FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.workspace_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- birthdays
CREATE TABLE public.workspace_birthdays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  day int NOT NULL CHECK (day BETWEEN 1 AND 31),
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_birthdays TO authenticated;
GRANT ALL ON public.workspace_birthdays TO service_role;
ALTER TABLE public.workspace_birthdays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bday members read" ON public.workspace_birthdays FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "bday members insert" ON public.workspace_birthdays FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "bday owner delete" ON public.workspace_birthdays FOR DELETE TO authenticated USING (created_by = auth.uid());

-- playlists
CREATE TABLE public.workspace_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  spotify_url text NOT NULL,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_playlists TO authenticated;
GRANT ALL ON public.workspace_playlists TO service_role;
ALTER TABLE public.workspace_playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl members read" ON public.workspace_playlists FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "pl members insert" ON public.workspace_playlists FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND added_by = auth.uid());
CREATE POLICY "pl owner delete" ON public.workspace_playlists FOR DELETE TO authenticated USING (added_by = auth.uid());
