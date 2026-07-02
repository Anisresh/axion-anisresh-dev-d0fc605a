import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { Save, Upload, Sun, Moon, Loader2, Palette, Check, Building2, ArrowRight, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { PALETTES, applyPalette } from "@/lib/usePalette";
import { BACKGROUNDS, applyBackground } from "@/lib/backgrounds";
import { Donate } from "@/components/Donate";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · Axion6" }] }),
  component: SettingsPage,
});

type Profile = { id: string; username: string; display_name: string; bio: string; avatar_url: string | null };
type Settings = { theme: string; palette: string; chat_density: string; font_size: string; animation_intensity: string; background_url: string | null };

function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Profile: load, and self-heal if missing (older accounts created before the signup trigger was attached)
      let { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!prof) {
        const fallback = (user.email ?? "friend").split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || "user";
        const username = `${fallback}${user.id.slice(0, 4)}`;
        await supabase.from("profiles").insert({ id: user.id, username, display_name: fallback });
        const r = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        prof = r.data;
      }
      setProfile(prof as Profile);

      // Settings: load, and self-heal if missing
      let { data: s } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (!s) {
        await supabase.from("user_settings").insert({ user_id: user.id });
        const r = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
        s = r.data;
      }
      setSettings(s as Settings);
    })();
  }, [user]);

  useEffect(() => {
    if (!settings) return;
    applyPalette(settings.palette ?? "warm-cafe", settings.theme ?? "light");
    applyBackground(settings.background_url);
  }, [settings?.theme, settings?.palette, settings?.background_url]);

  const saveProfile = async () => {
    if (!profile || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: profile.display_name, bio: profile.bio, avatar_url: profile.avatar_url }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const saveSettings = async (patch: Partial<Settings>) => {
    if (!user || !settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await supabase.from("user_settings").update(patch).eq("user_id", user.id);
    toast.success("Saved");
  };

  const onAvatar = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signed && profile) setProfile({ ...profile, avatar_url: signed.signedUrl });
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Make Axion6 yours.</p>
      </motion.div>

      <section className="mt-6 bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0"><Building2 className="size-5" /></div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
              <p className="text-sm text-muted-foreground">Teams, classes, friends, business — all in one place.</p>
            </div>
          </div>
          <Link to="/workspaces" className="h-10 px-4 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow inline-flex items-center gap-1.5 hover:opacity-90 transition-soft tap shrink-0">
            Open <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-6 bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        {profile ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-primary/15 text-primary grid place-items-center overflow-hidden">
                {profile.avatar_url ? <img src={profile.avatar_url} className="size-full object-cover" alt="" /> : <span className="text-xl font-semibold">{profile.display_name[0]?.toUpperCase()}</span>}
              </div>
              <label className="h-10 px-4 rounded-2xl bg-muted hover:bg-muted/80 inline-flex items-center gap-2 text-sm font-medium cursor-pointer transition-soft tap">
                <Upload className="size-4" /> Change
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])} />
              </label>
            </div>
            <Field label="Username">
              <input value={profile.username} disabled className="w-full h-11 px-4 rounded-2xl bg-muted/60 border border-border text-sm opacity-70" />
            </Field>
            <Field label="Display name">
              <input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="w-full h-11 px-4 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
            </Field>
            <Field label="Bio">
              <textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className="w-full p-3 rounded-2xl bg-input/60 border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
            </Field>
            <button onClick={saveProfile} disabled={saving} className="h-11 px-5 rounded-2xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow inline-flex items-center gap-2 hover:opacity-90 transition-soft tap disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save profile
            </button>
          </div>
        ) : <p className="text-sm text-muted-foreground mt-3">Loading…</p>}
      </section>

      {settings && (
        <>
          <section className="mt-6 bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2"><Palette className="size-5 text-primary" /> Color palette</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Switch the entire café mood. Changes apply instantly.</p>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PALETTES.map((p) => {
                const active = settings.palette === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => saveSettings({ palette: p.id })}
                    className={`relative p-4 rounded-2xl border-2 transition-soft tap text-left ${active ? "border-primary shadow-glow" : "border-border hover:border-primary/50"}`}
                  >
                    {active && <div className="absolute top-2 right-2 size-5 rounded-full bg-primary text-primary-foreground grid place-items-center"><Check className="size-3" /></div>}
                    <div className="flex gap-1.5 mb-3">
                      {p.swatch.map((c, i) => <div key={i} className="size-6 rounded-lg shadow-soft" style={{ background: c }} />)}
                    </div>
                    <div className="text-sm font-medium">{p.label}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-6 bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2"><ImageIcon className="size-5 text-primary" /> Background</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Pick a calm 4K scene. Cards turn frosted-glass automatically.</p>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {BACKGROUNDS.map((b) => {
                const active = (settings.background_url ?? "") === b.url;
                return (
                  <button
                    key={b.id}
                    onClick={() => saveSettings({ background_url: b.url || null } as any)}
                    className={`relative aspect-video rounded-2xl overflow-hidden border-2 transition-soft tap ${active ? "border-primary shadow-glow" : "border-border hover:border-primary/50"}`}
                    style={b.thumb ? { backgroundImage: `url("${b.thumb}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    {!b.thumb && <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground bg-muted/60">No background</div>}
                    {active && <div className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground grid place-items-center"><Check className="size-3.5" /></div>}
                    <div className="absolute bottom-0 inset-x-0 p-2 text-[11px] font-medium text-white bg-gradient-to-t from-black/70 to-transparent">{b.label}</div>
                  </button>
                );
              })}
            </div>
          </section>


          <section className="mt-6 bg-card-gradient border border-border/60 rounded-3xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
            <div className="mt-5 space-y-4">
              <Field label="Theme">
                <div className="inline-flex p-1 rounded-2xl bg-muted/60">
                  <button onClick={() => saveSettings({ theme: "light" })} className={`px-4 h-9 rounded-xl inline-flex items-center gap-2 text-sm transition-soft tap ${settings.theme === "light" ? "bg-card shadow-soft" : "text-muted-foreground"}`}><Sun className="size-4" /> Warm light</button>
                  <button onClick={() => saveSettings({ theme: "dark" })} className={`px-4 h-9 rounded-xl inline-flex items-center gap-2 text-sm transition-soft tap ${settings.theme === "dark" ? "bg-card shadow-soft" : "text-muted-foreground"}`}><Moon className="size-4" /> Cozy dark</button>
                </div>
              </Field>
              <Field label="Chat density">
                <select value={settings.chat_density} onChange={(e) => saveSettings({ chat_density: e.target.value })} className="h-10 px-3 rounded-xl bg-input/60 border border-border text-sm">
                  <option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="cozy">Cozy</option>
                </select>
              </Field>
              <Field label="Font size">
                <select value={settings.font_size} onChange={(e) => saveSettings({ font_size: e.target.value })} className="h-10 px-3 rounded-xl bg-input/60 border border-border text-sm">
                  <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
                </select>
              </Field>
              <Field label="Animation intensity">
                <select value={settings.animation_intensity} onChange={(e) => saveSettings({ animation_intensity: e.target.value })} className="h-10 px-3 rounded-xl bg-input/60 border border-border text-sm">
                  <option value="off">Off</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </Field>
            </div>
          </section>
        </>
      )}

      <section className="mt-6">
        <Donate compact />
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
