import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Loader2, Users, GraduationCap, BookOpen, Building2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
type WSType = Database["public"]["Enums"]["workspace_type"];
type WSPrivacy = Database["public"]["Enums"]["workspace_privacy"];

export const Route = createFileRoute("/_authenticated/workspaces/")({
  head: () => ({ meta: [{ title: "Your Workspaces · Axion" }] }),
  component: WorkspacesIndex,
});

const TYPE_META: Record<WSType, { emoji: string; label: string }> = {
  teacher: { emoji: "🎓", label: "Teacher" },
  student: { emoji: "📚", label: "Student" },
  parent: { emoji: "👨‍👩‍👧", label: "Parent" },
  friends: { emoji: "👥", label: "Friends" },
  business: { emoji: "🏢", label: "Office" },
  custom: { emoji: "✨", label: "Custom" },
};

// Only these types are available when creating a new workspace
const ALLOWED_TYPES: WSType[] = ["business", "friends"];

function WorkspacesIndex() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinSlug, setJoinSlug] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "business" as WSType,
    emoji: "🏢",
    privacy: "private" as WSPrivacy,
    description: "",
  });

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate({ to: "/auth" }); return; }
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);
    const ids = (memberships ?? []).map((m) => m.workspace_id);
    if (ids.length === 0) { setItems([]); setLoading(false); return; }
    const { data: ws, error } = await supabase
      .from("workspaces").select("*").in("id", ids)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(ws ?? []);
    setLoading(false);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const slug = (form.slug || form.name).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
      if (slug.length < 4) { toast.error("Slug must be at least 4 characters"); return; }
      const { data, error } = await supabase.from("workspaces").insert({
        owner_id: user.id,
        name: form.name,
        slug,
        type: form.type,
        emoji: TYPE_META[form.type].emoji === "✨" ? form.emoji : TYPE_META[form.type].emoji,
        privacy: form.privacy,
        description: form.description || null,
      }).select().single();
      if (error) { toast.error(error.message); return; }
      toast.success("Workspace created");
      navigate({ to: "/workspaces/$slug", params: { slug: data.slug } });
    } finally { setCreating(false); }
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    const slug = joinSlug.trim().toLowerCase();
    if (!slug) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ws, error } = await supabase.from("workspaces").select("id,slug,privacy").eq("slug", slug).maybeSingle();
    if (error || !ws) { toast.error("Workspace not found or not visible"); return; }
    if (ws.privacy !== "public") { toast.error("This workspace requires an invite"); return; }
    const { error: e2 } = await supabase.from("workspace_members").insert({ workspace_id: ws.id, user_id: user.id, role: "member" });
    if (e2 && !e2.message.includes("duplicate")) { toast.error(e2.message); return; }
    toast.success("Joined!");
    navigate({ to: "/workspaces/$slug", params: { slug: ws.slug } });
  }

  return (
    <div className="min-h-screen ambient-grain">
      <header className="px-6 md:px-10 pt-6 pb-2 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div>
          <Link to="/home" className="text-xs text-muted-foreground hover:text-foreground transition-soft">← Back to Axion</Link>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Your Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">One platform. Unlimited workspaces.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJoin(true)} className="h-10 px-4 rounded-2xl glass border border-border/60 text-sm font-medium hover:bg-card transition-soft">Join</button>
          <button onClick={() => setShowCreate(true)} className="h-10 px-4 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-soft inline-flex items-center gap-1.5">
            <Plus className="size-4" /> New
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((w) => (
              <Link key={w.id} to="/workspaces/$slug" params={{ slug: w.slug }}
                className="group bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft hover:shadow-elevated transition-soft">
                <div className="flex items-center justify-between">
                  <div className="size-12 rounded-2xl bg-primary/10 grid place-items-center text-2xl">{w.emoji || "✨"}</div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{TYPE_META[w.type].label}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{w.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">@{w.slug}</p>
                {w.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{w.description}</p>}
                <div className="mt-4 text-xs text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-soft">
                  Open <ArrowRight className="size-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create a Workspace">
          <form onSubmit={onCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {ALLOWED_TYPES.map((t) => (
                <button type="button" key={t} onClick={() => setForm((f) => ({ ...f, type: t, emoji: TYPE_META[t].emoji }))}
                  className={`p-4 rounded-2xl border text-center transition-soft ${form.type === t ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"}`}>
                  <div className="text-2xl">{TYPE_META[t].emoji}</div>
                  <div className="mt-1 text-xs font-medium">{TYPE_META[t].label}</div>
                </button>
              ))}
            </div>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              placeholder="Workspace name" className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border text-sm" />
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              placeholder="join-code (e.g. my-team)" className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border text-sm font-mono" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description (optional)" className="w-full px-4 py-3 rounded-2xl bg-input/60 border border-border text-sm resize-none" rows={2} />
            <select value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value as WSPrivacy })}
              className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border text-sm">
              <option value="private">🔒 Private — invite only</option>
              <option value="invite">✉️ Invite link only</option>
              <option value="organization">🏢 Organization only</option>
              <option value="public">🌐 Public — anyone can join</option>
            </select>
            <button type="submit" disabled={creating} className="w-full h-11 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {creating && <Loader2 className="size-4 animate-spin" />} Create workspace
            </button>
          </form>
        </Modal>
      )}

      {showJoin && (
        <Modal onClose={() => setShowJoin(false)} title="Join a Workspace">
          <form onSubmit={onJoin} className="space-y-3">
            <p className="text-sm text-muted-foreground">Enter the join code (public workspaces only).</p>
            <input value={joinSlug} onChange={(e) => setJoinSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="join-code" className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border text-sm font-mono" />
            <button type="submit" className="w-full h-11 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90">Join</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const types = [
    { t: "friends" as const, Icon: Users, label: "Friends", desc: "Plans, polls, notes, whiteboard, expenses, AI" },
    { t: "business" as const, Icon: Building2, label: "Office", desc: "Tasks, projects, knowledge, meetings, analytics" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
      <div className="size-16 mx-auto rounded-3xl bg-primary/10 grid place-items-center text-3xl"><Sparkles className="size-6 text-primary" /></div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">No workspaces yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">Create your first one — it takes 10 seconds.</p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        {types.map(({ t, Icon, label, desc }) => (
          <button key={t} onClick={onCreate} className="text-left p-5 rounded-3xl border border-border/60 bg-card-gradient hover:shadow-elevated transition-soft">
            <Icon className="size-5 text-primary" />
            <div className="mt-3 font-semibold tracking-tight">{label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
          </button>
        ))}
      </div>
      <button onClick={onCreate} className="mt-8 inline-flex h-11 px-5 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90">
        <Plus className="size-4" /> Create workspace
      </button>
    </motion.div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 shadow-elevated">
        <h3 className="text-xl font-semibold tracking-tight mb-4">{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}
