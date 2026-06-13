import { Heart, Mail, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const EMAIL = "anisreshar@gmail.com";
const SUBJECT = "Axion6 — Complaint / Feedback";
const BODY = "Hi Anisresh,\n\nI'd like to share the following about Axion6:\n\n— What happened:\n\n— What I expected:\n\n— Page / feature:\n\nThanks!\n";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

export function Footer() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); toast.success("Email copied"); setTimeout(() => setCopied(false), 1500); }
    catch { toast.error("Couldn't copy — email: " + EMAIL); }
  };
  return (
    <footer className="border-t border-border/60 mt-6 py-6 px-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        Made with <Heart className="size-3.5 text-primary fill-current" /> by{" "}
        <span className="text-foreground font-medium">Anisresh A R</span>
      </span>
      <span className="hidden sm:inline opacity-50">·</span>
      <Dialog>
        <DialogTrigger asChild>
          <button className="inline-flex items-center gap-1.5 hover:text-primary transition-soft">
            <Mail className="size-3.5" /> Complaints? Email me
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send a complaint or feedback</DialogTitle>
            <DialogDescription>Pick how you'd like to email me — opens in a new tab so it works inside previews too.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer" className="block w-full text-left px-4 py-3 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-soft">
              Open in Gmail
            </a>
            <a href={MAILTO} className="block w-full text-left px-4 py-3 rounded-2xl border border-border bg-muted/50 text-foreground font-medium hover:bg-muted transition-soft">
              Open default mail app
            </a>
            <button onClick={copy} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-muted/50 text-foreground font-medium hover:bg-muted transition-soft">
              <span className="truncate">{EMAIL}</span>
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
