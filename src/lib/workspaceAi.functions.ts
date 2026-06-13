import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const workspaceAiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; userMessage: string }) =>
    z.object({ workspaceId: z.string().uuid(), userMessage: z.string().min(1).max(8000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase.from("workspace_members").select("id").eq("workspace_id", data.workspaceId).eq("user_id", userId).maybeSingle();
    if (!member) throw new Error("Not a workspace member");

    // Pull workspace context
    const [ws, files, events, tasks, notes, bdays, polls, expenses, members, history] = await Promise.all([
      supabase.from("workspaces").select("name,description,type").eq("id", data.workspaceId).maybeSingle(),
      supabase.from("workspace_files").select("name,mime,size,created_at").eq("workspace_id", data.workspaceId).order("created_at", { ascending: false }).limit(30),
      supabase.from("workspace_events").select("title,description,starts_at,meet_url").eq("workspace_id", data.workspaceId).order("starts_at").limit(30),
      supabase.from("workspace_tasks").select("title,description,status,due_at").eq("workspace_id", data.workspaceId).order("created_at", { ascending: false }).limit(50),
      supabase.from("workspace_notes").select("title,content,updated_at").eq("workspace_id", data.workspaceId).order("updated_at", { ascending: false }).limit(20),
      supabase.from("workspace_birthdays").select("person_name,month,day,note").eq("workspace_id", data.workspaceId),
      supabase.from("workspace_polls").select("question,options").eq("workspace_id", data.workspaceId).order("created_at", { ascending: false }).limit(10),
      supabase.from("workspace_expenses").select("title,amount,category,created_at").eq("workspace_id", data.workspaceId).order("created_at", { ascending: false }).limit(30),
      supabase.from("workspace_members").select("user_id,role").eq("workspace_id", data.workspaceId),
      supabase.from("workspace_ai_messages").select("role, content").eq("workspace_id", data.workspaceId).order("created_at").limit(30),
    ]);

    const ctx = {
      workspace: ws.data,
      members: members.data?.length ?? 0,
      files: files.data ?? [],
      events: events.data ?? [],
      tasks: tasks.data ?? [],
      notes: (notes.data ?? []).map((n: any) => ({ title: n.title, content: String(n.content).slice(0, 800) })),
      birthdays: bdays.data ?? [],
      polls: polls.data ?? [],
      expenses: expenses.data ?? [],
    };

    const SYSTEM = `You are the workspace AI assistant for Axion. Be concise, warm, and helpful. Use markdown.
You have access to this workspace's data below. Answer questions using it first; only fall back to general knowledge when the workspace data doesn't cover the question.

WORKSPACE CONTEXT (JSON):
${JSON.stringify(ctx, null, 2)}`;

    const messages = [
      { role: "system", content: SYSTEM },
      ...((history.data ?? []).map((m: any) => ({ role: m.role, content: m.content }))),
      { role: "user", content: data.userMessage },
    ];

    await supabase.from("workspace_ai_messages").insert({
      workspace_id: data.workspaceId, user_id: userId, role: "user", content: data.userMessage,
    });

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("AI is busy. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error: ${res.status}`);
    }
    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content as string | undefined;
    if (!reply) throw new Error("No reply from AI");

    await supabase.from("workspace_ai_messages").insert({
      workspace_id: data.workspaceId, user_id: userId, role: "assistant", content: reply,
    });

    return { reply };
  });
