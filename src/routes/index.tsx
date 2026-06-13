import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, GraduationCap, Timer, Shield, ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { LandingExtras } from "@/components/LandingExtras";
import { WorkspaceShowcase } from "@/components/WorkspaceShowcase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Axion6 — Calm, premium communication & learning" },
      { name: "description", content: "Messaging, focus, and AI-powered learning in one calm, premium space." },
      { property: "og:title", content: "Axion6" },
      { property: "og:description", content: "Calm, premium communication and AI-powered learning." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: MessageCircle, title: "Quiet conversations", body: "Private chats with friends, public lobbies, and group spaces — designed to be calm, never noisy." },
  { icon: Sparkles, title: "XAI assistant", body: "A thoughtful AI companion for writing, coding, brainstorming, and explanations — with memory that belongs to you." },
  { icon: GraduationCap, title: "Learning Hub", body: "Drop in notes or readings. XAI turns them into flashcards, quizzes, and clear revision summaries." },
  { icon: Timer, title: "Focus mode", body: "Pomodoro, countdowns, ambient sounds, streaks. Built to help you concentrate, not to distract you." },
  { icon: Shield, title: "Privacy first", body: "End-to-private rules: only friends can DM you. Your data is yours and stays that way." },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="px-6 md:px-10 pt-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary-gradient grid place-items-center text-primary-foreground font-bold shadow-glow">A6</div>
          <span className="font-semibold tracking-tight text-lg">Axion6</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:inline-flex h-10 px-4 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-soft">
            Sign in
          </Link>
          <Link to="/auth" search={{ mode: "signup" }} className="inline-flex h-10 px-5 items-center rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-soft">
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-6 md:px-10 pt-20 pb-28 max-w-7xl mx-auto w-full">
        <div className="absolute inset-0 ambient-grain -z-10 opacity-80" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="size-3.5 text-primary" />
            <span>Calm by design · Powered by XAI</span>
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
            A quieter place to <span className="text-primary">talk, focus, and learn</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Axion6 brings together messaging, AI-powered learning, and focus tools — in one warm, minimal interface that respects your attention.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/auth" search={{ mode: "signup" }} className="inline-flex h-12 px-6 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft">
              Create your account <ArrowRight className="size-4" />
            </Link>
            <Link to="/auth" className="inline-flex h-12 px-6 items-center rounded-2xl glass border border-border/60 font-medium hover:bg-card transition-soft">
              I have an account
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-10 pb-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-card-gradient border border-border/60 rounded-3xl p-7 shadow-soft hover:shadow-elevated transition-soft"
            >
              <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-5">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 pb-24 max-w-7xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-hero p-12 md:p-16 text-center shadow-elevated">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Make room for what matters.</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join Axion6 — calm, premium, and built for people who care about their time.</p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-8 inline-flex h-12 px-7 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft">
            Start free <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <WorkspaceShowcase />
      <LandingExtras />
      <Footer />
    </div>
  );
}
