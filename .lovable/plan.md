## Scope

Make every workspace tab functional with real persistence + realtime, in one build, using the existing style.

## Backend (one migration)

New tables, all scoped to `workspace_id` with RLS via `is_workspace_member`:

- `workspace_channels` (name, description) + `workspace_channel_messages` (channel_id, user_id, content, created_at) — realtime
- `workspace_files` (name, path, mime, size, uploader_id) → Supabase Storage bucket `workspace-files` (private, RLS by membership)
- `workspace_events` (title, description, starts_at, ends_at, meet_url, created_by) — calendar
- `workspace_polls` (question, options jsonb, closes_at, created_by) + `workspace_poll_votes` (poll_id, user_id, option_index) — realtime
- `workspace_expenses` (title, amount, category, paid_by, split_with uuid[], created_at)
- `workspace_ai_messages` (user_id, role, content, created_at) — per-workspace AI thread
- `workspace_whiteboard_strokes` (data jsonb, user_id, created_at) — realtime simple drawing

All tables: GRANTs, RLS (members can read/write their workspace), realtime publication, updated_at triggers where needed.

## Frontend

Refactor `workspaces.$slug.tsx` tabs to use real data:

- **Channels**: list + create channels, message thread, realtime subscribe, send with Enter
- **Files**: upload to storage, list, download, delete (uploader/admin only)
- **Calendar**: month/list view, create event modal with "Generate Meet link" (opens meet.new + stores URL), join button per event
- **Polls**: create poll, vote (one vote/user), live results bar chart, close poll
- **Expenses**: add expense form, list with totals per member, simple split-equal
- **AI**: reuse existing `xaiChat` serverFn but with `workspace_id` context table (new `workspace_ai_messages` for per-workspace history) — new serverFn `workspaceAiChat`
- **Whiteboard**: canvas with pen + clear, strokes broadcast via realtime + persisted
- **Members**: already works, keep

Also fix hydration error (date formatting → use fixed format) and ensure Start Meet button generates a stored link rather than just opening meet.new.

## Style

Reuse existing tokens: `bg-card-gradient`, `rounded-3xl`, `shadow-soft`, `bg-primary-gradient`, glass borders. Lucide icons. Same active-tab style as current.

## Out of scope (call out)

- Voice rooms, RAG over uploaded files, expense receipts OCR, attendance, gradebook, admin dashboard, SSO/2FA — these would each be their own build.

## Confirm

Proceeding builds 7 features + 1 migration + 1 storage bucket + ~7 new files in one go. Want me to go?