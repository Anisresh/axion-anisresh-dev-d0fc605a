import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { xaiChat, xaiImage } from "@/lib/xai.functions";
import { Send, Sparkles, Plus, Loader2, Zap, Brain, Trash2, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/xai")({
  head: () => ({ meta: [{ title: "XAI · Axion6" }] }),
  component: XaiPage,
});

type Conv = { id: string; title: string; updated_at: string };
type Msg = { id: string; role: "user" | "assistant" | "system"; content: string; created_at: string };

function XaiPage() {
  const { user } = useAuth();
  const chat = useServerFn(xaiChat);
  const imageGen = useServerFn(xaiImage);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"fast" | "reasoning" | "image">("fast");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    if (!user) return;
    const { data } = await supabase.from("ai_conversations").select("id, title, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
    setConvs((data as Conv[]) ?? []);
  };
  useEffect(() => { loadConvs(); }, [user]);

  useEffect(() => {
    if (!active) { setMessages([]); return; }
    supabase.from("ai_messages").select("*").eq("conversation_id", active).order("created_at").then(({ data }) => setMessages((data as Msg[]) ?? []));
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    if (!text.trim() || loading) return;
    const userMsg = text;
    setText(""); setLoading(true);
    const displayContent = mode === "image" ? `🎨 ${userMsg}` : userMsg;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: displayContent, created_at: new Date().toISOString() }]);
    try {
      if (mode === "image") {
        const res = await imageGen({ data: { conversationId: active, prompt: userMsg } });
        setActive(res.conversationId);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: `![image](${res.dataUrl})`, created_at: new Date().toISOString() }]);
      } else {
        const res = await chat({ data: { conversationId: active, userMessage: userMsg, mode } });
        setActive(res.conversationId);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: res.reply, created_at: new Date().toISOString() }]);
      }
      loadConvs();
    } catch (e: any) {
      toast.error(e?.message ?? "XAI couldn't reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="flex h-[calc(100vh-3.5rem)] gap-4 p-4">
      <aside className="w-72 shrink-0 bg-card-gradient border border-border/60 rounded-3xl shadow-soft p-4 overflow-y-auto">
        <button onClick={() => { setActive(null); setMessages([]); }} className="w-full h-10 px-3 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow inline-flex items-center justify-center gap-2 hover:opacity-90 transition-soft">
          <Plus className="size-4" /> New chat
        </button>
        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">History</h2>
        <ul className="space-y-1">
          {convs.map((c) => (
            <li key={c.id} className="group flex items-center gap-1">
              <button onClick={() => setActive(c.id)} className={`flex-1 text-left p-2.5 rounded-2xl transition-soft text-sm truncate ${active === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60"}`}>
                {c.title}
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(`Delete "${c.title}"? This can't be undone.`)) return;
                  await supabase.from("ai_messages").delete().eq("conversation_id", c.id);
                  const { error } = await supabase.from("ai_conversations").delete().eq("id", c.id);
                  if (error) { toast.error(error.message); return; }
                  if (active === c.id) { setActive(null); setMessages([]); }
                  loadConvs();
                  toast.success("Chat deleted");
                }}
                title="Delete chat"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted opacity-0 group-hover:opacity-100 transition-soft"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex-1 bg-card-gradient border border-border/60 rounded-3xl shadow-soft flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {messages.length === 0 && !loading && (
            <div className="h-full grid place-items-center text-center">
              <div className="max-w-md">
                <div className="size-14 rounded-3xl bg-primary-gradient grid place-items-center mx-auto text-primary-foreground shadow-glow"><Sparkles className="size-6" /></div>
                <h3 className="mt-5 text-2xl font-semibold tracking-tight">Hi, I'm XAI.</h3>
                <p className="mt-2 text-muted-foreground text-sm">Ask me to write, explain, summarize, brainstorm, or just chat. Everything stays in your private history.</p>
              </div>
            </div>
          )}
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map((m) => {
              const imgMatch = m.role === "assistant" ? m.content.match(/^!\[[^\]]*\]\((data:image\/[^)]+)\)$/) : null;
              return (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-2xl rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-soft ${m.role === "user" ? "bg-primary-gradient text-primary-foreground" : "bg-card border border-border/60"}`}>
                    {imgMatch ? (
                      <img src={imgMatch[1]} alt="Generated" className="rounded-xl max-w-full" />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-5 py-3 bg-card border border-border/60 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {mode === "image" ? "Painting…" : "Thinking…"}</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
        <div className="border-t border-border/60 p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Mode:</span>
              <button
                type="button"
                onClick={() => setMode("fast")}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-soft border ${mode === "fast" ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`}
                title="Faster replies, lighter thinking"
              >
                <Zap className="size-3.5" /> Faster
              </button>
              <button
                type="button"
                onClick={() => setMode("reasoning")}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-soft border ${mode === "reasoning" ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`}
                title="Smarter, deeper reasoning (slower)"
              >
                <Brain className="size-3.5" /> Reasoning
              </button>
              <button
                type="button"
                onClick={() => setMode("image")}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-soft border ${mode === "image" ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`}
                title="Generate an image from your prompt"
              >
                <ImageIcon className="size-3.5" /> Image
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={mode === "image" ? "Describe an image to generate…" : "Ask XAI anything…"} rows={1} disabled={loading} className="flex-1 resize-none px-4 py-3 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm max-h-40 disabled:opacity-60" />
              <button onClick={send} disabled={loading || !text.trim()} className="size-11 rounded-2xl bg-primary-gradient text-primary-foreground grid place-items-center shadow-glow hover:opacity-90 transition-soft disabled:opacity-50"><Send className="size-5" /></button>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
