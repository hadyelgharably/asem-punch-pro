import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  attendanceQuery,
  buildSummaries,
  clientsQuery,
  packagesQuery,
  subscriptionsQuery,
} from "@/lib/queries";
import { isToday, type ClientSummary } from "@/lib/asem";
import { useAuth } from "./useAuth";

export function useAsemData() {
  const clients = useQuery(clientsQuery);
  const packages = useQuery(packagesQuery);
  const subscriptions = useQuery(subscriptionsQuery);
  const attendance = useQuery(attendanceQuery);

  const summaries = useMemo(
    () =>
      buildSummaries(
        clients.data ?? [],
        subscriptions.data ?? [],
        attendance.data ?? [],
        packages.data ?? [],
      ),
    [clients.data, subscriptions.data, attendance.data, packages.data],
  );

  const stats = useMemo(() => {
    const attendedToday = (attendance.data ?? []).filter(
      (a) => a.status === "Attended" && isToday(a.occurred_at),
    );
    return {
      totalClients: summaries.length,
      activeClients: summaries.filter((s) => s.status === "ACTIVE" || s.status === "LOW SESSIONS")
        .length,
      sessionsToday: attendedToday.length,
      lowSessionClients: summaries.filter((s) => s.status === "LOW SESSIONS").length,
      expiredClients: summaries.filter((s) => s.status === "EXPIRED" || s.status === "COMPLETED")
        .length,
    };
  }, [summaries, attendance.data]);

  return {
    loading:
      clients.isLoading || packages.isLoading || subscriptions.isLoading || attendance.isLoading,
    error:
      (clients.error ?? packages.error ?? subscriptions.error ?? attendance.error) instanceof Error
        ? ((clients.error ?? packages.error ?? subscriptions.error ?? attendance.error) as Error)
        : null,
    clients: clients.data ?? [],
    packages: packages.data ?? [],
    subscriptions: subscriptions.data ?? [],
    attendance: attendance.data ?? [],
    summaries,
    stats,
  };
}

export function useMySummary(): { summary: ClientSummary | null; loading: boolean } {
  const { user } = useAuth();
  const { summaries, loading } = useAsemData();
  const email = user?.email?.toLowerCase() ?? "";
  const summary =
    summaries.find((s) => s.client.user_email.toLowerCase() === email) ?? summaries[0] ?? null;
  return { summary: summary ?? null, loading };
}
