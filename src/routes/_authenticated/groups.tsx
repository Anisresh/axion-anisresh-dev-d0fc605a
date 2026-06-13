import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { Send, Smile, Image as ImageIcon, Hash, Plus, Mic, Square, Play, Pause, Settings2, UserPlus, UserMinus, Pencil, Upload, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({ meta: [{ title: "Groups & Lobbies · Axion6" }] }),
  component: GroupsPage,
});

type Lobby = { id: string; slug: string; name: string; description: string | null };
type Conv = { id: string; kind: "dm" | "group"; name: string | null; owner_id: string | null; icon_url: string | null };
type GenericMsg = { id: string; sender_id: string; content: string | null; media_url: string | null; kind: string; created_at: string };
type Profile = { id: string; username: string; display_name: string };

function GroupsPage() {
  const { user } = useAuth();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [groups, setGroups] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<{ kind: "lobby" | "group"; id: string } | null>(null);
  const [messages, setMessages] = useState<GenericMsg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const [recording, setRecording] = useState(false);
  const [recElapsed, setRecElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recStartRef = useRef<number>(0);

  const startRec = async () => {
    if (!selected || !user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "" });
      recChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunksRef.current, { type: rec.mimeType || "audio/webm" });
        const duration = Date.now() - recStartRef.current;
        const tempId = `temp-${Date.now()}`;
        const localUrl = URL.createObjectURL(blob);
        const optimistic: GenericMsg = { id: tempId, sender_id: user.id, content: null, media_url: localUrl, kind: "voice", created_at: new Date().toISOString() };
        setMessages((ms) => [...ms, optimistic]);
        const path = `${user.id}/voice-${Date.now()}.webm`;
        const { error } = await supabase.storage.from("chat-media").upload(path, blob, { contentType: blob.type });
        if (error) { setMessages((ms) => ms.filter((x) => x.id !== tempId)); toast.error(error.message); return; }
        const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24 * 60);
        const payload: any = selected.kind === "lobby"
          ? { lobby_id: selected.id, sender_id: user.id, kind: "voice", media_url: signed?.signedUrl ?? path }
          : { conversation_id: selected.id, sender_id: user.id, kind: "voice", media_url: signed?.signedUrl ?? path, duration_ms: duration };
        const table = selected.kind === "lobby" ? "lobby_messages" : "messages";
        const { data, error: insErr } = await (supabase.from(table) as any).insert(payload).select().single();
        if (insErr) { setMessages((ms) => ms.filter((x) => x.id !== tempId)); toast.error(insErr.message); return; }
        setMessages((ms) => {
          const without = ms.filter((x) => x.id !== tempId);
          return without.some((x) => x.id === data.id) ? without : [...without, data as GenericMsg];
        });
      };
      recStartRef.current = Date.now();
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setRecElapsed(0);
      recTimerRef.current = setInterval(() => setRecElapsed(Date.now() - recStartRef.current), 200);
    } catch {
      toast.error("Mic permission denied");
    }
  };
  const stopRec = () => {
    recRef.current?.stop();
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecording(false);
  };

  useEffect(() => {
    supabase.from("lobbies").select("*").order("name").then(({ data }) => setLobbies((data as Lobby[]) ?? []));
  }, []);
  const loadGroups = async () => {
    if (!user) return;
    const { data: parts } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    const ids = (parts ?? []).map((p: any) => p.conversation_id);
    if (!ids.length) { setGroups([]); return; }
    const { data: cs } = await supabase.from("conversations").select("*").in("id", ids).eq("kind", "group");
    setGroups((cs as Conv[]) ?? []);
  };
  useEffect(() => { loadGroups(); }, [user]);

  useEffect(() => {
    if (!selected) return;
    const table = selected.kind === "lobby" ? "lobby_messages" : "messages";
    const col = selected.kind === "lobby" ? "lobby_id" : "conversation_id";
    (supabase.from(table) as any).select("*").eq(col, selected.id).order("created_at").limit(200).then(async ({ data }: any) => {
      const msgs = (data as GenericMsg[]) ?? [];
      setMessages(msgs);
      const sids = Array.from(new Set(msgs.map((m) => m.sender_id)));
      if (sids.length) {
        const { data: p } = await supabase.from("profiles").select("id, username, display_name").in("id", sids);
        const m: Record<string, Profile> = {};
        (p as Profile[] | null)?.forEach((x) => { m[x.id] = x; });
        setProfiles((cur) => ({ ...cur, ...m }));
      }
    });
    const ch = supabase.channel(`${selected.kind}-${selected.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table, filter: `${col}=eq.${selected.id}` }, async (payload) => {
      const m = payload.new as GenericMsg;
      setMessages((ms) => ms.some((x) => x.id === m.id) ? ms : [...ms.filter((x) => !x.id.startsWith("temp-") || x.content !== m.content || x.sender_id !== m.sender_id), m]);
      if (!profiles[m.sender_id]) {
        const { data: p } = await supabase.from("profiles").select("id, username, display_name").eq("id", m.sender_id).maybeSingle();
        if (p) setProfiles((cur) => ({ ...cur, [m.sender_id]: p as Profile }));
      }
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !selected || !user) return;
    const content = text;
    setText("");
    const tempId = `temp-${Date.now()}`;
    const optimistic: GenericMsg = { id: tempId, sender_id: user.id, content, media_url: null, kind: "text", created_at: new Date().toISOString() };
    setMessages((ms) => [...ms, optimistic]);
    const table = selected.kind === "lobby" ? "lobby_messages" : "messages";
    const payload: any = selected.kind === "lobby"
      ? { lobby_id: selected.id, sender_id: user.id, content, kind: "text" }
      : { conversation_id: selected.id, sender_id: user.id, content, kind: "text" };
    const { data, error } = await (supabase.from(table) as any).insert(payload).select().single();
    if (error) {
      setMessages((ms) => ms.filter((x) => x.id !== tempId));
      toast.error(error.message);
      return;
    }
    setMessages((ms) => {
      const without = ms.filter((x) => x.id !== tempId);
      return without.some((x) => x.id === data.id) ? without : [...without, data as GenericMsg];
    });
  };

  const onUpload = async (file: File) => {
    if (!user || !selected) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24 * 30);
    if (selected.kind === "lobby") {
      await supabase.from("lobby_messages").insert({ lobby_id: selected.id, sender_id: user.id, kind: "image", media_url: signed?.signedUrl });
    } else {
      await supabase.from("messages").insert({ conversation_id: selected.id, sender_id: user.id, kind: "image", media_url: signed?.signedUrl });
    }
  };

  const createGroup = async () => {
    if (!user || !newName.trim()) return;
    const { data, error } = await supabase.from("conversations").insert({ kind: "group", name: newName, owner_id: user.id }).select().single();
    if (error || !data) { toast.error(error?.message ?? "Failed"); return; }
    await supabase.from("conversation_participants").insert({ conversation_id: data.id, user_id: user.id });
    setNewName(""); setCreating(false);
    await loadGroups();
    setSelected({ kind: "group", id: data.id });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-4 p-4">
      <aside className="w-72 shrink-0 bg-card-gradient border border-border/60 rounded-3xl shadow-soft p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Public lobbies</h2>
        <ul className="space-y-1">
          {lobbies.map((l) => (
            <li key={l.id}>
              <button onClick={() => setSelected({ kind: "lobby", id: l.id })} className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-2xl transition-soft ${selected?.id === l.id ? "bg-primary text-primary-foreground shadow-glow" : "hover:bg-muted/60 text-foreground"}`}>
                <Hash className="size-4 opacity-70" />
                <span className="text-sm font-medium">{l.name}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your groups</h2>
          <button onClick={() => setCreating((s) => !s)} className="size-7 rounded-xl bg-muted hover:bg-muted/80 grid place-items-center transition-soft"><Plus className="size-4" /></button>
        </div>
        {creating && (
          <div className="mb-3 flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name" className="flex-1 h-9 px-3 rounded-xl bg-input/60 border border-border text-sm focus:outline-none" />
            <button onClick={createGroup} className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium">Create</button>
          </div>
        )}
        <ul className="space-y-1">
          {groups.map((g) => (
            <li key={g.id}>
              <button onClick={() => setSelected({ kind: "group", id: g.id })} className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-2xl transition-soft ${selected?.id === g.id ? "bg-primary text-primary-foreground shadow-glow" : "hover:bg-muted/60 text-foreground"}`}>
                <div className={`size-7 rounded-xl grid place-items-center text-xs font-semibold ${selected?.id === g.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/15 text-primary"}`}>{g.name?.[0]?.toUpperCase() ?? "G"}</div>
                <span className="text-sm font-medium truncate">{g.name}</span>
              </button>
            </li>
          ))}
          {groups.length === 0 && !creating && <p className="text-xs text-muted-foreground px-2">No groups yet.</p>}
        </ul>
      </aside>

      <section className="flex-1 bg-card-gradient border border-border/60 rounded-3xl shadow-soft flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 grid place-items-center p-8 text-center">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Pick a lobby or group</h3>
              <p className="mt-2 text-sm text-muted-foreground">Lobbies are public. Messages quietly fade after 72 hours.</p>
            </div>
          </div>
        ) : (
          <>
            <ChannelHeader
              selected={selected}
              lobbies={lobbies}
              groups={groups}
              user={user}
              onUpdated={async () => { await loadGroups(); }}
            />
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <AnimatePresence initial={false}>
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                const p = profiles[m.sender_id];
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-md">
                      {!mine && <div className="text-xs text-muted-foreground mb-1 px-1">{p?.display_name ?? "…"}</div>}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-soft ${mine ? "bg-primary-gradient text-primary-foreground" : "bg-muted"}`}>
                        {m.kind === "image" && m.media_url && <img src={m.media_url} className="rounded-xl mb-2 max-w-xs" alt="" />}
                        {m.kind === "voice" && m.media_url && <VoicePlayer url={m.media_url} mine={mine} />}
                        {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-border/60 p-4 relative">
              {showEmoji && (
                <div className="absolute bottom-20 left-4 z-10 shadow-elevated rounded-2xl overflow-hidden">
                  <EmojiPicker theme={Theme.AUTO} onEmojiClick={(e) => { setText((t) => t + e.emoji); setShowEmoji(false); }} />
                </div>
              )}
              {recording ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-11 px-4 rounded-2xl bg-destructive/10 text-destructive flex items-center gap-2 text-sm">
                    <span className="size-2 rounded-full bg-destructive animate-pulse-dot" />
                    Recording… {(recElapsed / 1000).toFixed(1)}s
                  </div>
                  <button onClick={stopRec} className="size-11 rounded-2xl bg-destructive text-destructive-foreground grid place-items-center tap"><Square className="size-4" /></button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <button onClick={() => setShowEmoji((s) => !s)} className="size-11 rounded-2xl bg-muted hover:bg-muted/80 grid place-items-center transition-soft"><Smile className="size-5" /></button>
                  <label className="size-11 rounded-2xl bg-muted hover:bg-muted/80 grid place-items-center transition-soft cursor-pointer">
                    <ImageIcon className="size-5" />
                    <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                  </label>
                  <button onClick={startRec} className="size-11 rounded-2xl bg-muted hover:bg-muted/80 grid place-items-center transition-soft tap" aria-label="Record voice"><Mic className="size-5" /></button>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Message…" rows={1} className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm max-h-32" />
                  <button onClick={send} className="size-11 rounded-2xl bg-primary-gradient text-primary-foreground grid place-items-center shadow-glow hover:opacity-90 transition-soft"><Send className="size-5" /></button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ChannelHeader({ selected, lobbies, groups, user, onUpdated }: {
  selected: { kind: "lobby" | "group"; id: string };
  lobbies: Lobby[]; groups: Conv[]; user: any; onUpdated: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const lobby = selected.kind === "lobby" ? lobbies.find((l) => l.id === selected.id) : null;
  const group = selected.kind === "group" ? groups.find((g) => g.id === selected.id) : null;
  const isOwner = group?.owner_id === user?.id;
  const title = lobby?.name ?? group?.name ?? "";
  const sub = lobby?.description ?? (group ? "Private group" : "");
  return (
    <div className="border-b border-border/60 px-5 py-3 flex items-center gap-3">
      <div className="size-9 rounded-2xl bg-primary/15 text-primary grid place-items-center overflow-hidden">
        {group?.icon_url ? <img src={group.icon_url} className="size-full object-cover" alt="" /> : (lobby ? <Hash className="size-4" /> : <span className="text-xs font-semibold">{title[0]?.toUpperCase()}</span>)}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold truncate">{lobby ? `#${title}` : title}</h3>
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      </div>
      {group && (
        <button onClick={() => setOpen(true)} className="h-9 px-3 rounded-xl bg-muted hover:bg-muted/80 inline-flex items-center gap-1.5 text-xs font-medium transition-soft">
          <Settings2 className="size-4" /> Manage
        </button>
      )}
      <AnimatePresence>
        {open && group && <GroupManageDialog group={group} isOwner={isOwner} onClose={() => setOpen(false)} onUpdated={onUpdated} />}
      </AnimatePresence>
    </div>
  );
}

function GroupManageDialog({ group, isOwner, onClose, onUpdated }: { group: Conv; isOwner: boolean; onClose: () => void; onUpdated: () => Promise<void> }) {
  const [name, setName] = useState(group.name ?? "");
  const [members, setMembers] = useState<Profile[]>([]);
  const [addQ, setAddQ] = useState("");
  const [addResults, setAddResults] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);

  const loadMembers = async () => {
    const { data: parts } = await supabase.from("conversation_participants").select("user_id").eq("conversation_id", group.id);
    const ids = (parts ?? []).map((p: any) => p.user_id);
    if (!ids.length) { setMembers([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
    setMembers((profs as Profile[]) ?? []);
  };
  useEffect(() => { loadMembers(); }, [group.id]);

  useEffect(() => {
    if (!addQ.trim()) { setAddResults([]); return; }
    const t = setTimeout(async () => {
      const memberIds = members.map((m) => m.id);
      const { data } = await supabase.from("profiles").select("id, username, display_name").ilike("username", `%${addQ.trim()}%`).limit(8);
      setAddResults(((data as Profile[]) ?? []).filter((p) => !memberIds.includes(p.id)));
    }, 200);
    return () => clearTimeout(t);
  }, [addQ, members]);

  const rename = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("conversations").update({ name }).eq("id", group.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Renamed"); await onUpdated(); }
  };
  const uploadIcon = async (file: File) => {
    const path = `${group.id}/icon-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from("conversations").update({ icon_url: signed?.signedUrl }).eq("id", group.id);
    toast.success("Group icon updated");
    await onUpdated();
  };
  const addMember = async (p: Profile) => {
    const { error } = await supabase.from("conversation_participants").insert({ conversation_id: group.id, user_id: p.id });
    if (error) toast.error(error.message); else { setAddQ(""); await loadMembers(); }
  };
  const removeMember = async (uid: string) => {
    const { error } = await supabase.from("conversation_participants").delete().eq("conversation_id", group.id).eq("user_id", uid);
    if (error) toast.error(error.message); else await loadMembers();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-card border border-border/60 rounded-3xl shadow-elevated p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Manage group</h2>
          <button onClick={onClose} className="size-8 rounded-xl hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        {isOwner && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
            <div className="mt-2 flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 h-10 px-3 rounded-xl bg-input/60 border border-border text-sm" />
              <button onClick={rename} disabled={busy} className="h-10 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-60"><Pencil className="size-3.5" /> Save</button>
            </div>
            <label className="mt-4 inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-muted hover:bg-muted/80 cursor-pointer text-xs font-medium">
              <Upload className="size-3.5" /> Upload group icon
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadIcon(e.target.files[0])} />
            </label>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members ({members.length})</label>
          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40">
                <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">{m.display_name[0]?.toUpperCase()}</div>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{m.display_name}</div><div className="text-[11px] text-muted-foreground truncate">@{m.username}</div></div>
                {isOwner && m.id !== group.owner_id && (
                  <button onClick={() => removeMember(m.id)} className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive grid place-items-center"><UserMinus className="size-4" /></button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isOwner && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add member</label>
            <input value={addQ} onChange={(e) => setAddQ(e.target.value)} placeholder="Search by username…" className="mt-2 w-full h-10 px-3 rounded-xl bg-input/60 border border-border text-sm" />
            {addResults.length > 0 && (
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {addResults.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40">
                    <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">{p.display_name[0]?.toUpperCase()}</div>
                    <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{p.display_name}</div><div className="text-[11px] text-muted-foreground truncate">@{p.username}</div></div>
                    <button onClick={() => addMember(p)} className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 inline-flex items-center gap-1"><UserPlus className="size-3.5" /> Add</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function VoicePlayer({ url, mine }: { url: string; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };
  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button onClick={toggle} className={`size-8 rounded-full grid place-items-center ${mine ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/15 text-primary"}`}>
        {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
      </button>
      <div className={`flex-1 h-1 rounded-full ${mine ? "bg-primary-foreground/30" : "bg-foreground/20"}`}>
        <div className={`h-1 rounded-full ${mine ? "bg-primary-foreground" : "bg-primary"}`} style={{ width: playing ? "100%" : "0%", transition: "width 0.2s linear" }} />
      </div>
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} preload="metadata" />
    </div>
  );
}
