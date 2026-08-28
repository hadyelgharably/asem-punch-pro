import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPage } from "@/components/asem/Guards";
import { Avatar, Empty, Section } from "@/components/asem/Bits";
import { StatusPill } from "@/components/asem/StatusPill";
import { useAsemData } from "@/hooks/useAsemData";
import type { ClientSummary } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — ASEM MMA" },
      { name: "description", content: "Fighters running low on sessions or with expired packages." },
      { property: "og:title", content: "Alerts — ASEM MMA" },
      {
        property: "og:description",
        content: "Fighters running low on sessions or with expired packages.",
      },
    ],
  }),
  component: AlertsRoute,
});

function AlertsRoute() {
  return (
    <AdminPage title="Alerts">
      <Alerts />
    </AdminPage>
  );
}

function urgency(s: ClientSummary): number {
  if (s.status === "EXPIRED") return 0;
  if (s.status === "COMPLETED") return 1;
  if (s.status === "NO PACKAGE") return 2;
  return 3 + s.remainingSessions;
}

function Alerts() {
  const { summaries, loading } = useAsemData();

  const low = summaries
    .filter((s) => s.status === "LOW SESSIONS")
    .sort((a, b) => a.remainingSessions - b.remainingSessions);
  const expired = summaries
    .filter((s) => s.status === "EXPIRED" || s.status === "COMPLETED" || s.status === "NO PACKAGE")
    .sort((a, b) => urgency(a) - urgency(b));

  if (loading) return <Empty>Loading alerts…</Empty>;

  return (
    <div className="space-y-8">
      <Section title={`🔥 Low Sessions (${low.length})`}>
        {low.length === 0 ? <Empty>No one is running low.</Empty> : <List items={low} />}
      </Section>
      <Section title={`⚠️ Expired / Completed (${expired.length})`}>
        {expired.length === 0 ? (
          <Empty>No expired packages.</Empty>
        ) : (
          <List items={expired} />
        )}
      </Section>
    </div>
  );
}

function List({ items }: { items: ClientSummary[] }) {
  return (
    <div className="space-y-2">
      {items.map((s) => (
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
              {s.client.client_code} · {s.remainingSessions} left ·{" "}
              {s.daysRemaining >= 0
                ? `${s.daysRemaining} days`
                : `${Math.abs(s.daysRemaining)} days overdue`}
            </p>
          </div>
          <StatusPill status={s.status} />
        </Link>
      ))}
    </div>
  );
}
