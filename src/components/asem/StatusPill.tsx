import type { PackageStatus } from "@/lib/asem";

const styles: Record<PackageStatus, string> = {
  ACTIVE: "bg-success/15 text-success border-success/30",
  "LOW SESSIONS": "bg-warning/15 text-warning border-warning/30",
  EXPIRED: "bg-primary/15 text-primary border-primary/40",
  COMPLETED: "bg-primary/15 text-primary border-primary/40",
  "NO PACKAGE": "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status, large }: { status: PackageStatus; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-widest ${styles[status]} ${
        large ? "px-4 py-1.5 text-sm" : "px-2.5 py-1 text-[0.65rem]"
      }`}
    >
      {status}
    </span>
  );
}
