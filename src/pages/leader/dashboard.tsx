import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";
import EventCardLeader, {
  type LeaderEventCardData,
} from "@/components/event/EventCardLeader";
import type { EventStatus } from "@/components/event/EventCard";

interface LeaderStats {
  activeEvents: number;
  completedEvents: number;
}

interface EventRow {
  id: string;
  title: string;
  status: EventStatus;
  max_participants: number | null;
  image_url: string | null;
  points_per_hunter_override: number | null;
  logistics_status: "collected" | "in_transit" | "arrived";
  event_attendances: Array<{ count: number }>;
}

export default function LeaderDashboard() {
  const router = useRouter();
  const { profile, isLoading, signOut } = useAuth();
  const [stats, setStats] = useState<LeaderStats>({
    activeEvents: 0,
    completedEvents: 0,
  });
  const [events, setEvents] = useState<LeaderEventCardData[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      void router.replace("/auth/login");
      return;
    }
    if (profile.role !== "leader" && profile.role !== "admin") {
      void router.replace("/hunter/dashboard");
    }
  }, [profile, isLoading, router]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!profile || (profile.role !== "leader" && profile.role !== "admin"))
      return;
    setLoadingData(true);

    const [activeRes, completedRes, eventsRes] = await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, status, max_participants, image_url, points_per_hunter_override, logistics_status, event_attendances(count)",
        )
        .eq("leader_id", profile.id)
        .in("status", ["upcoming", "active", "pending_validation"])
        .neq("logistics_status", "arrived")
        .order("start_time", { ascending: false })
        .returns<EventRow[]>(),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("leader_id", profile.id)
        .in("status", ["validated", "completed"]),
      supabase
        .from("events")
        .select(
          "id, title, status, max_participants, image_url, points_per_hunter_override, event_attendances(count)",
        )
        .eq("leader_id", profile.id)
        .in("status", ["upcoming", "active"])
        .order("start_time", { ascending: false })
        .returns<EventRow[]>(),
    ]);

    const eventCards: LeaderEventCardData[] = (eventsRes.data ?? []).map(
      (evt) => ({
        id: evt.id,
        title: evt.title,
        status: evt.status,
        participantCount: evt.event_attendances[0]?.count ?? 0,
        maxParticipants: evt.max_participants,
        imageUrl: evt.image_url,
        pointsPerHunter: evt.points_per_hunter_override,
      }),
    );

    setStats({
      activeEvents: activeRes.count ?? 0,
      completedEvents: completedRes.count ?? 0,
    });
    setEvents(eventCards);
    setLoadingData(false);
  }, [profile]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLogout = async (): Promise<void> => {
    await signOut();
    void router.replace("/auth/login");
  };

  if (
    isLoading ||
    !profile ||
    (profile.role !== "leader" && profile.role !== "admin")
  ) {
    return (
      <div className="min-h-screen bg-[#dff1f3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  const firstName = (profile.full_name ?? profile.username).split(" ")[0];

  return (
    <>
      <Head>
        <title>Beranda Leader · Jakal</title>
      </Head>

      <div className="min-h-screen bg-jakal-leader text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
          <header className="flex items-start justify-between pt-6 pb-6">
            <div>
              <p className="text-sm text-slate-500">Penggerak Aksi</p>
              <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
                Halo, {firstName}!
              </h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white/50 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  d="M15 17l5-5-5-5M20 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </header>

          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Aksi Aktif</p>
                <p className="text-4xl font-semibold tabular-nums tracking-tight mt-2">
                  {loadingData ? "—" : stats.activeEvents}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Aksi Selesai</p>
                <p className="text-4xl font-semibold tabular-nums tracking-tight mt-2">
                  {loadingData ? "—" : stats.completedEvents}
                </p>
              </div>
            </div>

            <Link
              href="/events/create"
              className="mt-3 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] flex items-center justify-center"
            >
              Buat Event
            </Link>
          </section>

          <section className="mt-8 flex-1">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Event Aktif
            </h2>

            {loadingData ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin mx-auto" />
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-700">
                  Belum ada event aktif
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Buat event pertamamu untuk memulai aksi
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => (
                  <EventCardLeader key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
