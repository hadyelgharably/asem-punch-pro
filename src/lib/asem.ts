export type ClientRow = {
  id: string;
  client_code: string;
  full_name: string;
  user_email: string;
  phone: string | null;
  photo_url: string | null;
  notes: string | null;
  join_date: string;
  current_subscription_id: string | null;
};

export type PackageRow = {
  id: string;
  package_name: string;
  total_sessions: number;
  duration_days: number;
  price: number;
  active: boolean;
  description: string | null;
};

export type SubscriptionRow = {
  id: string;
  client_id: string;
  package_id: string | null;
  start_date: string;
  end_date: string;
  total_sessions: number;
  status: string;
};

export type AttendanceRow = {
  id: string;
  client_id: string;
  subscription_id: string | null;
  client_email: string;
  occurred_at: string;
  status: string;
  notes: string | null;
};

export type PackageStatus = "ACTIVE" | "LOW SESSIONS" | "EXPIRED" | "COMPLETED" | "NO PACKAGE";

export type ClientSummary = {
  client: ClientRow;
  subscription: SubscriptionRow | null;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  progress: number;
  daysRemaining: number;
  status: PackageStatus;
};

const MS_PER_DAY = 86_400_000;

export function toDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

export function daysBetweenToday(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toDateOnly(endDate).getTime() - today.getTime()) / MS_PER_DAY);
}

export function computeStatus(
  remaining: number,
  endDate: string | null,
  hasSubscription: boolean,
): PackageStatus {
  if (!hasSubscription || !endDate) return "NO PACKAGE";
  if (remaining <= 0) return "COMPLETED";
  if (daysBetweenToday(endDate) < 0) return "EXPIRED";
  if (remaining <= 3) return "LOW SESSIONS";
  return "ACTIVE";
}

export function buildSummary(
  client: ClientRow,
  subscriptions: SubscriptionRow[],
  attendance: AttendanceRow[],
  packages: PackageRow[],
): ClientSummary {
  const subscription =
    subscriptions.find((s) => s.id === client.current_subscription_id) ?? null;

  const used = subscription
    ? attendance.filter(
        (a) =>
          a.client_id === client.id &&
          a.subscription_id === subscription.id &&
          a.status === "Attended",
      ).length
    : 0;

  const total = subscription?.total_sessions ?? 0;
  const remaining = Math.max(0, total - used);
  const pkg = packages.find((p) => p.id === subscription?.package_id);

  return {
    client,
    subscription,
    packageName: pkg?.package_name ?? (subscription ? `${total} Sessions` : "No package"),
    totalSessions: total,
    usedSessions: used,
    remainingSessions: remaining,
    progress: total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0,
    daysRemaining: subscription ? daysBetweenToday(subscription.end_date) : 0,
    status: computeStatus(remaining, subscription?.end_date ?? null, Boolean(subscription)),
  };
}

export function alertFor(status: PackageStatus): string | null {
  if (status === "LOW SESSIONS")
    return "🔥 You have 3 or fewer sessions remaining. Contact Coach Asem to renew.";
  if (status === "COMPLETED") return "⚠️ Your package is finished. Contact Coach Asem to renew.";
  if (status === "EXPIRED") return "⚠️ Your subscription has expired. Contact Coach Asem.";
  if (status === "NO PACKAGE") return "⚠️ You have no active package. Contact Coach Asem.";
  return null;
}

export function statusDot(status: PackageStatus): string {
  if (status === "ACTIVE") return "🟢";
  if (status === "LOW SESSIONS") return "🟠";
  return "🔴";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return toDateOnly(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string): { date: string; time: string } {
  const d = new Date(value);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function isToday(value: string): boolean {
  const d = new Date(value);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function addDays(dateISO: string, days: number): string {
  const d = toDateOnly(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
