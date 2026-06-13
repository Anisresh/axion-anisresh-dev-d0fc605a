import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SYSTEM_PROMPT = "You are XAI, the calm and thoughtful AI companion of Axion6 — a premium messaging, focus, and learning app. Be warm, concise, and helpful. Use markdown when useful. Decline harmful requests politely.";

async function callGateway(messages: { role: string; content: string }[], system = SYSTEM_PROMPT, model = "google/gemini-3-flash-preview") {
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

export const xaiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string | null; userMessage: string; mode?: "fast" | "reasoning" }) =>
    z.object({ conversationId: z.string().uuid().nullable(), userMessage: z.string().min(1).max(8000), mode: z.enum(["fast", "reasoning"]).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let convId = data.conversationId;
    if (!convId) {
      const title = data.userMessage.slice(0, 50);
      const { data: conv, error } = await supabase.from("ai_conversations").insert({ user_id: userId, title }).select().single();
      if (error || !conv) throw new Error("Could not create conversation");
      convId = conv.id;
    }
    // load history
    const { data: history } = await supabase.from("ai_messages").select("role, content").eq("conversation_id", convId).order("created_at");
    const messages = [...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })), { role: "user", content: data.userMessage }];
    // store user msg
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "user", content: data.userMessage });
    const model = data.mode === "reasoning" ? "google/gemini-3-pro-preview" : "google/gemini-3-flash-preview";
    const system = data.mode === "reasoning"
      ? SYSTEM_PROMPT + " Think carefully step-by-step before answering. Show clear reasoning when it helps."
      : SYSTEM_PROMPT;
    const reply = await callGateway(messages, system, model);
    if (!reply) throw new Error("No reply from XAI");
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content: reply });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    return { conversationId: convId, reply };
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
