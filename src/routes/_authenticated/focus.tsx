import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Play, Pause, RotateCcw, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus · Axion6" }] }),
  component: FocusPage,
});

type Mode = "pomodoro" | "stopwatch" | "countdown";

function FocusPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [target, setTarget] = useState(25 * 60);
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [todayCount, setTodayCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (mode === "stopwatch") return s + 1;
          if (s <= 1) { setRunning(false); onComplete(); return 0; }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode]);

  const onComplete = async () => {
    if (!user) return;
    await supabase.from("focus_sessions").insert({ user_id: user.id, mode, duration_seconds: target, completed: true });
    loadStats();
  };

  const loadStats = async () => {
    if (!user) return;
    const start = new Date(); start.setHours(0,0,0,0);
    const { count } = await supabase.from("focus_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", start.toISOString());
    setTodayCount(count ?? 0);
    const { data } = await supabase.from("focus_sessions").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(60);
    const days = new Set((data ?? []).map((d: any) => new Date(d.created_at).toDateString()));
    let s = 0; const cur = new Date();
    while (days.has(cur.toDateString())) { s++; cur.setDate(cur.getDate() - 1); }
    setStreak(s);
  };
  useEffect(() => { loadStats(); }, [user]);

  const setModePreset = (m: Mode) => {
    setMode(m); setRunning(false);
    if (m === "pomodoro") { setSeconds(25 * 60); setTarget(25 * 60); }
    if (m === "countdown") { setSeconds(10 * 60); setTarget(10 * 60); }
    if (m === "stopwatch") { setSeconds(0); setTarget(0); }
  };

  const addTask = () => { if (!taskInput.trim()) return; setTasks((t) => [...t, { id: crypto.randomUUID(), text: taskInput, done: false }]); setTaskInput(""); };


  const m = Math.floor(seconds / 60), s = seconds % 60;
  const progress = target > 0 ? Math.min(1, (target - seconds) / target) : (mode === "stopwatch" ? 1 : 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="text-4xl font-semibold tracking-tight">Focus</h1>
      <p className="mt-2 text-muted-foreground">Quiet timers and a clean checklist.</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card-gradient border border-border/60 rounded-3xl p-8 shadow-soft text-center">
          <div className="inline-flex p-1 rounded-2xl bg-muted/60 text-sm">
            {(["pomodoro", "stopwatch", "countdown"] as Mode[]).map((x) => (
              <button key={x} onClick={() => setModePreset(x)} className={`px-4 h-9 rounded-xl transition-soft capitalize ${mode === x ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{x}</button>
            ))}
          </div>

          <div className="mt-10 relative size-64 mx-auto">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
              <motion.circle cx="50" cy="50" r="46" fill="none" stroke="url(#g)" strokeWidth="3" strokeLinecap="round"
                style={{ pathLength: progress }} initial={false} />
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0%" stopColor="oklch(0.66 0.16 295)" />
                  <stop offset="100%" stopColor="oklch(0.74 0.12 340)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="text-5xl font-semibold tracking-tight tabular-nums">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</div>
                <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{mode}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <button onClick={() => setRunning((r) => !r)} className="h-12 px-7 rounded-2xl bg-primary-gradient text-primary-foreground font-medium shadow-glow inline-flex items-center gap-2 hover:opacity-90 transition-soft">
              {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
            </button>
            <button onClick={() => { setRunning(false); setModePreset(mode); }} className="size-12 rounded-2xl bg-muted hover:bg-muted/80 grid place-items-center transition-soft"><RotateCcw className="size-4" /></button>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-sm">
            <div><div className="text-2xl font-semibold">{todayCount}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Today</div></div>
            <div><div className="text-2xl font-semibold">{streak}</div><div className="text-xs text-muted-foreground uppercase tracking-wider">Day streak</div></div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card-gradient border border-border/60 rounded-3xl p-5 shadow-soft">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tasks</h3>
            <div className="mt-3 flex gap-2">
              <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Add a task" className="flex-1 h-10 px-3 rounded-xl bg-input/60 border border-border text-sm focus:outline-none" />
              <button onClick={addTask} className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center hover:bg-primary/20 transition-soft"><Plus className="size-4" /></button>
            </div>
            <ul className="mt-3 space-y-1">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/60 transition-soft">
                  <input type="checkbox" checked={t.done} onChange={(e) => setTasks((ts) => ts.map((x) => x.id === t.id ? { ...x, done: e.target.checked } : x))} className="size-4 accent-[oklch(0.62_0.14_285)]" />
                  <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.text}</span>
                  <button onClick={() => setTasks((ts) => ts.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-destructive transition-soft"><Trash2 className="size-3.5" /></button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
