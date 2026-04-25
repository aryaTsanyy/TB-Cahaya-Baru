import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/hooks/UseAuth";
import EventCard, { type EventCardData } from "@/components/event/EventCard";

const MOCK_EVENTS: ReadonlyArray<EventCardData> = [
  {
    id: "evt-001",
    title: "Bersih-bersih Sapu-Sapu Banjir Kanal Barat",
    riverName: "Sungai Banjir Kanal Barat, Semarang",
    dateLabel: "Hari ini",
    timeLabel: "07:00 - 11:00",
    status: "active",
    participantCount: 12,
    maxParticipants: 30,
    distanceLabel: "1.2 km",
  },
  {
    id: "evt-002",
    title: "Aksi Pungut Sampah Sungai Garang",
    riverName: "Sungai Garang, Semarang",
    dateLabel: "Besok",
    timeLabel: "06:30 - 10:00",
    status: "upcoming",
    participantCount: 8,
    maxParticipants: 25,
    distanceLabel: "3.4 km",
  },
  {
    id: "evt-003",
    title: "Restorasi Kali Asin",
    riverName: "Kali Asin, Semarang",
    dateLabel: "Sab, 2 Mei",
    timeLabel: "07:00 - 12:00",
    status: "upcoming",
    participantCount: 4,
    maxParticipants: 20,
    distanceLabel: "5.8 km",
  },
  {
    id: "evt-004",
    title: "Bersih Bareng Komunitas Pancing",
    riverName: "Sungai Banjir Kanal Timur",
    dateLabel: "Sab, 18 Apr",
    timeLabel: "07:00 - 10:00",
    status: "completed",
    participantCount: 22,
    maxParticipants: 30,
  },
];

type FilterStatus = "all" | "active" | "upcoming";

interface FilterOption {
  id: FilterStatus;
  label: string;
}

const FILTERS: ReadonlyArray<FilterOption> = [
  { id: "all", label: "Semua" },
  { id: "active", label: "Live" },
  { id: "upcoming", label: "Akan Datang" },
];

export default function EventsListPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [filter, setFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      void router.replace("/login");
    }
  }, [user, isLoading, router]);

  const filteredEvents: ReadonlyArray<EventCardData> = MOCK_EVENTS.filter(
    (evt) => {
      if (filter === "all") return evt.status !== "completed";
      return evt.status === filter;
    },
  );

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  const backHref =
    user.role === "leader" ? "/leader/dashboard" : "/hunter/dashboard";

  return (
    <>
      <Head>
        <title>Event · Jakal</title>
      </Head>

      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-24">
          <header className="flex items-center justify-between pt-6 pb-4">
            <Link
              href={backHref}
              aria-label="Kembali"
              className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <span className="text-sm font-semibold tracking-tight">Event</span>
            <div className="w-10" />
          </header>

          <section className="pt-2 pb-6">
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Event Pembersihan
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {filteredEvents.length} event tersedia di sekitarmu
            </p>
          </section>

          <div className="flex gap-2 pb-5 overflow-x-auto -mx-1 px-1">
            {FILTERS.map((f) => {
              const isActive = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <section className="flex-1">
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-6 h-6 text-slate-400"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Tidak ada event
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Coba ubah filter atau cek lagi nanti
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
