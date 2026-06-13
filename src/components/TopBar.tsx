import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Bell, X, Users, Hash, MessageCircle, UserCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

type SearchHit =
  | { kind: "user"; id: string; title: string; sub: string }
  | { kind: "group"; id: string; title: string; sub: string }
  | { kind: "lobby"; id: string; slug: string; title: string; sub: string }
  | { kind: "dm"; id: string; title: string; sub: string };

type Notif = {
  id: string;
  kind: "message" | "friend_request" | "group_invite";
  title: string;
  body: string;
  href: string;
  created_at: string;
  read: boolean;
};

export function TopBar() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Search across users, groups, lobbies
  useEffect(() => {
    if (!q.trim() || !user) { setHits([]); return; }
    const t = setTimeout(async () => {
      const term = q.trim();
      const [{ data: users }, { data: lobbies }, { data: parts }] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name").or(`username.ilike.%${term}%,display_name.ilike.%${term}%`).neq("id", user.id).limit(6),
        supabase.from("lobbies").select("id, slug, name, description").or(`name.ilike.%${term}%,description.ilike.%${term}%`).limit(4),
        supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id),
      ]);
      const ids = (parts ?? []).map((p: any) => p.conversation_id);
      let groups: any[] = [];
      if (ids.length) {
        const { data } = await supabase.from("conversations").select("id, name, kind").in("id", ids).ilike("name", `%${term}%`).limit(6);
        groups = data ?? [];
      }
      const results: SearchHit[] = [
        ...((users ?? []) as any[]).map((u) => ({ kind: "user" as const, id: u.id, title: u.display_name, sub: `@${u.username}` })),
        ...((lobbies ?? []) as any[]).map((l) => ({ kind: "lobby" as const, id: l.id, slug: l.slug, title: `#${l.name}`, sub: l.description ?? "Public lobby" })),
        ...groups.map((g) => ({ kind: g.kind === "group" ? "group" : "dm", id: g.id, title: g.name ?? "Untitled", sub: g.kind === "group" ? "Group" : "Direct message" })) as SearchHit[],
      ];
      setHits(results);
    }, 220);
    return () => clearTimeout(t);
  }, [q, user]);

  // Live notifications from realtime
  useEffect(() => {
    if (!user) return;

    const pushNotif = async (n: Omit<Notif, "id" | "read" | "created_at"> & { id?: string }) => {
      setNotifs((cur) => [{
        id: n.id ?? `${Date.now()}-${Math.random()}`,
        kind: n.kind, title: n.title, body: n.body, href: n.href,
        created_at: new Date().toISOString(), read: false,
      }, ...cur].slice(0, 30));
    };

    // DM messages where current user is participant but not sender
    const ch = supabase
      .channel("notif-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const m = payload.new as any;
        if (m.sender_id === user.id) return;
        // verify participant
        const { data: p } = await supabase.from("conversation_participants").select("conversation_id").eq("conversation_id", m.conversation_id).eq("user_id", user.id).maybeSingle();
        if (!p) return;
        const { data: sender } = await supabase.from("profiles").select("display_name").eq("id", m.sender_id).maybeSingle();
        pushNotif({
          kind: "message",
          title: (sender as any)?.display_name ?? "New message",
          body: m.kind === "text" ? (m.content ?? "") : m.kind === "voice" ? "🎙 Voice message" : m.kind === "image" ? "🖼 Image" : "📎 File",
          href: "/messages",
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` }, async (payload) => {
        const f = payload.new as any;
        const { data: s } = await supabase.from("profiles").select("display_name, username").eq("id", f.requester_id).maybeSingle();
        pushNotif({ kind: "friend_request", title: "Friend request", body: `${(s as any)?.display_name ?? "Someone"} wants to connect`, href: "/friends" });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const goHit = (h: SearchHit) => {
    setOpen(false); setQ("");
    if (h.kind === "user") navigate({ to: "/users" });
    else if (h.kind === "lobby" || h.kind === "group") navigate({ to: "/groups" });
    else navigate({ to: "/messages" });
  };

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
      <div ref={ref} className="relative">
        <div className="flex items-center gap-2 h-11 w-[280px] px-3 rounded-2xl glass-strong border border-border/60 shadow-soft">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search people, groups, lobbies…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          {q && <button onClick={() => { setQ(""); setHits([]); }} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
        </div>
        <AnimatePresence>
          {open && (q.trim().length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute top-12 left-0 right-0 max-h-[60vh] overflow-auto rounded-2xl glass-strong border border-border/60 shadow-elevated p-1.5"
            >
              {hits.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">No matches.</p>}
              {hits.map((h, i) => (
                <button key={`${h.kind}-${h.id}-${i}`} onClick={() => goHit(h)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-soft text-left">
                  <div className="size-8 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
                    {h.kind === "user" && <UserCircle2 className="size-4" />}
                    {h.kind === "lobby" && <Hash className="size-4" />}
                    {h.kind === "group" && <Users className="size-4" />}
                    {h.kind === "dm" && <MessageCircle className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{h.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{h.sub}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={bellRef} className="relative">
        <button
          onClick={() => setNotifOpen((s) => !s)}
          className="relative size-11 rounded-2xl glass-strong border border-border/60 shadow-soft grid place-items-center hover:bg-muted/40 transition-soft"
        >
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </button>
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute right-0 top-12 w-[340px] max-h-[70vh] overflow-auto rounded-2xl glass-strong border border-border/60 shadow-elevated p-2"
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {notifs.length > 0 && (
                  <button onClick={() => setNotifs((cur) => cur.map((n) => ({ ...n, read: true })))} className="text-xs text-muted-foreground hover:text-foreground">Mark all read</button>
                )}
              </div>
              {notifs.length === 0 ? (
                <p className="px-3 py-8 text-sm text-muted-foreground text-center">No notifications yet.</p>
              ) : (
                <ul className="space-y-1">
                  {notifs.map((n) => (
                    <li key={n.id}>
                      <Link
                        to={n.href as any}
                        onClick={() => { setNotifs((cur) => cur.map((x) => x.id === n.id ? { ...x, read: true } : x)); setNotifOpen(false); }}
                        className={`flex gap-3 p-2.5 rounded-xl transition-soft ${n.read ? "hover:bg-muted/40" : "bg-primary/10 hover:bg-primary/15"}`}
                      >
                        <div className="size-9 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
                          {n.kind === "message" && <MessageCircle className="size-4" />}
                          {n.kind === "friend_request" && <UserCircle2 className="size-4" />}
                          {n.kind === "group_invite" && <Users className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{n.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
