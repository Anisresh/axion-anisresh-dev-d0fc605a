import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export const PALETTES = [
  { id: "warm-cafe", label: "Warm Café", swatch: ["#f3e7d3", "#c08a4f", "#5a3a22"] },
  { id: "lavender",  label: "Lavender Mist", swatch: ["#efeaf7", "#8b6fd1", "#3a2d5e"] },
  { id: "sage",      label: "Sage Calm", swatch: ["#e7efe6", "#6b9c6f", "#2e4a32"] },
  { id: "ocean",     label: "Ocean Air", swatch: ["#e1eef7", "#3b86c2", "#1a3e5a"] },
  { id: "sunset",    label: "Sunset Peach", swatch: ["#fbe4d6", "#e07a4a", "#6a2818"] },
  { id: "rose",      label: "Rose Dust", swatch: ["#fbe4ea", "#d96a8d", "#5e1f33"] },
] as const;

export type PaletteId = typeof PALETTES[number]["id"];

export function applyPalette(palette: string, theme: string) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-palette", palette || "warm-cafe");
  // Dark warm café is the default. Add `.light` only when user opts into the cream theme.
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme !== "light");
}

export function usePaletteSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("palette, theme").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) applyPalette((data as any).palette ?? "warm-cafe", (data as any).theme ?? "light");
      });
  }, [user]);
}
