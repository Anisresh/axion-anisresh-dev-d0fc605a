import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2, Coffee } from "lucide-react";
import { Footer } from "@/components/Footer";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in · Axion6" },
      { name: "description", content: "Sign in or create your Axion6 account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: searchMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(searchMode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (username.length < 3) { toast.error("Username must be at least 3 characters"); return; }
        if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { username, display_name: displayName || username },
          },
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Welcome to Axion6— your calm café awaits ☕ Please check your inbox to verify your email.");
        navigate({ to: "/home", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        navigate({ to: "/home", replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/home" });
      if (result.error) toast.error("Could not sign in with Google");
      if (!result.redirected && !result.error) navigate({ to: "/home", replace: true });
    } catch {
      toast.error("Could not sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col ambient-grain">
      <header className="px-6 md:px-10 pt-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5 tap">
          <div className="size-10 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow"><Coffee className="size-5" /></div>
          <span className="font-semibold tracking-tight text-lg">Axion6</span>
        </Link>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-card-gradient border border-border/60 rounded-[28px] shadow-elevated p-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Pull up a chair"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin" ? "Sign in to your café." : "Create your account — calm, premium, and yours."}
            </p>

            <button
              onClick={onGoogle}
              disabled={loading}
              className="mt-6 w-full h-11 rounded-2xl border border-border bg-card font-medium text-sm flex items-center justify-center gap-2.5 hover:bg-muted transition-soft tap disabled:opacity-50"
            >
              <svg className="size-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.5-5.9 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.3l-6.2-5.2c-2 1.5-4.5 2.5-7.2 2.5-5.4 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5h-1.9V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="Username" required className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name (optional)" className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
                </>
              )}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />

              <button type="submit" disabled={loading} className="w-full h-11 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft tap disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="size-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            {mode === "signin" && (
              <Link to="/forgot-password" className="mt-4 block text-center text-sm text-muted-foreground hover:text-primary transition-soft">
                Forgot password?
              </Link>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New to Axion6?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-medium text-primary hover:underline">
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Axion Workspaces CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 relative overflow-hidden rounded-[28px] border border-border/60 bg-card-gradient p-7 text-center shadow-soft"
          >
            <div className="absolute inset-0 -z-10 bg-hero opacity-60" />
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-medium text-muted-foreground">
              ✨ New
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Axion Workspaces</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Create or join a powerful AI Workspace
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              For Schools • Families • Friends • Teams • Businesses
            </p>
            <Link
              to="/workspace"
              className="mt-5 inline-flex h-10 px-5 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-soft"
            >
              Explore →
            </Link>
            <p className="mt-3 text-[11px] text-muted-foreground/70">100% free · separate from Axion</p>
          </motion.div>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
}
