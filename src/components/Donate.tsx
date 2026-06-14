import { useState } from "react";
import { Heart, Copy, Check, Smartphone } from "lucide-react";
import { toast } from "sonner";

const UPI_NUMBER = "9048088397";

// UPI deep link works on Android with most apps installed.
// pa = payee, pn = name, cu = currency, tn = transaction note
function upiLink(handle: string, amount?: string) {
  const params = new URLSearchParams({
    pa: handle,
    pn: "Axion6",
    cu: "INR",
    tn: "Supporting Axion6 — thank you",
  });
  if (amount) params.set("am", amount);
  return `upi://pay?${params.toString()}`;
}

export function Donate({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    await navigator.clipboard.writeText(UPI_NUMBER);
    setCopied(true);
    toast.success("Number copied — paste it into any UPI app");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-border/60 bg-card-gradient ${compact ? "p-7" : "p-10 md:p-14"} text-center shadow-elevated`}>
      <div className="absolute inset-0 ambient-grain -z-10 opacity-50" />
      <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
        <Heart className="size-3.5 text-primary fill-primary" />
        <span>If Axion6 means something to you</span>
      </div>
      <h2 className={`mt-5 font-semibold tracking-tight ${compact ? "text-2xl" : "text-3xl md:text-5xl"}`}>
        A small gift, a <span className="text-primary">huge difference</span>.
      </h2>
      <p className={`mt-4 text-muted-foreground mx-auto leading-relaxed ${compact ? "text-sm max-w-md" : "text-base md:text-lg max-w-2xl"}`}>
        Axion6 is built by one person, late at night, with a lot of coffee and a lot of care.
        It will always be free for everyone who needs a quieter place to talk, learn, and focus.
        If something here made your day a little better — a chat that felt calmer, a study set that
        finally clicked, a workspace that brought your people together — a small donation keeps
        the lights on and lets me keep building this for all of us. Every rupee is read, every name
        is remembered. Thank you for being here. 💛
      </p>

      <div className="mt-7 inline-flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-3 rounded-2xl glass border border-border/60 px-5 py-3">
          <Smartphone className="size-4 text-primary" />
          <span className="font-mono text-lg tracking-wider">{UPI_NUMBER}</span>
          <button
            onClick={copyNumber}
            className="ml-2 h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium shadow-glow hover:opacity-90 transition-soft inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy UPI number"}
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-1">
          <a href={upiLink(`${UPI_NUMBER}@ybl`)} className="h-10 px-4 rounded-2xl glass border border-border/60 text-xs font-medium hover:bg-card transition-soft">PhonePe</a>
          <a href={upiLink(`${UPI_NUMBER}@okbizaxis`)} className="h-10 px-4 rounded-2xl glass border border-border/60 text-xs font-medium hover:bg-card transition-soft">Google Pay</a>
          <a href={upiLink(`${UPI_NUMBER}@paytm`)} className="h-10 px-4 rounded-2xl glass border border-border/60 text-xs font-medium hover:bg-card transition-soft">Paytm</a>
        </div>
        <p className="text-[11px] text-muted-foreground max-w-sm mt-1">
          On mobile, tap a button to open your UPI app. On desktop, copy the number and pay from
          any UPI app — PhonePe, GPay, Paytm, BHIM, or your bank.
        </p>
      </div>
    </div>
  );
}
