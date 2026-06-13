import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { learningGenerate } from "@/lib/xai.functions";
import { Upload, Loader2, BookOpen, Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({ meta: [{ title: "Learning · Axion6" }] }),
  component: LearningPage,
});

type Session = { id: string; title: string; source_text: string; output: any; created_at: string };

function LearningPage() {
  const { user } = useAuth();
  const generate = useServerFn(learningGenerate);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("learning_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSessions((data as Session[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const onFile = async (file: File) => {
    try {
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        toast.info("Extracting PDF text…");
        // @ts-ignore - no types for worker subpath
        const pdfjs: any = await import(/* @vite-ignore */ "pdfjs-dist/build/pdf.mjs");
        // @ts-ignore - worker URL
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let out = "";
        const maxPages = Math.min(doc.numPages, 50);
        for (let i = 1; i <= maxPages; i++) {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          out += tc.items.map((it: any) => it.str).join(" ") + "\n\n";
        }
        setSource(out.trim());
      } else {
        const text = await file.text();
        setSource(text);
      }
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      toast.success("File loaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't read file");
    }
  };

  const onGenerate = async () => {
    if (!title.trim() || source.trim().length < 20) { toast.error("Add a title and at least 20 characters of source"); return; }
    setLoading(true);
    try {
      const res = await generate({ data: { title, sourceText: source } });
      toast.success("Study set ready");
      setTitle(""); setSource("");
      await load();
      setActive(res as Session);
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="text-4xl font-semibold tracking-tight">Learning Hub</h1>
      <p className="mt-2 text-muted-foreground">Drop in notes — XAI turns them into flashcards, quizzes, and a clean summary.</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Study set title" className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          <textarea value={source} onChange={(e) => setSource(e.target.value)} placeholder="Paste notes, an article, or chapter content here…" className="mt-3 w-full min-h-[280px] p-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-y" />
          <div className="mt-4 flex items-center gap-2">
            <label className="h-11 px-4 rounded-2xl bg-muted hover:bg-muted/80 transition-soft inline-flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Upload className="size-4" /> Upload PDF, .txt, .md
              <input type="file" accept=".txt,.md,.pdf,text/plain,application/pdf" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
            <button onClick={onGenerate} disabled={loading} className="ml-auto h-11 px-5 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow inline-flex items-center gap-2 hover:opacity-90 transition-soft disabled:opacity-60">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate study set
            </button>
          </div>
        </div>
        <aside className="bg-card-gradient border border-border/60 rounded-3xl p-5 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your sets</h2>
          <ul className="space-y-1 max-h-[420px] overflow-y-auto">
            {sessions.map((s) => (
              <li key={s.id}>
                <button onClick={() => setActive(s)} className={`w-full text-left p-2.5 rounded-2xl transition-soft ${active?.id === s.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60"}`}>
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</div>
                </button>
              </li>
            ))}
            {sessions.length === 0 && <p className="text-xs text-muted-foreground">No sets yet.</p>}
          </ul>
        </aside>
      </div>

      {active && active.output && (
        <div className="mt-8 space-y-6">
          <div className="bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2"><BookOpen className="size-5 text-primary" /> {active.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{active.output.summary}</p>
            {active.output.key_concepts && (
              <div className="mt-4 flex flex-wrap gap-2">
                {active.output.key_concepts.map((k: string) => (
                  <span key={k} className="px-3 py-1 rounded-full border border-primary/40 bg-primary/15 text-foreground text-xs font-medium">{k}</span>
                ))}
              </div>
            )}
          </div>

          {active.output.flashcards && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Flashcards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.output.flashcards.map((f: any, i: number) => (
                  <details key={i} className="bg-card-gradient border border-border/60 rounded-2xl p-5 shadow-soft cursor-pointer group">
                    <summary className="font-medium list-none flex justify-between"><span>{f.q}</span><span className="text-xs text-muted-foreground group-open:rotate-180 transition">▾</span></summary>
                    <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {active.output.mcqs && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Practice quiz</h3>
              <div className="space-y-3">
                {active.output.mcqs.map((q: any, i: number) => (
                  <Mcq key={i} q={q} />
                ))}
              </div>
            </div>
          )}

          {active.output.short_answer && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Short answer</h3>
              <div className="space-y-3">
                {active.output.short_answer.map((q: any, i: number) => (
                  <details key={i} className="bg-card-gradient border border-border/60 rounded-2xl p-5 shadow-soft"><summary className="font-medium">{q.q}</summary><p className="mt-2 text-sm text-muted-foreground">{q.a}</p></details>
                ))}
              </div>
            </div>
          )}

          {active.output.long_answer && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Long answer</h3>
              <div className="space-y-3">
                {active.output.long_answer.map((q: any, i: number) => (
                  <details key={i} className="bg-card-gradient border border-border/60 rounded-2xl p-5 shadow-soft"><summary className="font-medium">{q.q}</summary><p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{q.a}</p></details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Mcq({ q }: { q: { q: string; options: string[]; answer_index: number } }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="bg-card-gradient border border-border/60 rounded-2xl p-5 shadow-soft">
      <p className="font-medium">{q.q}</p>
      <div className="mt-3 space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = picked !== null && i === q.answer_index;
          const isWrong = picked === i && i !== q.answer_index;
          return (
            <button key={i} onClick={() => setPicked(i)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-soft border ${isCorrect ? "border-primary bg-primary text-primary-foreground" : isWrong ? "border-destructive bg-destructive text-destructive-foreground" : "border-border bg-muted/40 text-foreground hover:bg-muted"}`}>
              <span className="inline-flex items-center gap-2">
                {picked !== null && isCorrect && <Check className="size-4" />}
                {isWrong && <X className="size-4" />}
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
