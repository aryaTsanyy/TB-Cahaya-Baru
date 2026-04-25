import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";
import EventCard, {
  type EventCardData,
  type EventStatus,
  type AttendanceStatus,
} from "@/components/event/EventCard";
import QRScannerModal from "@/components/hunter/QRScannerModal";

interface DashboardStats {
  totalPoints: number;
  activeEventsCount: number;
}

interface EventRow {
  id: string;
  title: string;
  river_name: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  max_participants: number | null;
  image_url: string | null;
  points_per_hunter_override: number | null;
  event_attendances: Array<{ count: number }>;
}

interface MyAttendanceRow {
  event_id: string;
  status: "checked_in" | "checked_out" | "invalidated" | "completed_action";
}

export default function HunterDashboard() {
  const router = useRouter();
  const { profile, isLoading, signOut, refreshProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    activeEventsCount: 0,
  });
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      void router.replace("/auth/login");
      return;
    }
    if (profile.role !== "hunter") {
      void router.replace("/leader/dashboard");
    }
  }, [profile, isLoading, router]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!profile || profile.role !== "hunter") return;
    setLoadingData(true);

    // Parallel fetch: count active events, list events, my attendances
    const [activeRes, eventsRes, myAttendancesRes] = await Promise.all([
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .in("status", ["upcoming", "active"]),
      supabase
        .from("events")
        .select(
          "id, title, river_name, start_time, end_time, status, max_participants, image_url, points_per_hunter_override, event_attendances(count)",
        )
        .in("status", ["upcoming", "active"])
        .order("start_time", { ascending: true })
        .limit(20)
        .returns<EventRow[]>(),
      supabase
        .from("event_attendances")
        .select("event_id, status")
        .eq("hunter_id", profile.id)
        .returns<MyAttendanceRow[]>(),
    ]);

    // Build attendance lookup map
    const attendanceMap = new Map<string, AttendanceStatus>();
    for (const att of myAttendancesRes.data ?? []) {
      attendanceMap.set(
        att.event_id,
        att.status === "completed_action" ? "completed" : "registered",
      );
    }

    // Map events ke card data + filter event yang sudah Hunter selesaikan
    const eventCards: EventCardData[] = (eventsRes.data ?? [])
      .map(
        (evt): EventCardData => ({
          id: evt.id,
          title: evt.title,
          riverName: evt.river_name,
          dateLabel: formatDateLabel(evt.start_time),
          timeLabel: formatTimeRange(evt.start_time, evt.end_time),
          status: evt.status,
          participantCount: evt.event_attendances[0]?.count ?? 0,
          maxParticipants: evt.max_participants,
          imageUrl: evt.image_url,
          pointsLabel: evt.points_per_hunter_override
            ? `${evt.points_per_hunter_override} point`
            : undefined,
          attendanceStatus: attendanceMap.get(evt.id) ?? "not_registered",
        }),
      )
      // Hide event yang sudah completed by this Hunter
      .filter((evt) => evt.attendanceStatus !== "completed");

    setStats({
      totalPoints: profile.total_points,
      activeEventsCount: activeRes.count ?? 0,
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

  const handleScanSuccess = async (): Promise<void> => {
    setScannerOpen(false);
    await refreshProfile();
    await loadData();
  };

  if (isLoading || !profile || profile.role !== "hunter") {
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
        <title>Beranda · Jakal</title>
      </Head>

      <div className="min-h-screen bg-[#dff1f3] text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
          <header className="flex items-start justify-between pt-6 pb-6">
            <div>
              <p className="text-sm text-slate-500">Pasukan Kali</p>
              <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
                Halo,{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">{firstName}!</span>
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 bottom-1 h-2 bg-sky-300/60 -z-0 rounded-sm"
                  />
                </span>
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
                <p className="text-xs text-slate-500">Point kamu</p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight mt-1">
                  {stats.totalPoints}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Event Aktif</p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight mt-1">
                  {stats.activeEventsCount}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="w-full mt-3 py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Scan QR
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </section>

          <section className="mt-8 flex-1">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Event yang tersedia
            </h2>

            {loadingData ? (
              <div className="rounded-2xl bg-white p-8 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin mx-auto" />
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Belum ada event tersedia
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Cek lagi nanti untuk melihat aksi pembersihan terbaru
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </section>
        </div>

        <QRScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onCheckInSuccess={() => void handleScanSuccess()}
        />
      </div>
    </>
  );
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) return "Hari ini";
  if (target.getTime() === tomorrow.getTime()) return "Besok";
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string): string => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  return `${fmt(startIso)} - ${fmt(endIso)}`;
}
