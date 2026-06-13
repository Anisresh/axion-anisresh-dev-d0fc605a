import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Sparkles, MessageCircle, Users, Timer, GraduationCap, ArrowRight, Building2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home · Axion6" }] }),
  component: HomePage,
});

const tiles = [
  { to: "/workspaces", icon: Building2, title: "Workspaces", body: "Office & Friends spaces" },
  { to: "/messages", icon: MessageCircle, title: "Messages", body: "Talk to your friends" },
  { to: "/groups", icon: Users, title: "Groups & lobbies", body: "Public + private spaces" },
  { to: "/xai", icon: Sparkles, title: "XAI", body: "Your AI companion" },
  { to: "/learning", icon: GraduationCap, title: "Learning", body: "Flashcards & quizzes" },
  { to: "/focus", icon: Timer, title: "Focus", body: "Pomodoro & timers" },
] as const;

function HomePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string; username: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, username").eq("id", user.id).maybeSingle()
      .then(({ data }) => data && setProfile(data));
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="mt-1 text-4xl md:text-5xl font-semibold tracking-tight">
          {profile?.display_name ?? "Welcome"}.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg">
          A calm space to talk, focus, and learn. Pick where you'd like to go.
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <Link to={t.to} className="block group bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-soft">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-2xl bg-primary-gradient text-primary-foreground grid place-items-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <t.icon className="size-5" strokeWidth={2.2} />
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-soft" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
