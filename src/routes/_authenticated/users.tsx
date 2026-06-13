import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { Search, UserPlus, Check, Clock, Users as UsersIcon } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Directory · Axion6" }] }),
  component: UsersPage,
});

type Profile = { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null };
type Friendship = { requester_id: string; addressee_id: string; status: "pending" | "accepted" | "blocked" };

function UsersPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: ps }, { data: fs }] = await Promise.all([
      supabase.from("profiles").select("id, username, display_name, avatar_url, bio").neq("id", user.id).order("display_name").limit(500),
      supabase.from("friendships").select("requester_id, addressee_id, status").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    ]);
    setProfiles((ps as Profile[]) ?? []);
    setFriendships((fs as Friendship[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const status = (otherId: string): "none" | "outgoing" | "incoming" | "friends" | "blocked" => {
    const f = friendships.find((x) => (x.requester_id === user?.id && x.addressee_id === otherId) || (x.addressee_id === user?.id && x.requester_id === otherId));
    if (!f) return "none";
    if (f.status === "accepted") return "friends";
    if (f.status === "blocked") return "blocked";
    return f.requester_id === user?.id ? "outgoing" : "incoming";
  };

  const sendRequest = async (addressee_id: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id });
    if (error) toast.error(error.message); else { toast.success("Friend request sent"); load(); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      p.username.toLowerCase().includes(q) ||
      p.display_name.toLowerCase().includes(q) ||
      (p.bio ?? "").toLowerCase().includes(q)
    );
  }, [profiles, query]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary-gradient text-primary-foreground grid place-items-center shadow-glow">
            <UsersIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Directory</h1>
            <p className="text-sm text-muted-foreground">Everyone on Axion6. Send a friend request to start chatting privately.</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 bg-card-gradient border border-border/60 rounded-3xl shadow-soft p-4 flex items-center gap-3">
        <Search className="size-5 text-muted-foreground shrink-0 ml-1" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username, or bio…"
          className="flex-1 h-10 bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground pr-2">{filtered.length} {filtered.length === 1 ? "person" : "people"}</span>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-muted/40 animate-pulse" />
        ))}
        {!loading && filtered.map((p) => {
          const s = status(p.id);
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-card-gradient border border-border/60 rounded-3xl p-4 shadow-soft flex gap-3">
              <div className="size-12 rounded-2xl bg-primary/15 text-primary grid place-items-center overflow-hidden shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} className="size-full object-cover" alt="" /> : <span className="font-semibold">{p.display_name[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{p.display_name}</div>
                <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
                {p.bio && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</div>}
                <div className="mt-3">
                  {s === "none" && (
                    <button onClick={() => sendRequest(p.id)} className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-soft tap">
                      <UserPlus className="size-3.5" /> Add friend
                    </button>
                  )}
                  {s === "outgoing" && (
                    <span className="h-8 px-3 rounded-xl bg-muted text-muted-foreground text-xs font-medium inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Requested
                    </span>
                  )}
                  {s === "incoming" && (
                    <span className="h-8 px-3 rounded-xl bg-accent/40 text-accent-foreground text-xs font-medium inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Pending your reply
                    </span>
                  )}
                  {s === "friends" && (
                    <span className="h-8 px-3 rounded-xl bg-primary/15 text-primary text-xs font-medium inline-flex items-center gap-1.5">
                      <Check className="size-3.5" /> Friends
                    </span>
                  )}
                  {s === "blocked" && (
                    <span className="h-8 px-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">Blocked</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-12">No one matches that search.</p>
        )}
      </div>
    </div>
  );
}