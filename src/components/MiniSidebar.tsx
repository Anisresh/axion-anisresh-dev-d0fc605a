import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Users, MessageCircle, UsersRound, GraduationCap, Sparkles, Timer, Settings, LogOut, Coffee, Compass, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/users", label: "Directory", icon: Compass },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/groups", label: "Lobby", icon: UsersRound },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/workspaces", label: "Workspaces", icon: Building2 },
  { to: "/xai", label: "XAI", icon: Sparkles },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function MiniSidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string; username: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, username, avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => data && setProfile(data as any));
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <motion.aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      animate={{ width: expanded ? 232 : 72 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="fixed left-3 top-3 bottom-3 z-40 glass-strong rounded-[28px] shadow-elevated flex flex-col items-stretch py-4 px-2.5 overflow-hidden border border-border/60"
    >
      <Link to="/home" className="flex items-center gap-3 px-2.5 mb-5">
        <div className="size-11 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow shrink-0 tap">
          <Coffee className="size-5" />
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="font-semibold tracking-tight text-lg whitespace-nowrap"
            >
              Axion6
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex items-center gap-3 px-3 h-11 rounded-2xl transition-soft text-sm font-medium tap",
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="active-pill"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary-foreground/60"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <Icon className="size-[18px] shrink-0" />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-border/50">
        <Link to="/settings" className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-muted/60 transition-soft tap">
          <div className="size-9 rounded-full bg-primary/15 text-primary grid place-items-center overflow-hidden shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="size-full object-cover" />
              : <span className="text-xs font-semibold">{(profile?.display_name?.[0] ?? "?").toUpperCase()}</span>}
          </div>
          <AnimatePresence>
            {expanded && profile && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="min-w-0 flex-1"
              >
                <div className="text-sm font-medium truncate">{profile.display_name}</div>
                <div className="text-[11px] text-muted-foreground truncate">@{profile.username}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center gap-3 px-3 h-10 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-soft tap"
        >
          <LogOut className="size-[18px] shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}>
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
