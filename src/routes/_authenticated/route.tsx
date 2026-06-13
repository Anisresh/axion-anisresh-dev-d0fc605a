import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MiniSidebar } from "@/components/MiniSidebar";
import { Footer } from "@/components/Footer";
import { LofiPlayer } from "@/components/LofiPlayer";
import { TopBar } from "@/components/TopBar";
import { usePaletteSync } from "@/lib/usePalette";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  usePaletteSync();
  return (
    <div className="min-h-screen flex bg-background">
      <MiniSidebar />
      <TopBar />
      <div className="flex-1 ml-[92px] flex flex-col min-h-screen">
        <main className="flex-1 pt-16">
          <Outlet />
        </main>
        <Footer />
      </div>
      <LofiPlayer />
    </div>
  );
}
