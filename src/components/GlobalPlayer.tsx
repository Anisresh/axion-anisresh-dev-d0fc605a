import { createContext, useContext, useState, type ReactNode } from "react";
import { X, ChevronDown, ChevronUp, Music } from "lucide-react";

export type GlobalTrack = {
  id: string;
  title: string;
  kind: "spotify" | "youtube";
  embed: string;
};

type Ctx = {
  track: GlobalTrack | null;
  play: (t: GlobalTrack) => void;
  stop: () => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function useGlobalPlayer() {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error("useGlobalPlayer must be used inside <GlobalPlayerProvider>");
  return c;
}

export function GlobalPlayerProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<GlobalTrack | null>(null);
  const [expanded, setExpanded] = useState(true);

  const value: Ctx = {
    track,
    play: (t) => {
      setTrack(t);
      setExpanded(true);
    },
    stop: () => {
      setTrack(null);
    },
    expanded,
    setExpanded,
  };

  const videoHeight = track?.kind === "youtube" ? 220 : 160;

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      {track && (
        <div
          className="fixed bottom-5 left-5 z-50 glass-strong rounded-3xl border border-border/60 shadow-elevated overflow-hidden"
          style={{ width: 340 }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <Music className="size-4 text-primary shrink-0" />
              <span className="text-xs font-medium truncate">{track.title}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                {track.kind}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 rounded hover:bg-muted"
                aria-label={expanded ? "Hide video" : "Show video"}
                title={expanded ? "Hide video (audio keeps playing)" : "Show video"}
              >
                {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
              </button>
              <button
                onClick={value.stop}
                className="p-1 rounded hover:bg-muted text-destructive"
                aria-label="Stop"
                title="Stop"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          {/* iframe stays mounted to keep audio playing — wrapper just clips height */}
          <div
            className="overflow-hidden transition-[height] duration-300"
            style={{ height: expanded ? videoHeight : 0 }}
          >
            <iframe
              src={track.embed}
              width="100%"
              height={videoHeight}
              frameBorder="0"
              allow="encrypted-media; autoplay; clipboard-write; picture-in-picture"
              allowFullScreen
              title={track.title}
            />
          </div>
        </div>
      )}
    </PlayerCtx.Provider>
  );
}
