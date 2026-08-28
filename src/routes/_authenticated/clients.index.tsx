import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/asem/Guards";
import { Avatar, Empty, ProgressBar } from "@/components/asem/Bits";
import { StatusPill } from "@/components/asem/StatusPill";
import { useAsemData } from "@/hooks/useAsemData";
import { statusDot, type PackageStatus } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/clients/")({
  head: () => ({
    meta: [
      { title: "Clients — ASEM MMA" },
      { name: "description", content: "Search and manage every ASEM MMA fighter and package." },
      { property: "og:title", content: "Clients — ASEM MMA" },
      {
        property: "og:description",
        content: "Search and manage every ASEM MMA fighter and package.",
      },
    ],
  }),
  component: ClientsRoute,
});

const filters: Array<{ key: "ALL" | PackageStatus; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "LOW SESSIONS", label: "Low" },
  { key: "EXPIRED", label: "Expired" },
  { key: "COMPLETED", label: "Completed" },
];

function ClientsRoute() {
  return (
    <AdminPage title="Clients">
      <Clients />
    </AdminPage>
  );
}

function Clients() {
  const { summaries, loading } = useAsemData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | PackageStatus>("ALL");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter((s) => {
      const matchesFilter = filter === "ALL" || s.status === filter;
      const matchesQuery =
        q === "" ||
        s.client.full_name.toLowerCase().includes(q) ||
        s.client.client_code.toLowerCase().includes(q) ||
        (s.client.phone ?? "").toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [summaries, query, filter]);

  return (
    <div className="space-y-5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name, phone or code…"
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
              filter === f.key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Empty>Loading clients…</Empty>
      ) : results.length === 0 ? (
        <Empty>No clients match your search.</Empty>
      ) : (
        <div className="space-y-3">
          {results.map((s) => (
            <Link
              key={s.client.id}
              to="/clients/$id"
              params={{ id: s.client.id }}
              className="surface block space-y-3 p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar name={s.client.full_name} photoUrl={s.client.photo_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">
                    {statusDot(s.status)} {s.client.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.client.client_code}
                    {s.client.phone ? ` · ${s.client.phone}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="display text-3xl text-primary">{s.remainingSessions}</p>
                  <p className="label-caps">left</p>
                </div>
              </div>
              <ProgressBar value={s.progress} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.packageName}</span>
                <StatusPill status={s.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
