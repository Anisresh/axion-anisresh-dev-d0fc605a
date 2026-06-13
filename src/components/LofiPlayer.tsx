import { useRef, useState, useEffect } from "react";
import { Music, Play, Pause, SkipForward, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Curated free lofi loops (Pixabay CC0)
const TRACKS = [
  { title: "Coffee Shop Lofi",  url: "https://cdn.pixabay.com/audio/2024/02/01/audio_6f2c1cad8d.mp3" },
  { title: "Rainy Window",      url: "https://cdn.pixabay.com/audio/2023/03/22/audio_4cb83c5b8b.mp3" },
  { title: "Midnight Café",     url: "https://cdn.pixabay.com/audio/2022/03/24/audio_0625c1539c.mp3" },
  { title: "Slow Mornings",     url: "https://cdn.pixabay.com/audio/2024/04/16/audio_d5b3d2b25a.mp3" },
];

export function LofiPlayer() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = vol;
    a.loop = true;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, idx, vol]);

  const skip = () => setIdx((i) => (i + 1) % TRACKS.length);
  const track = TRACKS[idx];

  return (
    <>
      <audio ref={audioRef} src={track.url} preload="none" />
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Lo-fi player"
        className="fixed bottom-5 right-5 z-50 size-12 rounded-full bg-primary-gradient text-primary-foreground grid place-items-center shadow-glow tap hover:scale-105 transition-soft"
      >
        <Music className={`size-5 ${playing ? "animate-pulse-dot" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-20 right-5 z-50 w-72 glass-strong rounded-3xl border border-border/60 shadow-elevated p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lo-fi</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${playing ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {playing ? "Playing" : "Paused"}
              </span>
            </div>
            <h4 className="mt-2 text-sm font-medium tracking-tight truncate">{track.title}</h4>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => setPlaying((p) => !p)} className="size-10 rounded-2xl bg-primary-gradient text-primary-foreground grid place-items-center shadow-glow tap">
                {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
              </button>
              <button onClick={skip} className="size-10 rounded-2xl bg-muted hover:bg-muted/80 grid place-items-center tap transition-soft">
                <SkipForward className="size-4" />
              </button>
              <div className="flex-1 flex items-center gap-2 pl-2">
                <Volume2 className="size-4 text-muted-foreground" />
                <input type="range" min={0} max={1} step={0.05} value={vol}
                  onChange={(e) => setVol(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-primary)]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
