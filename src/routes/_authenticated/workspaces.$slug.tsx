import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Copy, Users, Bot, Calendar, FileText, MessageSquare, Video, Sparkles,
  GraduationCap, BookOpen, ClipboardCheck, Wallet, FolderKanban, Megaphone, Brain,
  ArrowLeft, Lock, Globe, UserPlus, BarChart3, Briefcase, Heart, CheckSquare,
  Plus, Send, Trash2, Download, Upload, Hash, X, Eraser, StickyNote, Cake, Music,
  ChevronLeft, ChevronRight, Pencil, MousePointer2, LogOut, Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { workspaceAiChat } from "@/lib/workspaceAi.functions";
import { useGlobalPlayer } from "@/components/GlobalPlayer";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
type Member = Database["public"]["Tables"]["workspace_members"]["Row"];

const TYPE_ICONS: Record<Workspace["type"], typeof Bot> = {
  teacher: GraduationCap, student: BookOpen, parent: Heart,
  friends: Users, business: Briefcase, custom: Sparkles,
};

export const Route = createFileRoute("/_authenticated/workspaces/$slug")({
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [ws, setWs] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("overview");

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [slug]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user?.id ?? null);
    const { data: w, error } = await supabase.from("workspaces").select("*").eq("slug", slug).maybeSingle();
    if (error || !w) { toast.error("Workspace not found"); navigate({ to: "/workspaces" }); return; }
    setWs(w);
    const { data: m } = await supabase.from("workspace_members").select("*").eq("workspace_id", w.id);
    setMembers(m ?? []);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (!ws || !me) return null;

  const tabs = getTabsForType(ws.type);
  const ActiveTab = tabs.find((t) => t.id === tab)?.component ?? OverviewTab;
  const TypeIcon = TYPE_ICONS[ws.type];

  function copyJoinCode() {
    const url = `${window.location.origin}/workspaces/${ws!.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Join link copied");
  }

  function startMeet() {
    window.open("https://meet.new", "_blank", "noopener,noreferrer");
    toast.success("Opening Google Meet…");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-xl hidden md:flex md:flex-col">
        <div className="p-5 border-b border-border/60">
          <Link to="/workspaces" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="size-3" /> All workspaces
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/15 text-primary grid place-items-center shrink-0">
              <TypeIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold tracking-tight truncate">{ws.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">@{ws.slug}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-soft ${active ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground/80 hover:bg-muted"}`}>
                <t.icon className="size-4" /> <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5">
          {ws.privacy === "public" ? <Globe className="size-3" /> : <Lock className="size-3" />}
          {ws.privacy}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="px-6 md:px-10 pt-6 pb-4 border-b border-border/60 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{tabs.find((t) => t.id === tab)?.label ?? "Overview"}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={startMeet} className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium shadow-glow hover:opacity-90 inline-flex items-center gap-1.5 tap" title="Start a Google Meet call">
              <Video className="size-3.5" /> Start Meet
            </button>
            <button onClick={copyJoinCode} className="h-9 px-3 rounded-xl glass border border-border/60 text-xs font-medium hover:bg-card inline-flex items-center gap-1.5">
              <Copy className="size-3.5" /> Share
            </button>
          </div>
        </header>
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 overflow-x-auto px-4 py-2 border-b border-border/60">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <main className="p-6 md:p-10 max-w-5xl">
          <ActiveTab ws={ws} members={members} me={me} />
        </main>
      </div>
    </div>
  );
}

type TabProps = { ws: Workspace; members: Member[]; me: string };
type Tab = { id: string; label: string; icon: typeof Bot; component: (p: TabProps) => React.ReactElement };

function getTabsForType(_type: Workspace["type"]): Tab[] {
  return [
    { id: "overview", label: "Overview", icon: Sparkles, component: OverviewTab },
    { id: "ai", label: "AI Assistant", icon: Bot, component: AITab },
    { id: "chat", label: "Channels", icon: MessageSquare, component: ChatTab },
    { id: "tasks", label: "Tasks", icon: CheckSquare, component: TasksTab },
    { id: "calendar", label: "Calendar", icon: Calendar, component: CalendarTab },
    { id: "notes", label: "Notes", icon: StickyNote, component: NotesTab },
    { id: "files", label: "Files", icon: FileText, component: FilesTab },
    { id: "polls", label: "Polls", icon: BarChart3, component: PollsTab },
    { id: "birthdays", label: "Birthdays", icon: Cake, component: BirthdaysTab },
    { id: "playlists", label: "Playlists", icon: Music, component: PlaylistsTab },
    { id: "whiteboard", label: "Whiteboard", icon: Sparkles, component: WhiteboardTab },
    { id: "expenses", label: "Expenses", icon: Wallet, component: ExpensesTab },
    { id: "analytics", label: "Analytics", icon: BarChart3, component: AnalyticsTab },
    { id: "members", label: "Members", icon: Users, component: MembersTab },
  ];
}

/* ---------- shared ---------- */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft ${className}`}>{children}</div>;
}
function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="text-center py-12">
      <Sparkles className="size-8 text-primary mx-auto" />
      <h3 className="mt-4 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{desc}</p>
    </Card>
  );
}
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(iso: string) { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtTime(iso: string) { const d = new Date(iso); return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`; }

/* ---------- Overview ---------- */
function OverviewTab({ ws, members }: TabProps) {
  return (
    <div className="space-y-6">
      {ws.description && <Card><p className="text-sm text-muted-foreground">{ws.description}</p></Card>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="text-xs uppercase text-muted-foreground">Members</div><div className="mt-2 text-3xl font-semibold">{members.length}</div></Card>
        <Card><div className="text-xs uppercase text-muted-foreground">Type</div><div className="mt-2 text-lg font-semibold capitalize">{ws.type}</div></Card>
        <Card><div className="text-xs uppercase text-muted-foreground">Privacy</div><div className="mt-2 text-lg font-semibold capitalize">{ws.privacy}</div></Card>
        <Card><div className="text-xs uppercase text-muted-foreground">Created</div><div className="mt-2 text-sm font-medium">{fmtDate(ws.created_at)}</div></Card>
      </div>
      <Card>
        <h3 className="font-semibold tracking-tight">Quick start</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Invite people with the share link (top right)</li>
          <li>• Ask the AI assistant anything in the AI tab</li>
          <li>• Upload shared files in Files</li>
          <li>• Schedule events in Calendar — start a Google Meet from any event</li>
        </ul>
      </Card>
    </div>
  );
}

/* ---------- AI ---------- */
function AITab({ ws, me }: TabProps) {
  const [msgs, setMsgs] = useState<{ id: string; role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chat = useServerFn(workspaceAiChat);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void (async () => {
    const { data } = await supabase.from("workspace_ai_messages").select("*").eq("workspace_id", ws.id).order("created_at");
    setMsgs((data ?? []).map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
  })(); }, [ws.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, sending]);

  async function send() {
    const text = input.trim(); if (!text || sending) return;
    setInput(""); setSending(true);
    const tempId = crypto.randomUUID();
    setMsgs((m) => [...m, { id: tempId, role: "user", content: text }]);
    try {
      const res = await chat({ data: { workspaceId: ws.id, userMessage: text } });
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: res.reply }]);
    } catch (e: any) { toast.error(e.message ?? "AI error"); }
    finally { setSending(false); }
  }

  return (
    <Card className="p-0 overflow-hidden flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            <Bot className="size-8 mx-auto text-primary" />
            <p className="mt-3">Ask anything. I'm your workspace AI.</p>
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && <div className="flex justify-start"><div className="bg-muted rounded-2xl px-4 py-2.5 text-sm"><Loader2 className="size-4 animate-spin" /></div></div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border/60 p-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the workspace AI…" className="flex-1 h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
        <button onClick={send} disabled={sending || !input.trim()} className="h-11 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center gap-1.5">
          <Send className="size-4" /> Send
        </button>
      </div>
    </Card>
  );
}

/* ---------- Chat / Channels ---------- */
function ChatTab({ ws, me }: TabProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function loadChannels() {
    const { data } = await supabase.from("workspace_channels").select("*").eq("workspace_id", ws.id).order("created_at");
    setChannels(data ?? []);
    if (!active && data && data.length) setActive(data[0].id);
  }
  useEffect(() => { void loadChannels(); /* eslint-disable-next-line */ }, [ws.id]);

  // Realtime: new channels show up live for everyone
  useEffect(() => {
    const ch = supabase.channel(`channels:${ws.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_channels", filter: `workspace_id=eq.${ws.id}` },
        () => loadChannels())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [ws.id]);

  useEffect(() => {
    if (!active) return;
    void (async () => {
      const { data } = await supabase.from("workspace_channel_messages").select("*").eq("channel_id", active).order("created_at");
      setMsgs(data ?? []);
    })();
    const ch = supabase.channel(`ch:${active}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workspace_channel_messages", filter: `channel_id=eq.${active}` },
        (p) => setMsgs((m) => [...m, p.new]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function createChannel() {
    const name = prompt("Channel name?")?.trim(); if (!name) return;
    const { data, error } = await supabase.from("workspace_channels").insert({ workspace_id: ws.id, name, created_by: me }).select().single();
    if (error) { toast.error(error.message); return; }
    setChannels((c) => [...c, data]); setActive(data.id);
  }
  async function send() {
    const text = input.trim(); if (!text || !active) return;
    setInput("");
    const { error } = await supabase.from("workspace_channel_messages").insert({ channel_id: active, workspace_id: ws.id, user_id: me, content: text });
    if (error) toast.error(error.message);
  }

  return (
    <Card className="p-0 overflow-hidden flex h-[70vh]">
      <div className="w-52 shrink-0 border-r border-border/60 flex flex-col">
        <div className="p-3 border-b border-border/60 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Channels</span>
          <button onClick={createChannel} className="text-primary hover:opacity-80"><Plus className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.length === 0 && <p className="text-xs text-muted-foreground p-3">No channels yet</p>}
          {channels.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${active === c.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <Hash className="size-3.5" /> {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {active ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.user_id === me ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.user_id === me ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div className="text-[10px] opacity-60 mb-0.5">{m.user_id.slice(0, 6)} · {fmtTime(m.created_at)}</div>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="border-t border-border/60 p-2 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…" className="flex-1 h-10 px-3 rounded-xl bg-input/60 border border-border text-sm" />
              <button onClick={send} disabled={!input.trim()} className="h-10 px-3 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-50"><Send className="size-4" /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-center p-6">
            <div>
              <Hash className="size-8 text-primary mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground">Create a channel to start chatting</p>
              <button onClick={createChannel} className="mt-4 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm">New channel</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Files ---------- */
function FilesTab({ ws, me }: TabProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data } = await supabase.from("workspace_files").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
    setFiles(data ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const path = `${ws.id}/${crypto.randomUUID()}-${f.name}`;
      const { error: upErr } = await supabase.storage.from("workspace-files").upload(path, f);
      if (upErr) throw upErr;
      const { error } = await supabase.from("workspace_files").insert({
        workspace_id: ws.id, name: f.name, path, mime: f.type, size: f.size, uploader_id: me,
      });
      if (error) throw error;
      toast.success("Uploaded");
      void load();
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ""; }
  }
  async function download(f: any) {
    const { data, error } = await supabase.storage.from("workspace-files").createSignedUrl(f.path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }
  async function remove(f: any) {
    if (!confirm(`Delete ${f.name}?`)) return;
    await supabase.storage.from("workspace-files").remove([f.path]);
    await supabase.from("workspace_files").delete().eq("id", f.id);
    void load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">Shared files</h3>
          <label className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer">
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Upload
            <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        </div>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">No files yet. Upload PDFs, docs, images, anything.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {files.map((f) => (
              <li key={f.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground">{f.mime || "file"} · {(f.size/1024).toFixed(1)} KB · {fmtDate(f.created_at)}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => download(f)} className="p-2 rounded-lg hover:bg-muted"><Download className="size-4" /></button>
                  {f.uploader_id === me && <button onClick={() => remove(f)} className="p-2 rounded-lg hover:bg-muted text-destructive"><Trash2 className="size-4" /></button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------- Calendar (Google-style week view) ---------- */
function CalendarTab({ ws, me }: TabProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Sunday
    return d;
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", starts_at: "", meet_url: "" });

  async function load() {
    const { data } = await supabase.from("workspace_events").select("*").eq("workspace_id", ws.id).order("starts_at");
    setEvents(data ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm
  const DAY_LABELS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const today = new Date(); today.setHours(0,0,0,0);

  function eventsOnDay(d: Date) {
    return events.filter((e) => {
      const ed = new Date(e.starts_at);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
    });
  }

  function shiftWeek(delta: number) {
    const d = new Date(weekStart); d.setDate(d.getDate() + delta * 7); setWeekStart(d);
  }
  function goToday() {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); setWeekStart(d);
  }

  function openAt(day: Date, hour: number) {
    const d = new Date(day); d.setHours(hour, 0, 0, 0);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(hour).padStart(2,"0")}:00`;
    setForm({ title: "", description: "", starts_at: iso, meet_url: "" });
    setOpen(true);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.starts_at) { toast.error("Pick a date/time"); return; }
    const { error } = await supabase.from("workspace_events").insert({
      workspace_id: ws.id, title: form.title, description: form.description || null,
      starts_at: new Date(form.starts_at).toISOString(), meet_url: form.meet_url || null, created_by: me,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setForm({ title: "", description: "", starts_at: "", meet_url: "" });
    toast.success("Event created"); void load();
  }
  function generateMeet() {
    window.open("https://meet.new", "_blank", "noopener,noreferrer");
    toast.info("Paste the Meet link from the new tab into the field");
  }
  async function remove(id: string) {
    if (!confirm("Delete event?")) return;
    await supabase.from("workspace_events").delete().eq("id", id);
    void load();
  }

  const monthLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden">
        <div className="p-3 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="h-9 px-3 rounded-xl glass border border-border/60 text-xs font-medium hover:bg-card">Today</button>
            <button onClick={() => shiftWeek(-1)} className="size-9 grid place-items-center rounded-xl hover:bg-muted"><ChevronLeft className="size-4" /></button>
            <button onClick={() => shiftWeek(1)} className="size-9 grid place-items-center rounded-xl hover:bg-muted"><ChevronRight className="size-4" /></button>
            <span className="ml-2 text-base font-semibold">{monthLabel}</span>
          </div>
          <button onClick={() => { const n = new Date(); setForm({ title:"", description:"", meet_url:"", starts_at: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}T${String(n.getHours()).padStart(2,"0")}:00`}); setOpen(true); }}
            className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> New event
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* day headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 sticky top-0 bg-card/80 backdrop-blur">
              <div />
              {days.map((d, i) => {
                const isToday = d.getTime() === today.getTime();
                return (
                  <div key={i} className="text-center py-2 border-l border-border/60">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{DAY_LABELS[i]}</div>
                    <div className={`mt-0.5 inline-grid place-items-center size-8 rounded-full text-sm ${isToday ? "bg-primary text-primary-foreground font-semibold" : "font-medium"}`}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {/* hours grid */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {hours.map((h) => (
                <div key={`row-${h}`} className="contents">
                  <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 border-t border-border/60 h-14">{h === 12 ? "12 PM" : h > 12 ? `${h-12} PM` : `${h} AM`}</div>
                  {days.map((d, di) => {
                    const cellEvents = eventsOnDay(d).filter((e) => new Date(e.starts_at).getHours() === h);
                    return (
                      <button key={`${h}-${di}`} onClick={() => openAt(d, h)} className="border-t border-l border-border/60 h-14 hover:bg-primary/5 transition-soft text-left p-1 relative">
                        {cellEvents.map((e) => (
                          <div key={e.id} className="bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate" title={e.title}>
                            {fmtTime(e.starts_at)} {e.title}
                          </div>
                        ))}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* List view below */}
      <Card>
        <h3 className="font-semibold tracking-tight">Upcoming events</h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">No events scheduled. Click a slot above to add one.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {events.slice(0, 8).map((e) => (
              <li key={e.id} className="p-3 rounded-xl border border-border/60 bg-background/40 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{e.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(e.starts_at)} · {fmtTime(e.starts_at)}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {e.meet_url && <a href={e.meet_url} target="_blank" rel="noopener noreferrer" className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs inline-flex items-center gap-1"><Video className="size-3.5" /> Join</a>}
                  {e.created_by === me && <button onClick={() => remove(e.id)} className="p-2 rounded-lg hover:bg-muted text-destructive"><Trash2 className="size-4" /></button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && (
        <Modal onClose={() => setOpen(false)} title="New event">
          <form onSubmit={create} className="space-y-3">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
            <input required type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows={2} className="w-full px-4 py-3 rounded-xl bg-input/60 border border-border text-sm resize-none" />
            <div className="flex gap-2">
              <input value={form.meet_url} onChange={(e) => setForm({ ...form, meet_url: e.target.value })} placeholder="Google Meet link (optional)" className="flex-1 h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
              <button type="button" onClick={generateMeet} className="h-11 px-3 rounded-xl glass border border-border/60 text-xs font-medium inline-flex items-center gap-1.5"><Video className="size-3.5" /> Meet.new</button>
            </div>
            <button type="submit" className="w-full h-11 rounded-xl bg-primary-gradient text-primary-foreground font-medium">Create</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Polls ---------- */
function PollsTab({ ws, me }: TabProps) {
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);

  async function load() {
    const { data: p } = await supabase.from("workspace_polls").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
    setPolls(p ?? []);
    const { data: v } = await supabase.from("workspace_poll_votes").select("*").eq("workspace_id", ws.id);
    setVotes(v ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);

  useEffect(() => {
    const ch = supabase.channel(`polls:${ws.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_poll_votes", filter: `workspace_id=eq.${ws.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_polls", filter: `workspace_id=eq.${ws.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [ws.id]);

  async function vote(pollId: string, idx: number) {
    const existing = votes.find((v) => v.poll_id === pollId && v.user_id === me);
    if (existing) {
      await supabase.from("workspace_poll_votes").update({ option_index: idx }).eq("id", existing.id);
    } else {
      await supabase.from("workspace_poll_votes").insert({ poll_id: pollId, workspace_id: ws.id, user_id: me, option_index: idx });
    }
  }
  async function createPoll(e: React.FormEvent) {
    e.preventDefault();
    const clean = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || clean.length < 2) { toast.error("Need a question and at least 2 options"); return; }
    const { error } = await supabase.from("workspace_polls").insert({ workspace_id: ws.id, question: q, options: clean, created_by: me });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setQ(""); setOpts(["", ""]); toast.success("Poll created");
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">Live polls</h3>
          <button onClick={() => setOpen(true)} className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> New poll
          </button>
        </div>
        {polls.length === 0 ? <p className="text-sm text-muted-foreground mt-4">No polls yet.</p> : (
          <div className="mt-4 space-y-4">
            {polls.map((p) => {
              const pVotes = votes.filter((v) => v.poll_id === p.id);
              const myVote = pVotes.find((v) => v.user_id === me)?.option_index;
              const total = pVotes.length || 1;
              return (
                <div key={p.id} className="p-4 rounded-2xl border border-border/60 bg-background/40">
                  <div className="font-medium text-sm">{p.question}</div>
                  <div className="mt-3 space-y-1.5">
                    {(p.options as string[]).map((o, i) => {
                      const count = pVotes.filter((v) => v.option_index === i).length;
                      const pct = Math.round((count / total) * 100);
                      const selected = myVote === i;
                      return (
                        <button key={i} onClick={() => vote(p.id, i)} className="w-full text-left relative overflow-hidden rounded-xl border border-border/60 px-3 py-2 hover:bg-muted transition-soft">
                          <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between text-sm">
                            <span className={selected ? "font-semibold text-primary" : ""}>{o}{selected && " ✓"}</span>
                            <span className="text-xs text-muted-foreground">{count} · {pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">{pVotes.length} vote{pVotes.length !== 1 ? "s" : ""}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {open && (
        <Modal onClose={() => setOpen(false)} title="New poll">
          <form onSubmit={createPoll} className="space-y-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Question" className="w-full h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
            {opts.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input value={o} onChange={(e) => setOpts(opts.map((x, j) => j === i ? e.target.value : x))} placeholder={`Option ${i+1}`} className="flex-1 h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
                {opts.length > 2 && <button type="button" onClick={() => setOpts(opts.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-muted"><X className="size-4" /></button>}
              </div>
            ))}
            <button type="button" onClick={() => setOpts([...opts, ""])} className="text-xs text-primary">+ Add option</button>
            <button type="submit" className="w-full h-11 rounded-xl bg-primary-gradient text-primary-foreground font-medium">Create poll</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Expenses ---------- */
function ExpensesTab({ ws, me, members }: TabProps) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", category: "Misc" });

  async function load() {
    const { data } = await supabase.from("workspace_expenses").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(form.amount); if (!amt || amt <= 0) { toast.error("Enter amount"); return; }
    const splitWith = members.map((m) => m.user_id);
    const { error } = await supabase.from("workspace_expenses").insert({
      workspace_id: ws.id, title: form.title, amount: amt, category: form.category, paid_by: me, split_with: splitWith,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setForm({ title: "", amount: "", category: "Misc" }); void load();
  }
  async function remove(id: string) {
    if (!confirm("Delete expense?")) return;
    await supabase.from("workspace_expenses").delete().eq("id", id); void load();
  }

  const total = items.reduce((s, i) => s + Number(i.amount), 0);
  const myShare = items.reduce((s, i) => {
    const n = (i.split_with as string[]).length || 1;
    return s + (((i.split_with as string[]).includes(me) ? Number(i.amount) / n : 0));
  }, 0);
  const iPaid = items.filter((i) => i.paid_by === me).reduce((s, i) => s + Number(i.amount), 0);
  const balance = iPaid - myShare;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><div className="text-xs uppercase text-muted-foreground">Total</div><div className="mt-2 text-2xl font-semibold">${total.toFixed(2)}</div></Card>
        <Card><div className="text-xs uppercase text-muted-foreground">Your share</div><div className="mt-2 text-2xl font-semibold">${myShare.toFixed(2)}</div></Card>
        <Card><div className="text-xs uppercase text-muted-foreground">Balance</div><div className={`mt-2 text-2xl font-semibold ${balance >= 0 ? "text-emerald-500" : "text-destructive"}`}>{balance >= 0 ? "+" : ""}${balance.toFixed(2)}</div></Card>
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold tracking-tight">Expenses</h3>
          <button onClick={() => setOpen(true)} className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
            <Plus className="size-3.5" /> Add
          </button>
        </div>
        {items.length === 0 ? <p className="text-sm text-muted-foreground mt-4">No expenses yet.</p> : (
          <ul className="mt-4 divide-y divide-border/60">
            {items.map((i) => (
              <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.title}</div>
                  <div className="text-[11px] text-muted-foreground">{i.category} · paid by {i.paid_by === me ? "you" : i.paid_by.slice(0,6)} · split {((i.split_with as string[]).length)} ways</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">${Number(i.amount).toFixed(2)}</span>
                  {i.paid_by === me && <button onClick={() => remove(i.id)} className="p-2 rounded-lg hover:bg-muted text-destructive"><Trash2 className="size-4" /></button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && (
        <Modal onClose={() => setOpen(false)} title="Add expense">
          <form onSubmit={add} className="space-y-3">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What was it for?" className="w-full h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
            <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="w-full h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-11 px-4 rounded-xl bg-input/60 border border-border text-sm">
              {["Misc","Food","Travel","Office","Software","Marketing","Utilities"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <p className="text-[11px] text-muted-foreground">Split equally between all {members.length} member(s).</p>
            <button type="submit" className="w-full h-11 rounded-xl bg-primary-gradient text-primary-foreground font-medium">Add</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Whiteboard ---------- */
function WhiteboardTab({ ws, me }: TabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#3B82F6");

  function draw(x1: number, y1: number, x2: number, y2: number, col: string) {
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  async function loadStrokes() {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const { data } = await supabase.from("workspace_whiteboard_strokes").select("*").eq("workspace_id", ws.id).order("created_at");
    (data ?? []).forEach((s: any) => {
      const d = s.data as any; draw(d.x1, d.y1, d.x2, d.y2, d.c);
    });
  }
  useEffect(() => { void loadStrokes(); /* eslint-disable-next-line */ }, [ws.id]);
  useEffect(() => {
    const ch = supabase.channel(`wb:${ws.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "workspace_whiteboard_strokes", filter: `workspace_id=eq.${ws.id}` },
        (p) => { const d = (p.new as any).data; if ((p.new as any).user_id !== me) draw(d.x1, d.y1, d.x2, d.y2, d.c); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ws.id, me]);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function onDown(e: React.PointerEvent) { drawing.current = true; lastPt.current = pos(e); }
  function onMove(e: React.PointerEvent) {
    if (!drawing.current || !lastPt.current) return;
    const p = pos(e); const last = lastPt.current;
    draw(last.x, last.y, p.x, p.y, color);
    void supabase.from("workspace_whiteboard_strokes").insert({
      workspace_id: ws.id, user_id: me, data: { x1: last.x, y1: last.y, x2: p.x, y2: p.y, c: color },
    });
    lastPt.current = p;
  }
  function onUp() { drawing.current = false; lastPt.current = null; }
  async function clearAll() {
    if (!confirm("Clear the whiteboard for everyone?")) return;
    await supabase.from("workspace_whiteboard_strokes").delete().eq("workspace_id", ws.id);
    void loadStrokes();
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-3 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {["#3B82F6","#EF4444","#10B981","#F59E0B","#A855F7","#0F172A","#F8FAFC"].map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`size-6 rounded-full border-2 ${color === c ? "border-primary" : "border-transparent"}`} style={{ background: c }} />
          ))}
        </div>
        <button onClick={clearAll} className="h-8 px-3 rounded-lg text-xs font-medium hover:bg-muted inline-flex items-center gap-1.5"><Eraser className="size-3.5" /> Clear</button>
      </div>
      <canvas ref={canvasRef} width={900} height={500}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        className="block w-full bg-background cursor-crosshair touch-none" />
    </Card>
  );
}

/* ---------- Members ---------- */
function MembersTab({ members }: TabProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold tracking-tight">Members ({members.length})</h3>
        <button className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5" onClick={() => toast.info("Share the join link from the top-right.")}>
          <UserPlus className="size-3.5" /> Invite
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border/60">
        {members.map((m) => (
          <li key={m.id} className="py-3 flex items-center justify-between">
            <div className="text-sm font-mono">{m.user_id.slice(0, 8)}…</div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">{m.role}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Modal helper ---------- */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 shadow-elevated">
        <h3 className="text-xl font-semibold tracking-tight mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ---------- Tasks ---------- */
function TasksTab({ ws, me }: TabProps) {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  async function load() {
    const { data } = await supabase.from("workspace_tasks").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);
  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return;
    const { error } = await supabase.from("workspace_tasks").insert({ workspace_id: ws.id, title, due_at: due ? new Date(due).toISOString() : null, created_by: me });
    if (error) return toast.error(error.message);
    setTitle(""); setDue(""); void load();
  }
  async function toggle(t: any) {
    const next = t.status === "done" ? "todo" : "done";
    await supabase.from("workspace_tasks").update({ status: next }).eq("id", t.id); void load();
  }
  async function remove(id: string) { await supabase.from("workspace_tasks").delete().eq("id", id); void load(); }
  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={add} className="flex flex-wrap gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task…" className="flex-1 min-w-[200px] h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
          <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="h-11 px-3 rounded-xl bg-input/60 border border-border text-sm" />
          <button type="submit" className="h-11 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5"><Plus className="size-4" /> Add</button>
        </form>
      </Card>
      <Card>
        <h3 className="font-semibold tracking-tight">Tasks & deadlines</h3>
        {items.length === 0 ? <p className="text-sm text-muted-foreground mt-3">No tasks yet.</p> : (
          <ul className="mt-3 divide-y divide-border/60">
            {items.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                <button onClick={() => toggle(t)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  <div className={`size-5 rounded-md border-2 grid place-items-center shrink-0 ${t.status === "done" ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                    {t.status === "done" && <CheckSquare className="size-3" />}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-medium truncate ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    {t.due_at && <div className="text-[11px] text-muted-foreground">Due {fmtDate(t.due_at)} · {fmtTime(t.due_at)}</div>}
                  </div>
                </button>
                {t.created_by === me && <button onClick={() => remove(t.id)} className="p-2 rounded-lg hover:bg-muted text-destructive"><Trash2 className="size-4" /></button>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------- Notes ---------- */
function NotesTab({ ws, me }: TabProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  async function load() {
    const { data } = await supabase.from("workspace_notes").select("*").eq("workspace_id", ws.id).order("updated_at", { ascending: false });
    setNotes(data ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);
  async function create() {
    const { data, error } = await supabase.from("workspace_notes").insert({ workspace_id: ws.id, title: "Untitled", content: "", created_by: me }).select().single();
    if (error) return toast.error(error.message);
    setNotes((n) => [data, ...n]); setActive(data); setTitle(data.title); setContent(data.content);
  }
  async function save() {
    if (!active) return;
    await supabase.from("workspace_notes").update({ title, content }).eq("id", active.id);
    toast.success("Saved"); void load();
  }
  async function remove(id: string) {
    await supabase.from("workspace_notes").delete().eq("id", id); if (active?.id === id) setActive(null); void load();
  }
  return (
    <Card className="p-0 overflow-hidden flex h-[70vh]">
      <div className="w-56 shrink-0 border-r border-border/60 flex flex-col">
        <div className="p-3 border-b border-border/60 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Notes</span>
          <button onClick={create} className="text-primary"><Plus className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {notes.map((n) => (
            <button key={n.id} onClick={() => { setActive(n); setTitle(n.title); setContent(n.content); }}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-sm ${active?.id === n.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <div className="truncate font-medium">{n.title}</div>
              <div className={`text-[11px] truncate ${active?.id === n.id ? "opacity-80" : "text-muted-foreground"}`}>{n.content?.slice(0, 40) || "Empty"}</div>
            </button>
          ))}
          {notes.length === 0 && <p className="text-xs text-muted-foreground p-3">No notes</p>}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {active ? (
          <>
            <div className="p-3 border-b border-border/60 flex gap-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 h-10 px-3 rounded-xl bg-input/60 border border-border text-sm font-semibold" />
              <button onClick={save} className="h-10 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium">Save</button>
              {active.created_by === me && <button onClick={() => remove(active.id)} className="h-10 px-3 rounded-xl hover:bg-muted text-destructive"><Trash2 className="size-4" /></button>}
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start writing…"
              className="flex-1 p-4 bg-transparent text-sm outline-none resize-none" />
          </>
        ) : <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Pick a note or create one.</div>}
      </div>
    </Card>
  );
}

/* ---------- Birthdays ---------- */
function BirthdaysTab({ ws, me }: TabProps) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ person_name: "", month: 1, day: 1, note: "" });
  async function load() {
    const { data } = await supabase.from("workspace_birthdays").select("*").eq("workspace_id", ws.id);
    setItems(data ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("workspace_birthdays").insert({ workspace_id: ws.id, ...form, created_by: me });
    if (error) return toast.error(error.message);
    setForm({ person_name: "", month: 1, day: 1, note: "" }); void load();
  }
  async function remove(id: string) { await supabase.from("workspace_birthdays").delete().eq("id", id); void load(); }
  const today = new Date();
  const sorted = [...items].sort((a, b) => {
    const da = new Date(today.getFullYear(), a.month - 1, a.day);
    const db = new Date(today.getFullYear(), b.month - 1, b.day);
    if (da < today) da.setFullYear(today.getFullYear() + 1);
    if (db < today) db.setFullYear(today.getFullYear() + 1);
    return da.getTime() - db.getTime();
  });
  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_auto] gap-2">
          <input required value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} placeholder="Person's name" className="h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
          <select value={form.month} onChange={(e) => setForm({ ...form, month: +e.target.value })} className="h-11 px-2 rounded-xl bg-input/60 border border-border text-sm">
            {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <input type="number" min={1} max={31} value={form.day} onChange={(e) => setForm({ ...form, day: +e.target.value })} className="h-11 px-3 rounded-xl bg-input/60 border border-border text-sm" />
          <button type="submit" className="h-11 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium">Add</button>
        </form>
      </Card>
      <Card>
        <h3 className="font-semibold tracking-tight inline-flex items-center gap-2"><Cake className="size-4 text-primary" /> Upcoming birthdays</h3>
        {sorted.length === 0 ? <p className="text-sm text-muted-foreground mt-3">No birthdays added yet.</p> : (
          <ul className="mt-3 divide-y divide-border/60">
            {sorted.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{b.person_name}</div>
                  <div className="text-[11px] text-muted-foreground">{MONTHS[b.month-1]} {b.day}{b.note && ` · ${b.note}`}</div>
                </div>
                {b.created_by === me && <button onClick={() => remove(b.id)} className="p-2 rounded-lg hover:bg-muted text-destructive"><Trash2 className="size-4" /></button>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------- Playlists ---------- */
function PlaylistsTab({ ws, me }: TabProps) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", spotify_url: "" });
  const player = useGlobalPlayer();
  async function load() {
    const { data } = await supabase.from("workspace_playlists").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [ws.id]);
  function detect(url: string): { kind: "spotify" | "youtube"; embed: string } | null {
    const s = url.match(/spotify\.com\/(playlist|album|track|artist|episode|show)\/([a-zA-Z0-9]+)/);
    if (s) return { kind: "spotify", embed: `https://open.spotify.com/embed/${s[1]}/${s[2]}` };
    const pl = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (pl && /(youtube\.com|youtu\.be|music\.youtube\.com)/.test(url)) {
      return { kind: "youtube", embed: `https://www.youtube.com/embed/videoseries?list=${pl[1]}?autoplay=1` };
    }
    const v =
      url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
      url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (v && /(youtube\.com|youtu\.be|music\.youtube\.com)/.test(url)) {
      return { kind: "youtube", embed: `https://www.youtube.com/embed/${v[1]}?autoplay=1` };
    }
    return null;
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!detect(form.spotify_url)) return toast.error("Paste a Spotify, YouTube or YouTube Music URL");
    const { error } = await supabase.from("workspace_playlists").insert({ workspace_id: ws.id, ...form, added_by: me });
    if (error) return toast.error(error.message);
    setForm({ title: "", spotify_url: "" }); void load();
  }
  async function remove(id: string) { await supabase.from("workspace_playlists").delete().eq("id", id); void load(); }
  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={add} className="flex flex-wrap gap-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="h-11 px-4 rounded-xl bg-input/60 border border-border text-sm w-40" />
          <input value={form.spotify_url} onChange={(e) => setForm({ ...form, spotify_url: e.target.value })} placeholder="Spotify, YouTube or YouTube Music URL" className="flex-1 min-w-[220px] h-11 px-4 rounded-xl bg-input/60 border border-border text-sm" />
          <button type="submit" className="h-11 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5"><Music className="size-4" /> Add</button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Press Play to start a track — it keeps playing as you switch sections. Hide the video to listen audio-only.
        </p>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => {
          const d = detect(p.spotify_url);
          const isActive = player.track?.id === p.id;
          return (
            <Card key={p.id} className="p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="font-medium text-sm truncate flex items-center gap-2 min-w-0">
                  {d && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{d.kind === "youtube" ? "YouTube" : "Spotify"}</span>}
                  <span className="truncate">{p.title || "Playlist"}</span>
                  {isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">Playing</span>}
                </div>
                {p.added_by === me && <button onClick={() => remove(p.id)} className="p-1 rounded hover:bg-muted text-destructive"><Trash2 className="size-3.5" /></button>}
              </div>
              {d ? (
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <button onClick={() => player.stop()} className="h-9 px-3 rounded-xl bg-muted text-foreground text-xs font-medium inline-flex items-center gap-1.5">
                      <X className="size-3.5" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => player.play({ id: p.id, title: p.title || "Playlist", kind: d.kind, embed: d.embed })}
                      className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 shadow-glow"
                    >
                      <Music className="size-3.5" /> Play
                    </button>
                  )}
                  <a href={p.spotify_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground underline">
                    Open original
                  </a>
                </div>
              ) : <a href={p.spotify_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Open link</a>}
            </Card>
          );
        })}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No playlists yet. Paste a Spotify or YouTube link above.</p>}
      </div>
    </div>
  );
}

/* ---------- Analytics ---------- */
function AnalyticsTab({ ws, members }: TabProps) {
  const [s, setS] = useState({ messages: 0, files: 0, events: 0, tasks: 0, tasksDone: 0, polls: 0, notes: 0, expenses: 0, totalSpend: 0 });
  useEffect(() => {
    void (async () => {
      const [m, f, e, t, tD, p, n, ex] = await Promise.all([
        supabase.from("workspace_channel_messages").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_files").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_events").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_tasks").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_tasks").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id).eq("status", "done"),
        supabase.from("workspace_polls").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_notes").select("*", { count: "exact", head: true }).eq("workspace_id", ws.id),
        supabase.from("workspace_expenses").select("amount").eq("workspace_id", ws.id),
      ]);
      const totalSpend = (ex.data ?? []).reduce((acc: number, r: any) => acc + Number(r.amount), 0);
      setS({ messages: m.count ?? 0, files: f.count ?? 0, events: e.count ?? 0, tasks: t.count ?? 0, tasksDone: tD.count ?? 0, polls: p.count ?? 0, notes: n.count ?? 0, expenses: ex.data?.length ?? 0, totalSpend });
    })();
  }, [ws.id]);
  const stats = [
    { label: "Members", value: members.length },
    { label: "Messages", value: s.messages },
    { label: "Files", value: s.files },
    { label: "Events", value: s.events },
    { label: "Tasks", value: `${s.tasksDone}/${s.tasks}` },
    { label: "Notes", value: s.notes },
    { label: "Polls", value: s.polls },
    { label: "Total spend", value: `$${s.totalSpend.toFixed(2)}` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((st) => (
        <Card key={st.label}>
          <div className="text-xs uppercase text-muted-foreground">{st.label}</div>
          <div className="mt-2 text-2xl font-semibold">{st.value}</div>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Legacy stubs (unused but kept for safety) ---------- */
function AssignmentsTab() { return <ComingSoon title="Assignments" desc="Use Tasks." />; }
function AnnouncementsTab() { return <ComingSoon title="Announcements" desc="Use a #announcements channel." />; }
function ExamTab() { return <ComingSoon title="Exam Mode" desc="" />; }
function ProgressTab() { return <ComingSoon title="Progress" desc="" />; }
function ProjectsTab() { return <ComingSoon title="Projects" desc="Use Tasks." />; }
function KnowledgeTab() { return <ComingSoon title="Knowledge" desc="Upload to Files; AI uses them." />; }
