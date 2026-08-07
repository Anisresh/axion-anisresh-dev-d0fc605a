import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MessageCircle, UsersRound, Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mobile-only bottom navigation. Compact, 5 essentials, no Workspaces. */
const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/messages", label: "Chats", icon: MessageCircle },
  { to: "/xai", label: "AI", icon: Sparkles },
  { to: "/groups", label: "Lobby", icon: UsersRound },
  { to: "/settings", label: "You", icon: Settings },
] as const;

export function MobileBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-14 text-[10px] font-medium transition-soft tap",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center size-9 rounded-2xl transition-soft",
                    active ? "bg-primary/15" : "bg-transparent"
                  )}
                >
                  <Icon className="size-[19px]" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
