import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { freeChat, freeImageUrl, type ChatMessage, type ContentPart } from "@/lib/freeai.server";
import {
  SYSTEM_PROMPT,
  VOICE_SUFFIX,
  REASONING_SUFFIX,
  ChatInputSchema,
  ImageInputSchema,
  LearningInputSchema,
  LEARNING_SYSTEM,
  learningPrompt,
  type Attachment,
} from "@/lib/xai.shared";

export const xaiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string | null; userMessage: string; mode?: "fast" | "reasoning" | "voice"; attachments?: Attachment[] }) =>
    ChatInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let convId = data.conversationId;
    if (!convId) {
      const title = data.userMessage.slice(0, 50);
      const { data: conv, error } = await supabase.from("ai_conversations").insert({ user_id: userId, title }).select().single();
      if (error || !conv) throw new Error("Could not create conversation");
      convId = conv.id;
    }
    const { data: history } = await supabase.from("ai_messages").select("role, content").eq("conversation_id", convId).order("created_at", { ascending: false }).limit(24);
    const recent = (history ?? []).reverse();
    const parts: ContentPart[] = [{ type: "text", text: data.userMessage }];
    for (const a of data.attachments ?? []) {
      if (a.kind === "image") parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
      else parts.push({ type: "file", file: { filename: a.filename ?? "file", file_data: a.dataUrl } });
    }
    const currentUser: ChatMessage = { role: "user", content: parts.length > 1 ? parts : data.userMessage };
    const messages: ChatMessage[] = [
      ...recent.map((m: any) => ({ role: m.role, content: m.content as string })),
      currentUser,
    ];
    const attachNote = data.attachments?.length ? `\n\n_📎 ${data.attachments.length} attachment${data.attachments.length > 1 ? "s" : ""}_` : "";
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "user", content: data.userMessage + attachNote });
    const system = data.mode === "reasoning"
      ? SYSTEM_PROMPT + REASONING_SUFFIX
      : data.mode === "voice"
        ? SYSTEM_PROMPT + VOICE_SUFFIX
        : SYSTEM_PROMPT;
    const reply = await freeChat(messages, system, { smart: data.mode === "reasoning" });
    if (!reply) throw new Error("No reply from XAI");
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content: reply });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    return { conversationId: convId, reply };
  });

export const xaiImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string | null; prompt: string }) => ImageInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let convId = data.conversationId;
    if (!convId) {
      const title = `🎨 ${data.prompt.slice(0, 40)}`;
      const { data: conv, error } = await supabase.from("ai_conversations").insert({ user_id: userId, title }).select().single();
      if (error || !conv) throw new Error("Could not create conversation");
      convId = conv.id;
    }
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "user", content: `🎨 ${data.prompt}` });

    // Keyless, unlimited, credit-free image generation.
    const imageUrl = freeImageUrl(data.prompt);
    const check = await fetch(imageUrl, { method: "GET" });
    if (!check.ok) throw new Error("Image generation is busy right now. Try again in a moment.");

    const content = `![${data.prompt.slice(0, 60)}](${imageUrl})`;
    await supabase.from("ai_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content });
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    return { conversationId: convId, dataUrl: imageUrl };
  });

export const learningGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; sourceText: string }) => LearningInputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const raw = await freeChat([{ role: "user", content: learningPrompt(data.sourceText) }], LEARNING_SYSTEM, { smart: true });
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
