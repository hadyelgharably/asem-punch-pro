import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientPage } from "@/components/asem/Guards";
import { Avatar, Empty, ProgressBar, Section, StatCard } from "@/components/asem/Bits";
import { StatusPill } from "@/components/asem/StatusPill";
import { useMySummary, useAsemData } from "@/hooks/useAsemData";
import { alertFor, formatDate, formatDateTime } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "My Training — ASEM MMA" },
      { name: "description", content: "Your ASEM MMA package, sessions remaining and progress." },
      { property: "og:title", content: "My Training — ASEM MMA" },
      {
        property: "og:description",
        content: "Your ASEM MMA package, sessions remaining and progress.",
      },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <ClientPage title="My Training">
      <Home />
    </ClientPage>
  );
}

function Home() {
  const { summary, loading } = useMySummary();
  const { attendance } = useAsemData();

  if (loading) return <Empty>Loading your training…</Empty>;
  if (!summary) return <Empty>No client record is linked to your account yet.</Empty>;

  const alert = alertFor(summary.status);
  const recent = attendance
    .filter((a) => a.client_id === summary.client.id)
    .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="surface flex items-center gap-4 p-5">
        <Avatar name={summary.client.full_name} photoUrl={summary.client.photo_url} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl">{summary.client.full_name}</h2>
          <p className="text-xs text-muted-foreground">{summary.client.client_code}</p>
        </div>
        <StatusPill status={summary.status} />
      </div>

      {alert ? (
        <p className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
          {alert}
        </p>
      ) : null}

      <div className="surface space-y-4 p-5 text-center">
        <p className="label-caps">Sessions Remaining</p>
        <p className="display text-7xl text-primary">{summary.remainingSessions}</p>
        <ProgressBar value={summary.progress} />
        <p className="text-xs text-muted-foreground">
          {summary.usedSessions} of {summary.totalSessions} used · {summary.progress}% complete
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Package" value={summary.packageName} />
        <StatCard
          label="Days Left"
          value={Math.max(0, summary.daysRemaining)}
          tone={summary.daysRemaining <= 5 ? "warning" : "default"}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Valid {formatDate(summary.subscription?.start_date)} →{" "}
        {formatDate(summary.subscription?.end_date)}
      </p>

      <Section
        title="Recent Sessions"
        action={
          <Link to="/my-sessions" className="label-caps text-primary">
            View all
          </Link>
        }
      >
        {recent.length === 0 ? (
          <Empty>No sessions recorded yet. 🥊</Empty>
        ) : (
          <div className="space-y-2">
            {recent.map((a) => {
              const { date, time } = formatDateTime(a.occurred_at);
              return (
                <div key={a.id} className="surface flex items-center justify-between p-3">
                  <p className="font-semibold">{date}</p>
                  <p className="text-xs text-muted-foreground">
                    {time} · {a.status}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
