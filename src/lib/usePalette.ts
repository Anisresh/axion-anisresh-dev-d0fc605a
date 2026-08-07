import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { applyBackground } from "@/lib/backgrounds";

/** FernCove theme engine — each theme is a full handcrafted palette, not a recolor. */
export const PALETTES = [
  { id: "fern",     label: "🌿 Fern",       dark: true,  swatch: ["#0F1411", "#9CBFA3", "#C69A6D"] },
  { id: "midnight", label: "🌙 Midnight",   dark: true,  swatch: ["#0C0D0C", "#87A388", "#B99A72"] },
  { id: "light",    label: "☀️ Light",      dark: false, swatch: ["#F6F3EC", "#4C6B52", "#B4855A"] },
  { id: "ocean",    label: "🌊 Ocean",      dark: true,  swatch: ["#0C1618", "#84BDB2", "#C2A177"] },
  { id: "autumn",   label: "🍂 Autumn",     dark: true,  swatch: ["#15100C", "#C98F55", "#9C6B4A"] },
  { id: "winter",   label: "❄️ Winter",     dark: false, swatch: ["#F3F6F7", "#5E7C8A", "#9FB3BC"] },
  { id: "blossom",  label: "🌸 Blossom",    dark: false, swatch: ["#FAF1F1", "#B9707F", "#C99AA0"] },
  { id: "mono",     label: "⚫ Monochrome", dark: false, swatch: ["#F4F4F2", "#3A3A38", "#8C8C88"] },
] as const;

export type PaletteId = typeof PALETTES[number]["id"];

const DARK_THEMES = new Set(PALETTES.filter((p) => p.dark).map((p) => p.id as string));

export function applyPalette(palette: string, _theme?: string) {
  if (typeof document === "undefined") return;
  const id = PALETTES.some((p) => p.id === palette) ? palette : "fern";
  const root = document.documentElement;
  root.setAttribute("data-palette", id);
  const isDark = DARK_THEMES.has(id);
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function usePaletteSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("palette, theme, background_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          applyPalette((data as any).palette ?? "fern", (data as any).theme);
          applyBackground((data as any).background_url ?? null);
        }
      });
  }, [user]);
}
