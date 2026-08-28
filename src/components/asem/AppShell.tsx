import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const adminNav = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/clients", icon: "👥", label: "Clients" },
  { to: "/attendance", icon: "📋", label: "Attendance" },
  { to: "/packages", icon: "📦", label: "Packages" },
  { to: "/alerts", icon: "⚠️", label: "Alerts" },
] as const;

const clientNav = [
  { to: "/home", icon: "🏠", label: "Home" },
  { to: "/my-package", icon: "🥊", label: "My Package" },
  { to: "/my-sessions", icon: "📋", label: "Sessions" },
  { to: "/profile", icon: "👤", label: "Profile" },
] as const;

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const { role, signOut, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = role === "admin" ? adminNav : clientNav;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to={role === "admin" ? "/dashboard" : "/home"} className="flex items-center gap-2">
            <span className="text-xl">🥊</span>
            <span className="display text-2xl">
              ASEM <span className="text-primary">MMA</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">{user?.email}</span>
            <button
              onClick={() => void signOut()}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
        {title ? (
          <div className="mx-auto max-w-5xl px-4 pb-3">
            <h1 className="text-3xl">{title}</h1>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-[0.65rem] font-semibold uppercase tracking-widest transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
