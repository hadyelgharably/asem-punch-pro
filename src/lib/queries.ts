import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  addDays,
  buildSummary,
  type AttendanceRow,
  type ClientRow,
  type ClientSummary,
  type PackageRow,
  type SubscriptionRow,
} from "./asem";

async function fetchClients(): Promise<ClientRow[]> {
  const { data, error } = await supabase.from("clients").select("*").order("client_code");
  if (error) throw error;
  return (data ?? []) as ClientRow[];
}

async function fetchPackages(): Promise<PackageRow[]> {
  const { data, error } = await supabase.from("packages").select("*").order("total_sessions");
  if (error) throw error;
  return (data ?? []) as PackageRow[];
}

async function fetchSubscriptions(): Promise<SubscriptionRow[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SubscriptionRow[];
}

async function fetchAttendance(): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export const clientsQuery = queryOptions({ queryKey: ["clients"], queryFn: fetchClients });
export const packagesQuery = queryOptions({ queryKey: ["packages"], queryFn: fetchPackages });
export const subscriptionsQuery = queryOptions({
  queryKey: ["subscriptions"],
  queryFn: fetchSubscriptions,
});
export const attendanceQuery = queryOptions({
  queryKey: ["attendance"],
  queryFn: fetchAttendance,
});

export function buildSummaries(
  clients: ClientRow[],
  subscriptions: SubscriptionRow[],
  attendance: AttendanceRow[],
  packages: PackageRow[],
): ClientSummary[] {
  return clients.map((c) => buildSummary(c, subscriptions, attendance, packages));
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["clients"] });
  void qc.invalidateQueries({ queryKey: ["subscriptions"] });
  void qc.invalidateQueries({ queryKey: ["attendance"] });
  void qc.invalidateQueries({ queryKey: ["packages"] });
}

export function useMarkPresent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (summary: ClientSummary) => {
      if (!summary.subscription) throw new Error("This client has no active package.");
      const { error } = await supabase.from("attendance").insert({
        client_id: summary.client.id,
        subscription_id: summary.subscription.id,
        client_email: summary.client.user_email,
        occurred_at: new Date().toISOString(),
        status: "Attended",
      });
      if (error) {
        if (error.code === "23505" || error.code === "23P01" || /duplicate/i.test(error.message)) {
          throw new Error("Already marked present today.");
        }
        throw error;
      }
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useRenewPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { client: ClientRow; pkg: PackageRow; startDate: string }) => {
      const { client, pkg, startDate } = input;
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({
          client_id: client.id,
          package_id: pkg.id,
          start_date: startDate,
          end_date: addDays(startDate, pkg.duration_days),
          total_sessions: pkg.total_sessions,
          status: "Active",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (client.current_subscription_id) {
        await supabase
          .from("subscriptions")
          .update({ status: "Expired" })
          .eq("id", client.current_subscription_id);
      }

      const { error: linkError } = await supabase
        .from("clients")
        .update({ current_subscription_id: data.id })
        .eq("id", client.id);
      if (linkError) throw linkError;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useSaveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      client_code: string;
      full_name: string;
      user_email: string;
      phone: string;
      notes: string;
      photo_url: string;
    }) => {
      const payload = {
        client_code: input.client_code.trim(),
        full_name: input.full_name.trim(),
        user_email: input.user_email.trim().toLowerCase(),
        phone: input.phone.trim() || null,
        notes: input.notes.trim() || null,
        photo_url: input.photo_url.trim() || null,
      };
      if (input.id) {
        const { error } = await supabase.from("clients").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useSavePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      package_name: string;
      total_sessions: number;
      duration_days: number;
      price: number;
      active: boolean;
      description: string;
    }) => {
      const payload = {
        package_name: input.package_name.trim(),
        total_sessions: input.total_sessions,
        duration_days: input.duration_days,
        price: input.price,
        active: input.active,
        description: input.description.trim() || null,
      };
      if (input.id) {
        const { error } = await supabase.from("packages").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("packages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidateAll(qc),
  });
}
