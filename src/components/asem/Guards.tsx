import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "./AppShell";

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="display animate-pulse text-2xl text-primary">Loading…</p>
    </div>
  );
}

export function AdminPage({ title, children }: { title?: string; children: ReactNode }) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role === "client") void navigate({ to: "/home", replace: true });
  }, [loading, role, navigate]);

  if (loading || role !== "admin") return <Loader />;
  return <AppShell title={title}>{children}</AppShell>;
}

export function ClientPage({ title, children }: { title?: string; children: ReactNode }) {
  const { role, loading } = useAuth();
  if (loading || !role) return <Loader />;
  return <AppShell title={title}>{children}</AppShell>;
}
