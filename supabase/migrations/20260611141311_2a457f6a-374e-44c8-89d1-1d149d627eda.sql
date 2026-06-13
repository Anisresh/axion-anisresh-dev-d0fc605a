
CREATE POLICY "ws members read files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'workspace-files' AND public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "ws members upload files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'workspace-files' AND public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid()));

CREATE POLICY "ws members delete files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'workspace-files' AND public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid()));
