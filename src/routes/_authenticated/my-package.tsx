import { createFileRoute } from "@tanstack/react-router";
import { ClientPage } from "@/components/asem/Guards";
import { Empty, ProgressBar, Section, StatCard } from "@/components/asem/Bits";
import { StatusPill } from "@/components/asem/StatusPill";
import { useAsemData, useMySummary } from "@/hooks/useAsemData";
import { alertFor, formatDate } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/my-package")({
  head: () => ({
    meta: [
      { title: "My Package — ASEM MMA" },
      { name: "description", content: "Your current ASEM MMA package details and history." },
      { property: "og:title", content: "My Package — ASEM MMA" },
      { property: "og:description", content: "Your current ASEM MMA package details and history." },
    ],
  }),
  component: MyPackageRoute,
});

function MyPackageRoute() {
  return (
    <ClientPage title="My Package">
      <MyPackage />
    </ClientPage>
  );
}

function MyPackage() {
  const { summary, loading } = useMySummary();
  const { subscriptions, attendance } = useAsemData();

  if (loading) return <Empty>Loading package…</Empty>;
  if (!summary) return <Empty>No client record is linked to your account yet.</Empty>;

  const alert = alertFor(summary.status);
  const mySubs = subscriptions
    .filter((s) => s.client_id === summary.client.id)
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  return (
    <div className="space-y-8">
      <div className="surface space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="display text-4xl">{summary.packageName}</p>
          <StatusPill status={summary.status} large />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total" value={summary.totalSessions} />
          <StatCard label="Used" value={summary.usedSessions} tone="warning" />
          <StatCard label="Left" value={summary.remainingSessions} tone="primary" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{summary.progress}%</span>
          </div>
          <ProgressBar value={summary.progress} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="label-caps">Start</p>
            <p>{formatDate(summary.subscription?.start_date)}</p>
          </div>
          <div>
            <p className="label-caps">End</p>
            <p>{formatDate(summary.subscription?.end_date)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {summary.daysRemaining >= 0
            ? `${summary.daysRemaining} days remaining`
            : `Expired ${Math.abs(summary.daysRemaining)} days ago`}
        </p>
      </div>

      {alert ? (
        <p className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
          {alert}
        </p>
      ) : null}

      <Section title="Package History">
        {mySubs.length === 0 ? (
          <Empty>No packages yet.</Empty>
        ) : (
          <div className="space-y-2">
            {mySubs.map((sub) => {
              const used = attendance.filter(
                (a) => a.subscription_id === sub.id && a.status === "Attended",
              ).length;
              const current = sub.id === summary.client.current_subscription_id;
              return (
                <div key={sub.id} className="surface flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-semibold">
                      {sub.total_sessions} Sessions{current ? " · CURRENT" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sub.start_date)} → {formatDate(sub.end_date)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {used}/{sub.total_sessions}
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
