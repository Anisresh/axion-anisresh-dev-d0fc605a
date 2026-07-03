import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SYSTEM_PROMPT = "You are XAI, the calm, thoughtful, deeply capable AI companion inside Axion6 — a premium messaging, focus, and learning app. You are warm, curious, and genuinely helpful. You reason carefully, answer completely, use markdown when it helps, cite steps for complex work, and never invent facts. When the user attaches images, PDFs, or files, read them fully and refer to them naturally. Decline harmful requests politely.";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

type GwMessage = { role: string; content: string | ContentPart[] };

async function callGateway(messages: GwMessage[], system = SYSTEM_PROMPT, model = "google/gemini-3-pro-preview") {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI gateway not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("XAI is busy right now. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits in your workspace.");
    throw new Error(`AI error: ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content as string | undefined;
}

const AttachmentSchema = z.object({
  kind: z.enum(["image", "file"]),
  dataUrl: z.string().startsWith("data:").max(15_000_000),
  filename: z.string().max(200).optional(),
  mime: z.string().max(120).optional(),
});
type Attachment = z.infer<typeof AttachmentSchema>;

export const xaiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string | null; userMessage: string; mode?: "fast" | "reasoning"; attachments?: Attachment[] }) =>
    z.object({
      conversationId: z.string().uuid().nullable(),
      userMessage: z.string().min(1).max(8000),
      mode: z.enum(["fast", "reasoning"]).optional(),
      attachments: z.array(AttachmentSchema).max(6).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let convId = data.conversationId;
    if (!convId) {
      const title = data.userMessage.slice(0, 50);
      const { data: conv, error } = await supabase.from("ai_conversations").insert({ user_id: userId, title }).select().single();
      if (error || !conv) throw new Error("Could not create conversation");
      convId = conv.id;
    }
    const { data: history } = await supabase.from("ai_messages").select("role, content").eq("conversation_id", convId).order("created_at");
    // Build current-turn user content: text + multimodal parts
    const parts: ContentPart[] = [{ type: "text", text: data.userMessage }];
    for (const a of data.attachments ?? []) {
      if (a.kind === "image") parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
      else parts.push({ type: "file", file: { filename: a.filename ?? "file", file_data: a.dataUrl } });
    }
    const currentUser: GwMessage = { role: "user", content: parts.length > 1 ? parts : data.userMessage };
    const messages: GwMessage[] = [
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content as string })),
      currentUser,
    ];
    // store user msg (persist a note about attachments so it's visible in history)
    const attachNote = data.attachments?.length ? `\n\n_📎 ${data.attachments.length} attachment${data.attachments.length > 1 ? "s" : ""}_` : "";
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "user", content: data.userMessage + attachNote });
    const model = data.mode === "fast" ? "google/gemini-3-flash-preview" : "google/gemini-3-pro-preview";
    const system = data.mode === "reasoning"
      ? SYSTEM_PROMPT + " Think step-by-step carefully. Show clear reasoning when it helps."
      : SYSTEM_PROMPT;
    const reply = await callGateway(messages, system, model);
    if (!reply) throw new Error("No reply from XAI");
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content: reply });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    return { conversationId: convId, reply };
  });


export const xaiImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string | null; prompt: string }) =>
    z.object({ conversationId: z.string().uuid().nullable(), prompt: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    let convId = data.conversationId;
    if (!convId) {
      const title = `🎨 ${data.prompt.slice(0, 40)}`;
      const { data: conv, error } = await supabase.from("ai_conversations").insert({ user_id: userId, title }).select().single();
      if (error || !conv) throw new Error("Could not create conversation");
      convId = conv.id;
    }
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "user", content: `🎨 ${data.prompt}` });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: data.prompt,
        size: "1024x1024",
        quality: "low",
        n: 1,
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Image gen is busy. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits in your workspace.");
      throw new Error(`Image error: ${res.status}`);
    }
    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json as string | undefined;
    if (!b64) throw new Error("No image returned");
    const dataUrl = `data:image/png;base64,${b64}`;
    const content = `![image](${dataUrl})`;
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    return { conversationId: convId, dataUrl };
  });

export const learningGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; sourceText: string }) =>
    z.object({ title: z.string().min(1).max(200), sourceText: z.string().min(20).max(40000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prompt = `Based on the study material below, produce a JSON object with these exact keys:
- "summary": a clear 4–6 sentence revision summary
- "key_concepts": array of 5–10 strings (most important concepts)
- "flashcards": array of {"q","a"} objects (8–12 cards)
- "mcqs": array of {"q","options" (array of 4),"answer_index"} (5 questions)
- "short_answer": array of {"q","a"} (3 questions)
- "long_answer": array of {"q","a"} (2 questions)

Return ONLY valid JSON, no prose.

MATERIAL:
${data.sourceText}`;
    const raw = await callGateway([{ role: "user", content: prompt }], "You are XAI, an expert tutor. You output only valid JSON when asked.");
    let parsed: unknown = null;
    try {
      const match = raw?.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch { parsed = null; }
    const { data: session, error } = await supabase.from("learning_sessions").insert({
      user_id: userId, title: data.title, source_text: data.sourceText, output: parsed as any,
    }).select().single();
    if (error) throw new Error(error.message);
    return session;
  });
