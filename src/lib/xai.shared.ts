import { z } from "zod";

export const SYSTEM_PROMPT =
  "You are XAI — the calm, warm, deeply thoughtful companion inside FernCove, a cozy café-inspired workspace. Speak like a trusted friend sipping coffee across the table: gentle, unhurried, precise. Keep replies compact by default (2–5 sentences); expand only when the task truly needs it. Use markdown sparingly and only when it aids clarity. Reason carefully, answer completely, never invent facts, and when the user attaches images, PDFs, or files read them fully and refer to them naturally. In voice conversations, favor short, natural spoken phrases with no markdown, no lists, no code fences. Decline harmful requests politely.";

export const VOICE_SUFFIX =
  " This is a live voice conversation. Reply in 1–3 short spoken sentences. No markdown, no lists, no code.";

export const REASONING_SUFFIX =
  " Take a breath and think step-by-step. Show clear reasoning when it truly helps.";

export const AttachmentSchema = z.object({
  kind: z.enum(["image", "file"]),
  dataUrl: z.string().startsWith("data:").max(15_000_000),
  filename: z.string().max(200).optional(),
  mime: z.string().max(120).optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

export const ChatInputSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  userMessage: z.string().min(1).max(8000),
  mode: z.enum(["fast", "reasoning", "voice"]).optional(),
  attachments: z.array(AttachmentSchema).max(6).optional(),
});

export const ImageInputSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  prompt: z.string().min(1).max(2000),
});

export const LearningInputSchema = z.object({
  title: z.string().min(1).max(200),
  sourceText: z.string().min(20).max(40000),
});

export const LEARNING_SYSTEM = "You are XAI, an expert tutor. You output only valid JSON when asked.";

export function learningPrompt(sourceText: string) {
  return `Based on the study material below, produce a JSON object with these exact keys:
- "summary": a clear 4–6 sentence revision summary
- "key_concepts": array of 5–10 strings (most important concepts)
- "flashcards": array of {"q","a"} objects (8–12 cards)
- "mcqs": array of {"q","options" (array of 4),"answer_index"} (5 questions)
- "short_answer": array of {"q","a"} (3 questions)
- "long_answer": array of {"q","a"} (2 questions)

Return ONLY valid JSON, no prose.

MATERIAL:
${sourceText}`;
}
