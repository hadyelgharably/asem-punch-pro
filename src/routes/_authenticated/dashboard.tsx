import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminPage } from "@/components/asem/Guards";
import { Avatar, Empty, ProgressBar, Section, StatCard } from "@/components/asem/Bits";
import { StatusPill } from "@/components/asem/StatusPill";
import { useAsemData } from "@/hooks/useAsemData";
import { useMarkPresent } from "@/lib/queries";
import { isToday, type ClientSummary } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Coach Dashboard — ASEM MMA" },
      { name: "description", content: "Track clients, sessions and package alerts at ASEM MMA." },
      { property: "og:title", content: "Coach Dashboard — ASEM MMA" },
      {
        property: "og:description",
        content: "Track clients, sessions and package alerts at ASEM MMA.",
      },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <AdminPage title="Coach Dashboard">
      <Dashboard />
    </AdminPage>
  );
}

function Dashboard() {
  const { summaries, attendance, stats, loading } = useAsemData();
  const markPresent = useMarkPresent();

  const attention = summaries
    .filter((s) => s.status !== "ACTIVE")
    .sort((a, b) => a.remainingSessions - b.remainingSessions);

  const attendedTodayIds = new Set(
    attendance.filter((a) => a.status === "Attended" && isToday(a.occurred_at)).map((a) => a.client_id),
  );

  const trainable = summaries.filter(
    (s) => s.status === "ACTIVE" || s.status === "LOW SESSIONS",
  );

  const onMark = (summary: ClientSummary) => {
    markPresent.mutate(summary, {
      onSuccess: () => toast.success(`${summary.client.full_name} marked present ✓`),
      onError: (error: Error) => toast.error(error.message),
    });
  };

  if (loading) return <Empty>Loading gym data…</Empty>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Clients" value={stats.totalClients} />
        <StatCard label="Active Clients" value={stats.activeClients} tone="success" />
        <StatCard label="Sessions Today" value={stats.sessionsToday} tone="primary" />
        <StatCard label="Low Sessions" value={stats.lowSessionClients} tone="warning" />
        <StatCard label="Expired / Done" value={stats.expiredClients} tone="primary" />
      </div>

      <Section
        title="⚠️ Attention Required"
        action={
          <Link to="/alerts" className="label-caps text-primary">
            View all
          </Link>
        }
      >
        {attention.length === 0 ? (
          <Empty>Everyone is in good shape. 🥊</Empty>
        ) : (
          <div className="space-y-2">
            {attention.slice(0, 5).map((s) => (
              <Link
                key={s.client.id}
                to="/clients/$id"
                params={{ id: s.client.id }}
                className="surface flex items-center gap-3 p-3"
              >
                <Avatar name={s.client.full_name} photoUrl={s.client.photo_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.client.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.client.client_code} · {s.remainingSessions} left
                  </p>
                </div>
                <StatusPill status={s.status} />
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Today's Training">
        {trainable.length === 0 ? (
          <Empty>No clients with an active package.</Empty>
        ) : (
          <div className="space-y-3">
            {trainable.map((s) => {
              const done = attendedTodayIds.has(s.client.id);
              return (
                <div key={s.client.id} className="surface space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.client.full_name} photoUrl={s.client.photo_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold">{s.client.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.client.client_code} · {s.packageName}
                      </p>
                    </div>
                    <StatusPill status={s.status} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {s.usedSessions}/{s.totalSessions} used
                      </span>
                      <span>{s.remainingSessions} remaining</span>
                    </div>
                    <ProgressBar value={s.progress} />
                  </div>
                  <button
                    disabled={done || markPresent.isPending}
                    onClick={() => onMark(s)}
                    className={`display w-full rounded-xl py-4 text-2xl tracking-wide transition-colors ${
                      done
                        ? "border border-border bg-elevated text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {done ? "✓ Present today" : "✓ Mark Present"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
