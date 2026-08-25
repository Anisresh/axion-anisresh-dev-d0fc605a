// Free AI providers — no Lovable credits are consumed by anything in this file.
//
// Routing:
//   - attachments (images / PDFs) -> Google Gemini free tier (GEMINI_API_KEY)
//   - plain text                  -> Groq free tier (GROQ_API_KEY), very fast
//   - no keys configured          -> Pollinations (keyless, free, rate-limited)

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export type ChatMessage = { role: string; content: string | ContentPart[] };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

export const GROQ_FAST = "llama-3.3-70b-versatile";
export const GROQ_SMART = "llama-3.3-70b-versatile";
export const GEMINI_FAST = "gemini-2.0-flash";
export const GEMINI_SMART = "gemini-2.0-flash";

function hasAttachments(messages: ChatMessage[]) {
  return messages.some((m) => Array.isArray(m.content) && m.content.some((p) => p.type !== "text"));
}

/** Gemini's OpenAI-compatible layer takes image_url but not the `file` part; inline PDFs as image_url data URLs. */
function normalizeForGemini(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    return {
      role: m.role,
      content: m.content.map((p) =>
        p.type === "file"
          ? ({ type: "image_url", image_url: { url: p.file.file_data } } as ContentPart)
          : p,
      ),
    };
  });
}

/** Providers other than Gemini get text only. */
function flatten(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    const text = m.content.filter((p) => p.type === "text").map((p) => (p as any).text).join("\n");
    const extras = m.content.length - m.content.filter((p) => p.type === "text").length;
    return { role: m.role, content: extras ? `${text}\n\n(${extras} attachment(s) omitted)` : text };
  });
}

async function post(url: string, key: string | undefined, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(
      res.status === 429
        ? "XAI is catching its breath — try again in a moment."
        : `AI error ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
    (err as any).status = res.status;
    throw err;
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content as string | undefined;
}

export async function freeChat(
  messages: ChatMessage[],
  system: string,
  opts: { smart?: boolean } = {},
): Promise<string | undefined> {
  const groq = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;
  const withSystem = (msgs: ChatMessage[]): ChatMessage[] => [{ role: "system", content: system }, ...msgs];

  const attach = hasAttachments(messages);

  // Files / images always need Gemini.
  if (attach && gemini) {
    return post(GEMINI_URL, gemini, {
      model: opts.smart ? GEMINI_SMART : GEMINI_FAST,
      messages: withSystem(normalizeForGemini(messages)),
    });
  }

  const plain = withSystem(flatten(messages));

  if (!attach && groq) {
    try {
      return await post(GROQ_URL, groq, {
        model: opts.smart ? GROQ_SMART : GROQ_FAST,
        messages: plain,
        temperature: 0.7,
      });
    } catch (e) {
      if (!gemini) throw e;
    }
  }

  if (gemini) {
    return post(GEMINI_URL, gemini, {
      model: opts.smart ? GEMINI_SMART : GEMINI_FAST,
      messages: attach ? withSystem(normalizeForGemini(messages)) : plain,
    });
  }

  // Keyless fallback — always available, no credits, no signup.
  return post(POLLINATIONS_URL, undefined, {
    model: "openai",
    messages: plain,
  });
}

/** Keyless, unlimited image generation via Pollinations. Returns a plain URL. */
export function freeImageUrl(prompt: string, opts: { width?: number; height?: number } = {}) {
  const seed = Math.floor(Math.random() * 1_000_000);
  const q = new URLSearchParams({
    width: String(opts.width ?? 1024),
    height: String(opts.height ?? 1024),
    seed: String(seed),
    nologo: "true",
    model: "flux",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q.toString()}`;
}
