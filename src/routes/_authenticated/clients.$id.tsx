import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "@/components/asem/Guards";
import { Avatar, Empty, ProgressBar, Section, StatCard } from "@/components/asem/Bits";
import { StatusPill } from "@/components/asem/StatusPill";
import { useAsemData } from "@/hooks/useAsemData";
import { useMarkPresent, useRenewPackage, useSaveClient } from "@/lib/queries";
import {
  formatDate,
  formatDateTime,
  isToday,
  todayISO,
  type ClientRow,
  type PackageRow,
} from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/clients/$id")({
  head: () => ({
    meta: [
      { title: "Client Profile — ASEM MMA" },
      { name: "description", content: "Full fighter profile, package progress and attendance." },
      { property: "og:title", content: "Client Profile — ASEM MMA" },
      {
        property: "og:description",
        content: "Full fighter profile, package progress and attendance.",
      },
    ],
  }),
  component: ClientDetailRoute,
});

function ClientDetailRoute() {
  return (
    <AdminPage>
      <ClientDetail />
    </AdminPage>
  );
}

function ClientDetail() {
  const { id } = Route.useParams();
  const { summaries, attendance, subscriptions, packages, loading } = useAsemData();
  const markPresent = useMarkPresent();
  const [mode, setMode] = useState<"none" | "renew" | "edit">("none");

  const summary = summaries.find((s) => s.client.id === id);

  if (loading) return <Empty>Loading profile…</Empty>;
  if (!summary) return <Empty>Client not found.</Empty>;

  const history = attendance
    .filter((a) => a.client_id === id)
    .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
  const clientSubs = subscriptions.filter((s) => s.client_id === id);
  const doneToday = history.some((a) => a.status === "Attended" && isToday(a.occurred_at));

  return (
    <div className="space-y-8">
      <div className="surface flex items-center gap-4 p-5">
        <Avatar name={summary.client.full_name} photoUrl={summary.client.photo_url} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="truncate text-3xl">{summary.client.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {summary.client.client_code} · {summary.client.user_email}
          </p>
          {summary.client.phone ? (
            <a href={`tel:${summary.client.phone}`} className="block text-sm text-primary">
              📞 {summary.client.phone}
            </a>
          ) : null}
          <StatusPill status={summary.status} large />
        </div>
      </div>

      <Section title="Current Package">
        <div className="surface space-y-4 p-5">
          <div className="flex items-baseline justify-between">
            <p className="display text-3xl">{summary.packageName}</p>
            <p className="text-sm text-muted-foreground">
              {summary.daysRemaining >= 0
                ? `${summary.daysRemaining} days left`
                : `${Math.abs(summary.daysRemaining)} days overdue`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" value={summary.totalSessions} />
            <StatCard label="Used" value={summary.usedSessions} tone="warning" />
            <StatCard label="Remaining" value={summary.remainingSessions} tone="primary" />
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
        </div>
      </Section>

      <div className="space-y-3">
        <button
          disabled={doneToday || markPresent.isPending || !summary.subscription}
          onClick={() =>
            markPresent.mutate(summary, {
              onSuccess: () => toast.success("Marked present ✓"),
              onError: (error: Error) => toast.error(error.message),
            })
          }
          className={`display w-full rounded-xl py-5 text-3xl tracking-wide transition-colors ${
            doneToday || !summary.subscription
              ? "border border-border bg-elevated text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {doneToday ? "✓ Present today" : "✓ Mark Present"}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode(mode === "renew" ? "none" : "renew")}
            className="rounded-xl border border-primary/50 py-3 text-sm font-semibold uppercase tracking-widest text-primary"
          >
            🔄 Renew Package
          </button>
          <button
            onClick={() => setMode(mode === "edit" ? "none" : "edit")}
            className="rounded-xl border border-border py-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
          >
            ✏️ Edit Client
          </button>
        </div>
      </div>

      {mode === "renew" ? (
        <RenewForm
          client={summary.client}
          packages={packages.filter((p) => p.active)}
          onDone={() => setMode("none")}
        />
      ) : null}
      {mode === "edit" ? (
        <EditForm client={summary.client} onDone={() => setMode("none")} />
      ) : null}

      <Section title="Subscription History">
        {clientSubs.length === 0 ? (
          <Empty>No subscriptions yet.</Empty>
        ) : (
          <div className="space-y-2">
            {clientSubs.map((sub) => {
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
                    {used}/{sub.total_sessions} used
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title={`Lifetime Attendance (${history.length})`}>
        {history.length === 0 ? (
          <Empty>No sessions recorded yet.</Empty>
        ) : (
          <div className="space-y-2">
            {history.map((a) => {
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
      </Section>

      <Link to="/clients" className="label-caps block text-center text-primary">
        ← Back to clients
      </Link>
    </div>
  );
}

function RenewForm({
  client,
  packages,
  onDone,
}: {
  client: ClientRow;
  packages: PackageRow[];
  onDone: () => void;
}) {
  const renew = useRenewPackage();
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [startDate, setStartDate] = useState(todayISO());

  const submit = () => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) {
      toast.error("Choose a package first.");
      return;
    }
    renew.mutate(
      { client, pkg, startDate },
      {
        onSuccess: () => {
          toast.success(`Renewed with ${pkg.package_name}. History kept.`);
          onDone();
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="surface space-y-4 p-5">
      <h3 className="text-2xl">Renew Package</h3>
      <p className="text-xs text-muted-foreground">
        A new subscription is created and set as current. Previous subscriptions and attendance are
        never deleted.
      </p>
      <label className="block space-y-1">
        <span className="label-caps">Package</span>
        <select
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
        >
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.package_name} — {p.total_sessions} sessions / {p.duration_days} days
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="label-caps">Start date</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
        />
      </label>
      <button
        disabled={renew.isPending}
        onClick={submit}
        className="display w-full rounded-xl bg-primary py-4 text-2xl text-primary-foreground"
      >
        {renew.isPending ? "Renewing…" : "Confirm Renewal"}
      </button>
    </div>
  );
}

function EditForm({ client, onDone }: { client: ClientRow; onDone: () => void }) {
  const save = useSaveClient();
  const [form, setForm] = useState({
    client_code: client.client_code,
    full_name: client.full_name,
    user_email: client.user_email,
    phone: client.phone ?? "",
    notes: client.notes ?? "",
    photo_url: client.photo_url ?? "",
  });

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <label className="block space-y-1">
      <span className="label-caps">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
      />
    </label>
  );

  return (
    <div className="surface space-y-4 p-5">
      <h3 className="text-2xl">Edit Client</h3>
      {field("full_name", "Full name")}
      {field("client_code", "Client code")}
      {field("user_email", "Login email", "email")}
      {field("phone", "Phone")}
      {field("photo_url", "Photo URL")}
      {field("notes", "Notes")}
      <button
        disabled={save.isPending}
        onClick={() =>
          save.mutate(
            { id: client.id, ...form },
            {
              onSuccess: () => {
                toast.success("Client updated.");
                onDone();
              },
              onError: (error: Error) => toast.error(error.message),
            },
          )
        }
        className="display w-full rounded-xl bg-primary py-4 text-2xl text-primary-foreground"
      >
        {save.isPending ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
