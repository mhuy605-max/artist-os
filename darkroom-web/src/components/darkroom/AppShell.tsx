import { Link, useLocation } from "@tanstack/react-router";
import { CalendarDays, LayoutDashboard, Menu, Music2, Settings, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/darkroom/Logo";
import { cn } from "@/lib/utils";

const primaryNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/songs", label: "Songs", icon: Music2 },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/team", label: "Team", icon: Users },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <aside className="flex h-full flex-col border-r border-border bg-sidebar">
      <div className="border-b border-border p-5">
        <Link to="/dashboard" onClick={onNavigate} className="block w-36">
          <Logo />
        </Link>
        <p className="mt-4 label-tech">Creative operations</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.to ||
            (item.to === "/songs" && location.pathname.startsWith("/songs/"));

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors",
                "hover:border-border hover:bg-panel hover:text-foreground",
                active && "border-border-strong bg-panel-strong text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors",
            "hover:border-border hover:bg-panel hover:text-foreground",
            location.pathname === "/settings" &&
              "border-border-strong bg-panel-strong text-foreground",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="border border-border bg-background p-3">
          <p className="text-sm font-medium">Vera Sol</p>
          <p className="mt-1 text-xs text-muted-foreground">Owner profile</p>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-72">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[86vw] bg-sidebar">
            <div className="absolute right-3 top-3 z-10">
              <Button size="icon" variant="ghost" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link to="/dashboard" className="block w-32">
          <Logo />
        </Link>
        <Button
          size="icon"
          variant="outline"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </header>

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
