import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClientPage } from "@/components/asem/Guards";
import { Empty } from "@/components/asem/Bits";
import { useAsemData, useMySummary } from "@/hooks/useAsemData";
import { formatDateTime } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/my-sessions")({
  head: () => ({
    meta: [
      { title: "My Sessions — ASEM MMA" },
      { name: "description", content: "Your lifetime ASEM MMA training attendance history." },
      { property: "og:title", content: "My Sessions — ASEM MMA" },
      { property: "og:description", content: "Your lifetime ASEM MMA training attendance history." },
    ],
  }),
  component: MySessionsRoute,
});

function MySessionsRoute() {
  return (
    <ClientPage title="My Sessions">
      <MySessions />
    </ClientPage>
  );
}

function MySessions() {
  const { summary, loading } = useMySummary();
  const { attendance } = useAsemData();
  const [scope, setScope] = useState<"CURRENT" | "ALL">("ALL");

  if (loading) return <Empty>Loading sessions…</Empty>;
  if (!summary) return <Empty>No client record is linked to your account yet.</Empty>;

  const mine = attendance
    .filter((a) => a.client_id === summary.client.id)
    .filter((a) =>
      scope === "ALL" ? true : a.subscription_id === summary.client.current_subscription_id,
    )
    .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["ALL", "CURRENT"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setScope(key)}
            className={`flex-1 rounded-full border py-2 text-xs font-semibold uppercase tracking-widest ${
              scope === key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {key === "ALL" ? "Lifetime" : "Current Package"}
          </button>
        ))}
      </div>

      <p className="label-caps">{mine.length} sessions</p>

      {mine.length === 0 ? (
        <Empty>No sessions recorded yet. 🥊</Empty>
      ) : (
        <div className="space-y-2">
          {mine.map((a) => {
            const { date, time } = formatDateTime(a.occurred_at);
            const current = a.subscription_id === summary.client.current_subscription_id;
            return (
              <div key={a.id} className="surface flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-semibold">{date}</p>
                  <p className="text-xs text-muted-foreground">
                    {time} · {current ? "Current package" : "Previous package"}
                  </p>
                </div>
                <span className="label-caps text-success">{a.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
