import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { UserPlus, Check, X, UserMinus, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({ meta: [{ title: "Friends · Axion6" }] }),
  component: FriendsPage,
});

type Profile = { id: string; username: string; display_name: string; avatar_url: string | null };
type Friendship = { id: string; requester_id: string; addressee_id: string; status: "pending" | "accepted" | "blocked" };

function FriendsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});

  const load = async () => {
    if (!user) return;
    const { data: fs } = await supabase.from("friendships").select("*").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    setFriendships((fs as Friendship[]) ?? []);
    const ids = new Set<string>();
    (fs as Friendship[] | null)?.forEach((f) => { ids.add(f.requester_id); ids.add(f.addressee_id); });
    if (ids.size) {
      const { data: profs } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", Array.from(ids));
      const map: Record<string, Profile> = {};
      (profs as Profile[] | null)?.forEach((p) => { map[p.id] = p; });
      setProfilesMap(map);
    }
  };

  useEffect(() => { load(); }, [user]);

  const search = async () => {
    if (!query.trim() || !user) return setResults([]);
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").ilike("username", `%${query}%`).neq("id", user.id).limit(10);
    setResults((data as Profile[]) ?? []);
  };

  const sendRequest = async (addressee_id: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id });
    if (error) toast.error(error.message); else { toast.success("Request sent"); load(); }
  };
  const respond = async (id: string, status: "accepted" | "blocked") => {
    const { error } = await supabase.from("friendships").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user?.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user?.id);
  const blocked = friendships.filter((f) => f.status === "blocked");

  const other = (f: Friendship) => f.requester_id === user?.id ? profilesMap[f.addressee_id] : profilesMap[f.requester_id];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="p-8 md:p-12 max-w-4xl mx-auto">
      <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl font-semibold tracking-tight">Friends</motion.h1>
      <p className="mt-2 text-muted-foreground">Connect with people. Only friends can DM you.</p>

      <div className="mt-8 bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Find by username…" className="flex-1 h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          <button onClick={search} className="h-11 px-5 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-soft">Search</button>
        </div>
        {results.length > 0 && (
          <ul className="mt-4 space-y-2">
            {results.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-soft">
                <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold">{p.display_name[0]?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.display_name}</div>
                  <div className="text-xs text-muted-foreground">@{p.username}</div>
                </div>
                <button onClick={() => sendRequest(p.id)} className="h-9 px-3 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-soft inline-flex items-center gap-1.5">
                  <UserPlus className="size-4" /> Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Section title="Friend requests" empty="No incoming requests">
        {incoming.map((f) => {
          const p = other(f); if (!p) return null;
          return (
            <Row key={f.id} p={p}>
              <button onClick={() => respond(f.id, "accepted")} className="h-9 px-3 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-soft inline-flex items-center gap-1.5"><Check className="size-4" /> Accept</button>
              <button onClick={() => remove(f.id)} className="h-9 px-3 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-soft inline-flex items-center gap-1.5"><X className="size-4" /> Decline</button>
            </Row>
          );
        })}
      </Section>

      <Section title="Sent requests" empty="No outgoing requests">
        {outgoing.map((f) => { const p = other(f); if (!p) return null; return (
          <Row key={f.id} p={p}>
            <span className="h-9 px-3 inline-flex items-center rounded-xl border border-border bg-muted/50 text-foreground text-xs font-medium">Pending</span>
            <button onClick={() => remove(f.id)} className="h-9 px-3 rounded-xl border border-border bg-muted text-foreground text-sm font-medium hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-soft inline-flex items-center gap-1.5"><X className="size-4" /> Cancel</button>
          </Row>
        ); })}
      </Section>

      <Section title="Your friends" empty="No friends yet — search above to add some.">
        {accepted.map((f) => { const p = other(f); if (!p) return null; return (
          <Row key={f.id} p={p}>
            <button onClick={() => respond(f.id, "blocked")} className="h-9 px-3 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-soft inline-flex items-center gap-1.5"><Ban className="size-4" /> Block</button>
            <button onClick={() => remove(f.id)} className="h-9 px-3 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-soft inline-flex items-center gap-1.5"><UserMinus className="size-4" /> Remove</button>
          </Row>
        ); })}
      </Section>

      {blocked.length > 0 && (
        <Section title="Blocked" empty="">
          {blocked.map((f) => { const p = other(f); if (!p) return null; return (
            <Row key={f.id} p={p}>
              <button onClick={() => remove(f.id)} className="h-9 px-3 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-soft">Unblock</button>
            </Row>
          ); })}
        </Section>
      )}
    </motion.div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="mt-3 bg-card-gradient border border-border/60 rounded-3xl shadow-soft overflow-hidden">
        {arr.length ? <ul className="divide-y divide-border/60">{arr}</ul> : <p className="p-6 text-sm text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}
function Row({ p, children }: { p: Profile; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 p-4">
      <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold">{p.display_name[0]?.toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{p.display_name}</div>
        <div className="text-xs text-muted-foreground">@{p.username}</div>
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}
