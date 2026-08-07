import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MiniSidebar } from "@/components/MiniSidebar";
import { MobileBar } from "@/components/MobileBar";
import { Footer } from "@/components/Footer";

import { GlobalPlayerProvider } from "@/components/GlobalPlayer";
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
    <GlobalPlayerProvider>
      <div className="min-h-screen flex bg-background">
        <MiniSidebar />
        <TopBar />
        <div className="flex-1 md:ml-[92px] flex flex-col min-h-screen">
          <main className="flex-1 pt-16 pb-20 md:pb-0">
            <Outlet />
          </main>
          <Footer />
        </div>

      </div>
      <MobileBar />
    </GlobalPlayerProvider>
  );
}
