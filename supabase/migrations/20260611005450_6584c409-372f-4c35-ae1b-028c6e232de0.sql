
-- Workspace type and role enums
DO $$ BEGIN
  CREATE TYPE public.workspace_type AS ENUM ('teacher','student','parent','friends','business','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.workspace_privacy AS ENUM ('public','private','invite','organization');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.workspace_role AS ENUM ('owner','admin','moderator','member','guest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{4,32}$'),
  type public.workspace_type NOT NULL DEFAULT 'custom',
  emoji text DEFAULT '✨',
  description text CHECK (description IS NULL OR length(description) <= 500),
  cover_url text,
  theme text DEFAULT 'default',
  privacy public.workspace_privacy NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspace members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.workspace_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helpers to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace AND user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.workspace_role_of(_workspace uuid, _user uuid)
RETURNS public.workspace_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.workspace_members WHERE workspace_id = _workspace AND user_id = _user;
$$;

REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) TO authenticated, service_role;

-- Workspaces policies
CREATE POLICY "ws_select_public_or_member" ON public.workspaces FOR SELECT TO authenticated
  USING (privacy = 'public' OR owner_id = auth.uid() OR public.is_workspace_member(id, auth.uid()));

CREATE POLICY "ws_insert_self_owner" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "ws_update_owner_admin" ON public.workspaces FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.workspace_role_of(id, auth.uid()) IN ('admin'))
  WITH CHECK (owner_id = auth.uid() OR public.workspace_role_of(id, auth.uid()) IN ('admin'));

CREATE POLICY "ws_delete_owner" ON public.workspaces FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Members policies
CREATE POLICY "wm_select_self_or_members" ON public.workspace_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "wm_insert_owner_or_self_for_public" ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR w.privacy = 'public'))
    )
  );

CREATE POLICY "wm_update_owner_admin" ON public.workspace_members FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
    OR public.workspace_role_of(workspace_id, auth.uid()) IN ('admin')
  );

CREATE POLICY "wm_delete_owner_admin_or_self" ON public.workspace_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
    OR public.workspace_role_of(workspace_id, auth.uid()) IN ('admin')
  );

-- Auto-add owner as owner-member on workspace creation
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_workspace() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_handle_new_workspace ON public.workspaces;
CREATE TRIGGER trg_handle_new_workspace
AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace();

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
