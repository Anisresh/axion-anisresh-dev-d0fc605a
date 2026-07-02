import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { applyBackground } from "@/lib/backgrounds";

export const PALETTES = [
  { id: "warm-cafe", label: "Warm Café",     swatch: ["#f3e7d3", "#c08a4f", "#5a3a22"] },
  { id: "lavender",  label: "Lavender Mist", swatch: ["#efeaf7", "#8b6fd1", "#3a2d5e"] },
  { id: "sage",      label: "Sage Calm",     swatch: ["#e7efe6", "#6b9c6f", "#2e4a32"] },
  { id: "ocean",     label: "Ocean Air",     swatch: ["#e1eef7", "#3b86c2", "#1a3e5a"] },
  { id: "sunset",    label: "Sunset Peach",  swatch: ["#fbe4d6", "#e07a4a", "#6a2818"] },
  { id: "rose",      label: "Rose Dust",     swatch: ["#fbe4ea", "#d96a8d", "#5e1f33"] },
  { id: "forest",    label: "Forest Pine",   swatch: ["#e2ecdd", "#4b7a4d", "#1f3822"] },
  { id: "midnight",  label: "Midnight Ink",  swatch: ["#dfe4ee", "#4c68b0", "#161b2e"] },
  { id: "coral",     label: "Coral Reef",    swatch: ["#ffe1d6", "#ff6f61", "#5a1f18"] },
  { id: "mint",      label: "Fresh Mint",    swatch: ["#dcf4e8", "#3fb08c", "#173f32"] },
  { id: "amber",     label: "Warm Amber",    swatch: ["#fbe6c2", "#d68a2b", "#4a2b0b"] },
  { id: "violet",    label: "Deep Violet",   swatch: ["#e7dcf8", "#7239c9", "#2a134e"] },
] as const;

export type PaletteId = typeof PALETTES[number]["id"];

export function applyPalette(palette: string, theme: string) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-palette", palette || "warm-cafe");
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme !== "light");
}

export function usePaletteSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("palette, theme, background_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          applyPalette((data as any).palette ?? "warm-cafe", (data as any).theme ?? "light");
          applyBackground((data as any).background_url ?? null);
        }
      });
  }, [user]);
}
