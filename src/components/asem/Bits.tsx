import type { ReactNode } from "react";
import { initials } from "@/lib/asem";

export function Avatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-24 w-24 text-3xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        className={`${dim} shrink-0 rounded-2xl border border-border object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} display flex shrink-0 items-center justify-center rounded-2xl border border-border bg-elevated text-foreground`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-elevated">
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const valueTone =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-success"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <div className="surface p-4">
      <p className="label-caps">{label}</p>
      <p className={`display mt-1 text-4xl ${valueTone}`}>{value}</p>
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="surface p-6 text-center text-sm text-muted-foreground">{children}</p>;
}
