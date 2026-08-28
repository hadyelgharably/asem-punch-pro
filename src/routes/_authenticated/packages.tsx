import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "@/components/asem/Guards";
import { Empty, Section } from "@/components/asem/Bits";
import { useAsemData } from "@/hooks/useAsemData";
import { useSavePackage } from "@/lib/queries";
import type { PackageRow } from "@/lib/asem";

export const Route = createFileRoute("/_authenticated/packages")({
  head: () => ({
    meta: [
      { title: "Packages — ASEM MMA" },
      { name: "description", content: "Manage ASEM MMA training packages and pricing." },
      { property: "og:title", content: "Packages — ASEM MMA" },
      { property: "og:description", content: "Manage ASEM MMA training packages and pricing." },
    ],
  }),
  component: PackagesRoute,
});

function PackagesRoute() {
  return (
    <AdminPage title="Packages">
      <Packages />
    </AdminPage>
  );
}

const emptyForm = {
  package_name: "",
  total_sessions: 8,
  duration_days: 30,
  price: 0,
  active: true,
  description: "",
};

function Packages() {
  const { packages, loading } = useAsemData();
  const [editing, setEditing] = useState<PackageRow | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          setEditing(null);
          setCreating((v) => !v);
        }}
        className="display w-full rounded-xl bg-primary py-4 text-2xl text-primary-foreground"
      >
        {creating ? "Close" : "+ Add Package"}
      </button>

      {creating ? (
        <PackageForm initial={null} onDone={() => setCreating(false)} />
      ) : null}

      <Section title="All Packages">
        {loading ? (
          <Empty>Loading packages…</Empty>
        ) : packages.length === 0 ? (
          <Empty>No packages yet.</Empty>
        ) : (
          <div className="space-y-3">
            {packages.map((p) => (
              <div key={p.id} className="surface space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="display text-3xl">{p.package_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.total_sessions} sessions · {p.duration_days} days · {p.price} EGP
                    </p>
                    {p.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    ) : null}
                  </div>
                  <span
                    className={`label-caps rounded-full border px-3 py-1 ${
                      p.active
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCreating(false);
                    setEditing(editing?.id === p.id ? null : p);
                  }}
                  className="w-full rounded-xl border border-border py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  {editing?.id === p.id ? "Cancel" : "✏️ Edit"}
                </button>
                {editing?.id === p.id ? (
                  <PackageForm initial={p} onDone={() => setEditing(null)} />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function PackageForm({ initial, onDone }: { initial: PackageRow | null; onDone: () => void }) {
  const save = useSavePackage();
  const [form, setForm] = useState(
    initial
      ? {
          package_name: initial.package_name,
          total_sessions: initial.total_sessions,
          duration_days: initial.duration_days,
          price: Number(initial.price),
          active: initial.active,
          description: initial.description ?? "",
        }
      : emptyForm,
  );

  const numField = (key: "total_sessions" | "duration_days" | "price", label: string) => (
    <label className="block space-y-1">
      <span className="label-caps">{label}</span>
      <input
        type="number"
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
      />
    </label>
  );

  return (
    <div className="surface space-y-4 p-5">
      <label className="block space-y-1">
        <span className="label-caps">Package name</span>
        <input
          value={form.package_name}
          onChange={(e) => setForm((prev) => ({ ...prev, package_name: e.target.value }))}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        {numField("total_sessions", "Sessions")}
        {numField("duration_days", "Days")}
        {numField("price", "Price")}
      </div>
      <label className="block space-y-1">
        <span className="label-caps">Description</span>
        <input
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-primary"
        />
      </label>
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
          className="h-5 w-5 accent-[oklch(0.58_0.23_26)]"
        />
        <span className="label-caps">Active</span>
      </label>
      <button
        disabled={save.isPending || !form.package_name.trim()}
        onClick={() =>
          save.mutate(
            initial ? { id: initial.id, ...form } : form,
            {
              onSuccess: () => {
                toast.success(initial ? "Package updated." : "Package created.");
                onDone();
              },
              onError: (error: Error) => toast.error(error.message),
            },
          )
        }
        className="display w-full rounded-xl bg-primary py-4 text-2xl text-primary-foreground"
      >
        {save.isPending ? "Saving…" : initial ? "Save Package" : "Create Package"}
      </button>
    </div>
  );
}
