import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Building2, ArrowRight, Sparkles } from "lucide-react";

export function WorkspaceShowcase() {
  return (
    <section className="px-6 md:px-10 pb-24 max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card-gradient p-10 md:p-16 text-center shadow-elevated"
      >
        <div className="absolute inset-0 ambient-grain -z-10 opacity-60" />
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
          <Building2 className="size-3.5 text-primary" />
          <span>New · For organizations</span>
        </div>
        <h2 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight">
          Axion <span className="text-primary">Workspace</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          AI for Teachers · Schools · Teams · Businesses
        </p>
        <p className="mt-2 text-sm text-muted-foreground/80 italic">
          Create. Collaborate. Manage. Grow.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/workspace"
            className="inline-flex h-12 px-7 items-center gap-2 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft"
          >
            <Sparkles className="size-4" /> Explore Workspace <ArrowRight className="size-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
