import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Heart, Shield, User, HelpCircle, Map, Send, CheckCircle2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function formatFixedDate(d: Date) { return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }

function FloatingCard({ onReview }: { onReview: () => void }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight || 1);
      if (pct > 0.3) setShow(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="fixed bottom-5 right-5 z-40 max-w-sm glass border border-border/60 rounded-3xl p-5 shadow-elevated backdrop-blur-xl"
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-soft"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
            <Heart className="size-3.5 fill-current" /> A little note
          </div>
          <h3 className="text-base font-semibold tracking-tight pr-6">
            Built by a 13-year-old developer.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Axion is an independent passion project by Anisresh A R. If it made you smile or helped you, your feedback means more than you might imagine.
          </p>
          <button
            onClick={() => { onReview(); setDismissed(true); }}
            className="mt-4 inline-flex h-9 px-4 items-center gap-1.5 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-soft"
          >
            <Star className="size-3.5" /> Leave a Review
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReviewForm() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { toast.error("Please write a short message"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      name: name.trim() || null,
      country: country.trim() || null,
      rating,
      message: message.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error("Couldn't send — please try again"); return; }
    setDone(true);
    setName(""); setCountry(""); setMessage(""); setRating(5);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card-gradient border border-border/60 rounded-3xl p-8 text-center shadow-soft"
      >
        <div className="size-12 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">Thank you for supporting an independent student developer.</h3>
        <p className="mt-2 text-sm text-muted-foreground">Your message has been delivered successfully.</p>
        <button onClick={() => setDone(false)} className="mt-5 text-sm text-primary hover:underline">Send another</button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-card-gradient border border-border/60 rounded-3xl p-7 shadow-soft space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Name (optional)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
            className="mt-1 w-full h-11 px-4 rounded-2xl bg-muted/40 border border-border/60 focus:border-primary outline-none transition-soft text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Country (optional)</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60}
            className="mt-1 w-full h-11 px-4 rounded-2xl bg-muted/40 border border-border/60 focus:border-primary outline-none transition-soft text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Rating</label>
        <div className="mt-1 flex items-center gap-1">
          {[1,2,3,4,5].map((n) => (
            <button type="button" key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)} className="p-1 transition-soft" aria-label={`Rate ${n} stars`}>
              <Star className={`size-6 transition-soft ${(hover || rating) >= n ? "text-primary fill-current" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} rows={4}
          placeholder="Share a thought, bug, or feature idea…"
          className="mt-1 w-full px-4 py-3 rounded-2xl bg-muted/40 border border-border/60 focus:border-primary outline-none transition-soft text-sm resize-none" />
      </div>
      <button type="submit" disabled={submitting}
        className="inline-flex h-11 px-5 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-soft disabled:opacity-60">
        <Send className="size-4" /> {submitting ? "Sending…" : "Send Review"}
      </button>
    </form>
  );
}

function PrivacyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const date = formatFixedDate(new Date());
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[80vh] overflow-auto bg-card border border-border/60 rounded-3xl p-8 shadow-elevated"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        <h3 className="text-2xl font-semibold tracking-tight">Full Privacy Policy</h3>
        <p className="mt-1 text-xs text-muted-foreground">Last Updated: {date}</p>
        <div className="mt-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p><strong className="text-foreground">1. What we collect.</strong> Only what you provide — account email, profile info, messages you send, and content you upload to the Learning Hub.</p>
          <p><strong className="text-foreground">2. How we use it.</strong> To operate the product: deliver your messages, store your notes, power XAI responses, and remember your preferences.</p>
          <p><strong className="text-foreground">3. What we never do.</strong> Sell your data, share it with advertisers, or track you across the internet for ads.</p>
          <p><strong className="text-foreground">4. AI processing.</strong> Prompts you send to XAI are processed through an AI provider to generate replies. They are not used to train models on your behalf.</p>
          <p><strong className="text-foreground">5. Storage.</strong> Data is stored on secure cloud infrastructure with access controls and row-level security.</p>
          <p><strong className="text-foreground">6. Your control.</strong> You can request account deletion at any time by emailing the creator.</p>
          <p><strong className="text-foreground">7. Updates.</strong> As Axion evolves this policy may change to reflect new features while maintaining transparency.</p>
        </div>
      </motion.div>
    </div>
  );
}

const faqs = [
  { q: "Is Axion free?", a: "Yes. Many features are available for everyone, with future premium capabilities planned." },
  { q: "Who built Axion?", a: "Axion was created by Anisresh A R, a student developer passionate about technology and design." },
  { q: "Why did you build it?", a: "To explore how AI, communication, and productivity can exist in one elegant experience." },
  { q: "Is my data sold?", a: "No. User trust is more valuable than advertising revenue." },
  { q: "How can I support the project?", a: "Share Axion with friends, leave a review, report bugs, and suggest new features." },
];

const roadmap = [
  { done: true, label: "Version 1" },
  { done: false, label: "Voice Assistant" },
  { done: false, label: "AI Image Generation" },
  { done: false, label: "AI Video Generation" },
  { done: false, label: "Mobile Apps" },
  { done: false, label: "Smart Workspace" },
  { done: false, label: "Community Features" },
];

export function LandingExtras() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const reviewRef = useRef<HTMLDivElement | null>(null);
  const scrollToReview = () => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <FloatingCard onReview={scrollToReview} />

      {/* Review */}
      <section ref={reviewRef} className="px-6 md:px-10 pb-24 max-w-3xl mx-auto w-full scroll-mt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Star className="size-3.5 text-primary" /> Feedback
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">Would you care to review this project?</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Your thoughts go directly to my inbox and help shape the future of Axion. Whether it's a bug report, feature idea, or simply "this looks awesome," I read every message.
          </p>
        </motion.div>
        <div className="mt-6"><ReviewForm /></div>
      </section>

      {/* Privacy */}
      <section className="px-6 md:px-10 pb-24 max-w-3xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="bg-card-gradient border border-border/60 rounded-3xl p-8 shadow-soft">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4"><Shield className="size-5" /></div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Your privacy matters.</h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Axion was built to help people, not harvest data.</p>
            <p>I do not sell your personal information or track you across the internet for advertising purposes.</p>
            <p>Any information you voluntarily provide is used only to improve the project or respond to your feedback.</p>
            <p>As Axion evolves, this policy may be updated to reflect new features while maintaining transparency.</p>
            <p className="text-xs">Last Updated: {formatFixedDate(new Date())}</p>
          </div>
          <button onClick={() => setPrivacyOpen(true)} className="mt-5 inline-flex h-10 px-4 items-center gap-1.5 rounded-2xl border border-border bg-muted/40 hover:bg-muted text-sm font-medium transition-soft">
            Read Full Policy →
          </button>
        </motion.div>
      </section>

      {/* About */}
      <section className="px-6 md:px-10 pb-24 max-w-3xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <User className="size-3.5 text-primary" /> About
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">Hi, I'm Anisresh.</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Student","Developer","Designer","Content Creator"].map((t) => (
              <span key={t} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{t}</span>
            ))}
          </div>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            I love building technology that feels calm, intelligent, and beautifully designed. Axion started as an idea and became a project where I could learn real-world software development, UI/UX, deployment, and AI integration.
          </p>
          <p className="mt-3 text-sm text-primary font-medium">This is only Version 1.</p>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-10 pb-24 max-w-3xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <HelpCircle className="size-3.5 text-primary" /> FAQ
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">Frequently asked.</h2>
        </motion.div>
        <div className="mt-6 space-y-3">
          {faqs.map((f, i) => (
            <motion.details key={f.q}
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group bg-card-gradient border border-border/60 rounded-2xl p-5 shadow-soft">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                <span className="font-medium text-sm">{f.q}</span>
                <span className="text-muted-foreground text-xs group-open:rotate-45 transition-soft">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="px-6 md:px-10 pb-24 max-w-3xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Map className="size-3.5 text-primary" /> Roadmap
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">What's next.</h2>
        </motion.div>
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          {roadmap.map((r, i) => (
            <motion.div key={r.label}
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="flex items-center gap-3 bg-card-gradient border border-border/60 rounded-2xl p-4 shadow-soft">
              <span className={`size-7 grid place-items-center rounded-xl text-xs ${r.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {r.done ? "✓" : "→"}
              </span>
              <span className="text-sm font-medium">{r.label}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground text-center">More ideas are always in development.</p>
      </section>

      {/* Trust */}
      <section className="px-6 md:px-10 pb-24 max-w-3xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Shield className="size-3.5 text-primary" /> Trust
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">What you can count on.</h2>
        </motion.div>
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          {["No spam","No unnecessary tracking","Independent project","Built with transparency","Continuously improving"].map((t, i) => (
            <motion.div key={t}
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="flex items-center gap-3 bg-card-gradient border border-border/60 rounded-2xl p-4 shadow-soft">
              <span className="size-7 grid place-items-center rounded-xl bg-primary/15 text-primary">
                <Check className="size-4" />
              </span>
              <span className="text-sm font-medium">{t}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Heart Footer */}
      <section className="px-6 md:px-10 pb-10 max-w-3xl mx-auto w-full text-center">
        <Heart className="size-5 mx-auto text-primary fill-current" />
        <p className="mt-3 text-sm text-muted-foreground italic leading-relaxed">
          Built with curiosity, countless cups of patience, and an unreasonable amount of debugging.
        </p>
        <p className="mt-2 text-sm font-medium">Created by Anisresh A R</p>
        <p className="mt-1 text-xs text-muted-foreground">© 2026 Axion. All rights reserved.</p>
      </section>

      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
