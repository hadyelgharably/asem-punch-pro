import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/asem/Guards";
import { Empty } from "@/components/asem/Bits";
import { useAsemData } from "@/hooks/useAsemData";
import { formatDateTime } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — ASEM MMA" },
      { name: "description", content: "Full training attendance history for ASEM MMA fighters." },
      { property: "og:title", content: "Attendance — ASEM MMA" },
      {
        property: "og:description",
        content: "Full training attendance history for ASEM MMA fighters.",
      },
    ],
  }),
  component: AttendanceRoute,
});

function AttendanceRoute() {
  return (
    <AdminPage title="Attendance">
      <Attendance />
    </AdminPage>
  );
}

function Attendance() {
  const { attendance, clients, loading } = useAsemData();
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const nameById = useMemo(
    () => new Map(clients.map((c) => [c.id, `${c.full_name} (${c.client_code})`])),
    [clients],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendance.filter((a) => {
      const label = (nameById.get(a.client_id) ?? a.client_email).toLowerCase();
      const day = a.occurred_at.slice(0, 10);
      if (q && !label.includes(q)) return false;
      if (clientId !== "ALL" && a.client_id !== clientId) return false;
      if (status !== "ALL" && a.status !== status) return false;
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [attendance, nameById, query, clientId, status, from, to]);

  const statuses = useMemo(
    () => Array.from(new Set(attendance.map((a) => a.status))),
    [attendance],
  );

  return (
    <div className="space-y-5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search client…"
        className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="label-caps">Client</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="label-caps">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="label-caps">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="space-y-1">
          <span className="label-caps">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <p className="label-caps">{rows.length} records</p>

      {loading ? (
        <Empty>Loading attendance…</Empty>
      ) : rows.length === 0 ? (
        <Empty>No attendance matches these filters.</Empty>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => {
            const { date, time } = formatDateTime(a.occurred_at);
            return (
              <div key={a.id} className="surface flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {nameById.get(a.client_id) ?? a.client_email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {date} · {time}
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
