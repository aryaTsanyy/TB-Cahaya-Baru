import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";

interface LeaderStats {
  activeEvents: number;
  totalAttendances: number;
  completedEvents: number;
}

export default function LeaderDashboard() {
  const router = useRouter();
  const { profile, isLoading, signOut } = useAuth();
  const [stats, setStats] = useState<LeaderStats>({
    activeEvents: 0,
    totalAttendances: 0,
    completedEvents: 0,
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      void router.replace("/login");
      return;
    }
    if (profile.role !== "leader") {
      void router.replace("/hunter/dashboard");
    }
  }, [profile, isLoading, router]);

  const loadStats = useCallback(async (): Promise<void> => {
    if (!profile || profile.role !== "leader") return;
    setLoadingStats(true);

    const [{ count: active }, { count: completed }] = await Promise.all([
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("leader_id", profile.id)
        .in("status", ["upcoming", "active"]),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("leader_id", profile.id)
        .in("status", ["validated", "completed"]),
    ]);

    setStats({
      activeEvents: active ?? 0,
      totalAttendances: 0,
      completedEvents: completed ?? 0,
    });
    setLoadingStats(false);
  }, [profile]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleLogout = async (): Promise<void> => {
    await signOut();
    void router.replace("/login");
  };

  if (isLoading || !profile || profile.role !== "leader") {
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

      <div className="min-h-screen bg-[#dff1f3] text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
          <header className="flex items-start justify-between pt-6 pb-6">
            <div>
              <p className="text-sm text-slate-500">Penggerak Aksi</p>
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
                <p className="text-xs text-slate-500">Event Aktif</p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight mt-1">
                  {loadingStats ? "—" : stats.activeEvents}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Selesai</p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight mt-1">
                  {loadingStats ? "—" : stats.completedEvents}
                </p>
              </div>
            </div>

            <Link
              href="/events/create"
              className="mt-3 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Buat Event Baru
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </section>

          <section className="mt-8 flex-1">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Event saya
            </h2>
            <div className="rounded-2xl bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                Belum ada event
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Buat event pertama untuk memulai aksi
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
