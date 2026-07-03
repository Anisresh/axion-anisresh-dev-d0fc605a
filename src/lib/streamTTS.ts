import { createParser } from "eventsource-parser";
import { supabase } from "@/integrations/supabase/client";

let currentCtx: AudioContext | null = null;
let currentAbort: AbortController | null = null;

export function stopSpeaking() {
  currentAbort?.abort();
  currentAbort = null;
  if (currentCtx) {
    currentCtx.close().catch(() => {});
    currentCtx = null;
  }
}

export async function streamSpeak(text: string, voice = "alloy"): Promise<void> {
  stopSpeaking();
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const ctx = new AudioContext({ sampleRate: 24000 });
  currentCtx = ctx;
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  let playhead = 0;
  let pending = new Uint8Array(0);

  const playChunk = (incoming: Uint8Array) => {
    const bytes = new Uint8Array(pending.length + incoming.length);
    bytes.set(pending);
    bytes.set(incoming, pending.length);
    const usable = bytes.length - (bytes.length % 2);
    pending = bytes.slice(usable);
    if (usable === 0) return;
    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = Float32Array.from(samples, (s) => s / 32768);
    const buffer = ctx.createBuffer(1, floats.length, 24000);
    buffer.copyToChannel(floats, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    if (playhead === 0) playhead = ctx.currentTime + 0.05;
    else playhead = Math.max(playhead, ctx.currentTime);
    source.start(playhead);
    playhead += buffer.duration;
  };

  const abort = new AbortController();
  currentAbort = abort;
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, voice }),
    signal: abort.signal,
  });
  if (!res.ok || !res.body) throw new Error(`TTS failed: ${res.status}`);

  const parser = createParser({
    onEvent(event) {
      let payload: { type: string; audio?: string };
      try { payload = JSON.parse(event.data); } catch { return; }
      if (payload.type !== "speech.audio.delta" || !payload.audio) return;
      const binary = atob(payload.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      playChunk(bytes);
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}
