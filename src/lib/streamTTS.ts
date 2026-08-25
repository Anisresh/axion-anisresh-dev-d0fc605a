// Free, unlimited, offline text-to-speech using the browser's built-in
// speechSynthesis engine. No API keys, no credits, no network calls.

let currentUtterance: SpeechSynthesisUtterance | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer natural-sounding local English voices.
  const preferred = [
    /google (uk|us) english/i,
    /samantha/i,
    /natural/i,
    /neural/i,
    /daniel/i,
    /karen/i,
  ];
  for (const re of preferred) {
    const hit = voices.find((v) => re.test(v.name) && v.lang.startsWith("en"));
    if (hit) return hit;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

export function stopSpeaking() {
  currentUtterance = null;
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** Strips markdown so speech sounds natural. */
function clean(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function speechSupported() {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

export async function streamSpeak(text: string, _voice?: string): Promise<void> {
  if (!speechSupported()) throw new Error("Speech is not supported in this browser");
  stopSpeaking();

  const spoken = clean(text).slice(0, 4000);
  if (!spoken) return;

  // Voice list can load asynchronously on first use.
  if (!window.speechSynthesis.getVoices().length) {
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 600);
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        () => { clearTimeout(t); resolve(); },
        { once: true },
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const u = new SpeechSynthesisUtterance(spoken);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    u.rate = 1.05;
    u.pitch = 1;
    u.volume = 1;
    u.onend = () => { if (currentUtterance === u) currentUtterance = null; resolve(); };
    u.onerror = (e) => {
      if (currentUtterance === u) currentUtterance = null;
      if ((e as SpeechSynthesisErrorEvent).error === "interrupted" || (e as SpeechSynthesisErrorEvent).error === "canceled") resolve();
      else reject(new Error("Speech failed"));
    };
    currentUtterance = u;
    window.speechSynthesis.speak(u);
  });
}
