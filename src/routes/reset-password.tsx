import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Loader2, KeyRound, Coffee } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password · Axion6" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery hash and emits a SIGNED_IN/PASSWORD_RECOVERY event
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/home", replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-10 pt-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground shadow-glow"><Coffee className="size-4" /></div>
          <span className="font-semibold tracking-tight text-lg">Axion6</span>
        </Link>
      </header>
      <main className="flex-1 grid place-items-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="bg-card-gradient border border-border/60 rounded-3xl shadow-elevated p-8">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4"><KeyRound className="size-5" /></div>
            <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{ready ? "Choose a strong password you'll remember." : "Validating reset link…"}</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" disabled={!ready} className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm disabled:opacity-50" />
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" disabled={!ready} className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm disabled:opacity-50" />
              <button type="submit" disabled={loading || !ready} className="w-full h-11 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft disabled:opacity-50 flex items-center justify-center gap-2 tap">
                {loading && <Loader2 className="size-4 animate-spin" />} Update password
              </button>
            </form>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
