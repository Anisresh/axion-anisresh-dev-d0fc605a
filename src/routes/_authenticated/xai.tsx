import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { xaiChat, xaiImage } from "@/lib/xai.functions";
import { streamSpeak, stopSpeaking } from "@/lib/streamTTS";
import { Send, Sparkles, Plus, Loader2, Zap, Brain, Trash2, ImageIcon, Paperclip, Mic, MicOff, Volume2, VolumeX, X, FileText, Radio, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/xai")({
  head: () => ({ meta: [{ title: "XAI · Axion6" }] }),
  component: XaiPage,
});

type Conv = { id: string; title: string; updated_at: string };
type Msg = { id: string; role: "user" | "assistant" | "system"; content: string; created_at: string };
type Attach = { kind: "image" | "file"; dataUrl: string; filename: string; mime: string };

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB per file

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function XaiPage() {
  const { user } = useAuth();
  const chat = useServerFn(xaiChat);
  const imageGen = useServerFn(xaiImage);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"fast" | "reasoning" | "image">("reasoning");
  const [attachments, setAttachments] = useState<Attach[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<any>(null);

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
  useEffect(() => () => { stopSpeaking(); recogRef.current?.stop?.(); }, []);

  const speakReply = async (content: string) => {
    // strip markdown images and code fences for cleaner narration
    const clean = content
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[#*_>`~]/g, "")
      .trim();
    if (!clean) return;
    try {
      setSpeaking(true);
      await streamSpeak(clean);
    } catch (e: any) {
      toast.error(e?.message ?? "Voice playback failed");
    } finally {
      setSpeaking(false);
    }
  };

  const toggleMic = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser. Try Chrome."); return; }
    if (listening) { recogRef.current?.stop?.(); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-US";
    let finalText = "";
    r.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setText((finalText + interim).trim());
    };
    r.onend = () => { setListening(false); recogRef.current = null; };
    r.onerror = () => { setListening(false); recogRef.current = null; };
    recogRef.current = r;
    setListening(true);
    r.start();
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Attach[] = [...attachments];
    for (const f of Array.from(files)) {
      if (next.length >= 6) { toast.error("Max 6 attachments"); break; }
      if (f.size > MAX_FILE_BYTES) { toast.error(`${f.name} is too large (max 8MB)`); continue; }
      try {
        const dataUrl = await fileToDataUrl(f);
        next.push({
          kind: f.type.startsWith("image/") ? "image" : "file",
          dataUrl,
          filename: f.name,
          mime: f.type || "application/octet-stream",
        });
      } catch { toast.error(`Couldn't read ${f.name}`); }
    }
    setAttachments(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    if ((!text.trim() && attachments.length === 0) || loading) return;
    const userMsg = text.trim() || "(see attachments)";
    const atts = attachments;
    setText(""); setAttachments([]); setLoading(true);
    const displayContent = mode === "image" ? `🎨 ${userMsg}` : userMsg + (atts.length ? `\n\n_📎 ${atts.length} attachment${atts.length > 1 ? "s" : ""}_` : "");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: displayContent, created_at: new Date().toISOString() }]);
    try {
      if (mode === "image") {
        const res = await imageGen({ data: { conversationId: active, prompt: userMsg } });
        setActive(res.conversationId);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: `![image](${res.dataUrl})`, created_at: new Date().toISOString() }]);
      } else {
        const res = await chat({ data: { conversationId: active, userMessage: userMsg, mode, attachments: atts.length ? atts : undefined } });
        setActive(res.conversationId);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: res.reply, created_at: new Date().toISOString() }]);
        if (voiceMode) void speakReply(res.reply);
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
                <p className="mt-2 text-muted-foreground text-sm">Attach images or PDFs, ask anything, use the mic, or turn on voice mode and I'll speak back.</p>
              </div>
            </div>
          )}
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map((m) => {
              const imgMatch = m.role === "assistant" ? m.content.match(/^!\[[^\]]*\]\((data:image\/[^)]+)\)$/) : null;
              return (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-2xl rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-soft ${m.role === "user" ? "bg-primary-gradient text-primary-foreground" : "bg-card border border-border/60"} group relative`}>
                    {imgMatch ? (
                      <img src={imgMatch[1]} alt="Generated" className="rounded-xl max-w-full" />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                    {m.role === "assistant" && !imgMatch && (
                      <button
                        onClick={() => (speaking ? stopSpeaking() : speakReply(m.content))}
                        title={speaking ? "Stop speaking" : "Speak this reply"}
                        className="absolute -bottom-3 -right-3 size-8 rounded-full bg-card border border-border/60 shadow-soft grid place-items-center opacity-0 group-hover:opacity-100 transition-soft hover:text-primary"
                      >
                        {speaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                      </button>
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Mode:</span>
              <button type="button" onClick={() => setMode("fast")} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-soft border ${mode === "fast" ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`} title="Faster replies">
                <Zap className="size-3.5" /> Faster
              </button>
              <button type="button" onClick={() => setMode("reasoning")} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-soft border ${mode === "reasoning" ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`} title="Smarter (Gemini 3 Pro)">
                <Brain className="size-3.5" /> Smart
              </button>
              <button type="button" onClick={() => setMode("image")} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-soft border ${mode === "image" ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`} title="Generate image">
                <ImageIcon className="size-3.5" /> Image
              </button>
              <div className="mx-1 h-5 w-px bg-border/60" />
              <button
                type="button"
                onClick={() => { const n = !voiceMode; setVoiceMode(n); if (!n) stopSpeaking(); }}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-soft border ${voiceMode ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`}
                title="Speak replies aloud"
              >
                {voiceMode ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />} Voice
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-muted/60 border border-border/60 text-xs">
                    {a.kind === "image" ? <img src={a.dataUrl} alt="" className="size-8 rounded-md object-cover" /> : <FileText className="size-4 text-muted-foreground" />}
                    <span className="max-w-[160px] truncate">{a.filename}</span>
                    <button onClick={() => setAttachments((xs) => xs.filter((_, j) => j !== i))} className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive"><X className="size-3" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.csv,.json" className="hidden" onChange={(e) => pickFiles(e.target.files)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading || mode === "image"}
                title="Attach images or files"
                className="size-11 shrink-0 rounded-2xl bg-card border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground transition-soft disabled:opacity-40"
              >
                <Paperclip className="size-4" />
              </button>
              <button
                type="button"
                onClick={toggleMic}
                title={listening ? "Stop listening" : "Speak to XAI"}
                className={`size-11 shrink-0 rounded-2xl border grid place-items-center transition-soft ${listening ? "bg-destructive/15 border-destructive/40 text-destructive animate-pulse" : "bg-card border-border/60 text-muted-foreground hover:text-foreground"}`}
              >
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
              <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={mode === "image" ? "Describe an image to generate…" : listening ? "Listening…" : "Ask XAI anything — attach files, use the mic…"} rows={1} disabled={loading} className="flex-1 resize-none px-4 py-3 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm max-h-40 disabled:opacity-60" />
              <button onClick={send} disabled={loading || (!text.trim() && attachments.length === 0)} className="size-11 rounded-2xl bg-primary-gradient text-primary-foreground grid place-items-center shadow-glow hover:opacity-90 transition-soft disabled:opacity-50"><Send className="size-5" /></button>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
