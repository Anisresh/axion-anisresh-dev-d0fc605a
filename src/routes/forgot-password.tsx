import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Loader2, ArrowLeft, Mail, Coffee } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · Axion6" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Check your inbox for the reset link");
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
            <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4"><Mail className="size-5" /></div>
            <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">No problem. Enter your email and we'll send a reset link.</p>
            {sent ? (
              <div className="mt-6 p-4 rounded-2xl bg-primary/10 text-sm text-foreground">
                If <span className="font-medium">{email}</span> exists, a reset email is on its way. Check your spam folder too.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-3">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
                <button type="submit" disabled={loading} className="w-full h-11 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft disabled:opacity-50 flex items-center justify-center gap-2 tap">
                  {loading && <Loader2 className="size-4 animate-spin" />} Send reset link
                </button>
              </form>
            )}
            <Link to="/auth" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-soft">
              <ArrowLeft className="size-3.5" /> Back to sign in
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
