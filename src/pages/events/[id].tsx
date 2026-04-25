import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";
import EventRegisterForm, {
  type EventRegistrationData,
} from "@/components/event/EventRegisterForm";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  river_name: string;
  start_time: string;
  end_time: string;
  status:
    | "upcoming"
    | "active"
    | "completed"
    | "pending_validation"
    | "validated"
    | "cancelled";
  max_participants: number | null;
  points_per_hunter_override: number | null;
  image_url: string | null;
  leader_id: string;
  leader: {
    id: string;
    username: string;
    full_name: string | null;
  } | null;
}

interface AttendanceCheck {
  id: string;
  status: "checked_in" | "checked_out" | "invalidated" | "completed_action";
  action_completed_at: string | null;
}

export default function EventDetailPage() {
  const router = useRouter();
  const { profile, user, isLoading } = useAuth();
  const eventId = typeof router.query.id === "string" ? router.query.id : null;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [myAttendance, setMyAttendance] = useState<AttendanceCheck | null>(
    null,
  );
  const [loadingEvent, setLoadingEvent] = useState<boolean>(true);
  const [eventError, setEventError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      void router.replace("/login");
    }
  }, [profile, isLoading, router]);

  const loadEvent = useCallback(async (): Promise<void> => {
    if (!eventId) return;
    setLoadingEvent(true);
    setEventError(null);

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, river_name, start_time, end_time, status, max_participants, points_per_hunter_override, image_url, leader_id, leader:profiles!leader_id(id, username, full_name)",
      )
      .eq("id", eventId)
      .single<EventDetail>();

    if (error || !data) {
      setEventError("Event tidak ditemukan.");
      setLoadingEvent(false);
      return;
    }

    setEvent(data);
    setLoadingEvent(false);
  }, [eventId]);

  const loadParticipantCount = useCallback(async (): Promise<void> => {
    if (!eventId) return;
    const { count } = await supabase
      .from("event_attendances")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
    setParticipantCount(count ?? 0);
  }, [eventId]);

  const loadMyAttendance = useCallback(async (): Promise<void> => {
    if (!eventId || !profile) return;
    const { data } = await supabase
      .from("event_attendances")
      .select("id, status, action_completed_at")
      .eq("event_id", eventId)
      .eq("hunter_id", profile.id)
      .maybeSingle<AttendanceCheck>();
    setMyAttendance(data);
  }, [eventId, profile]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    void loadParticipantCount();
    void loadMyAttendance();
  }, [loadParticipantCount, loadMyAttendance]);

  // Auto-redirect ke phase berikutnya kalau Hunter sudah lebih jauh
  useEffect(() => {
    if (!myAttendance || !eventId) return;
    if (myAttendance.status === "checked_in") {
      void router.replace(`/events/${eventId}/complete`);
    } else if (myAttendance.status === "completed_action") {
      // Stay di halaman ini untuk show "sudah selesai" state
    }
  }, [myAttendance, eventId, router]);

  const handleRegister = async (data: EventRegistrationData): Promise<void> => {
    if (!profile || !eventId) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from("event_attendances").insert({
        event_id: eventId,
        hunter_id: profile.id,
        registered_name: data.name,
        registered_email: data.email,
      });

      if (error) {
        if (error.code === "23505") {
          setErrorMsg("Kamu sudah terdaftar di event ini.");
        } else {
          setErrorMsg(error.message);
        }
        setSubmitting(false);
        return;
      }

      void router.push(`/events/${eventId}/checkin`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  };

  if (isLoading || loadingEvent) {
    return (
      <div className="min-h-screen bg-[#dff1f3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  if (eventError || !event || !profile || !user) {
    return (
      <div className="min-h-screen bg-[#dff1f3] flex items-center justify-center px-6">
        <div className="rounded-3xl bg-white p-8 max-w-sm w-full text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            Event tidak ditemukan
          </p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {eventError ?? "Terjadi kesalahan."}
          </p>
          <Link
            href="/hunter/dashboard"
            className="mt-5 inline-block w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const isOwnEvent = profile.id === event.leader_id;
  if (isOwnEvent) {
    void router.replace(`/events/${event.id}/manage`);
    return null;
  }

  const isJoined = myAttendance !== null;
  const isCompleted = myAttendance?.status === "completed_action";
  const isFull =
    event.max_participants !== null &&
    participantCount >= event.max_participants;
  const leaderName =
    event.leader?.full_name ?? event.leader?.username ?? "Penggerak Aksi";
  const pointsPerHunter = event.points_per_hunter_override ?? 20;

  return (
    <>
      <Head>
        <title>{event.title} · Jakal</title>
      </Head>

      <div className="min-h-screen bg-[#dff1f3] text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
          <header className="pt-6 pb-4">
            <Link
              href="/hunter/dashboard"
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
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
              Kembali
            </Link>
          </header>

          {isCompleted ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-300 flex items-center justify-center mx-auto mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-8 h-8 text-emerald-700"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5L10 17.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Aksi Selesai
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Terima kasih sudah berkontribusi! Poin sudah masuk ke saldomu.
              </p>
              <Link
                href="/hunter/dashboard"
                className="mt-6 inline-block w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          ) : (
            <EventRegisterForm
              eventTitle={event.title}
              eventDate={formatFullDate(event.start_time)}
              eventLocation={event.river_name}
              leaderName={`Penggerak Aksi ke ${pointsPerHunter}`}
              pointsPerHunter={pointsPerHunter}
              profile={profile}
              userEmail={user.email ?? ""}
              isFull={isFull}
              isJoined={isJoined}
              submitting={submitting}
              errorMsg={errorMsg}
              onSubmit={(data) => void handleRegister(data)}
            />
          )}
        </div>
      </div>
    </>
  );
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("id-ID", { weekday: "long" });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString("id-ID", { month: "long" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${dayNum} ${month}, ${hh}:${mm} WIB`;
}
