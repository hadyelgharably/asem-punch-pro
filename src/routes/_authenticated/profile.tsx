import { createFileRoute } from "@tanstack/react-router";
import { ClientPage } from "@/components/asem/Guards";
import { Avatar, Empty } from "@/components/asem/Bits";
import { StatusPill } from "@/components/asem/StatusPill";
import { useAuth } from "@/hooks/useAuth";
import { useMySummary } from "@/hooks/useAsemData";
import { formatDate } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — ASEM MMA" },
      { name: "description", content: "Your ASEM MMA member profile and contact details." },
      { property: "og:title", content: "My Profile — ASEM MMA" },
      { property: "og:description", content: "Your ASEM MMA member profile and contact details." },
    ],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  return (
    <ClientPage title="My Profile">
      <Profile />
    </ClientPage>
  );
}

function Profile() {
  const { user, signOut } = useAuth();
  const { summary, loading } = useMySummary();

  if (loading) return <Empty>Loading profile…</Empty>;

  return (
    <div className="space-y-6">
      <div className="surface flex flex-col items-center gap-3 p-6 text-center">
        <Avatar
          name={summary?.client.full_name ?? user?.email ?? "Member"}
          photoUrl={summary?.client.photo_url ?? null}
          size="lg"
        />
        <h2 className="text-3xl">{summary?.client.full_name ?? "Member"}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        {summary ? <StatusPill status={summary.status} large /> : null}
      </div>

      {summary ? (
        <div className="surface divide-y divide-border p-0">
          <Row label="Client code" value={summary.client.client_code} />
          <Row label="Phone" value={summary.client.phone ?? "—"} />
          <Row label="Member since" value={formatDate(summary.client.join_date)} />
          <Row label="Current package" value={summary.packageName} />
          <Row
            label="Sessions remaining"
            value={`${summary.remainingSessions} / ${summary.totalSessions}`}
          />
        </div>
      ) : (
        <Empty>No client record is linked to your account yet. Contact Coach Asem.</Empty>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Need changes? Contact Coach Asem — only the coach can edit member records.
      </p>

      <button
        onClick={() => void signOut()}
        className="w-full rounded-xl border border-primary/50 py-3 text-sm font-semibold uppercase tracking-widest text-primary"
      >
        Sign out
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <span className="label-caps">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
