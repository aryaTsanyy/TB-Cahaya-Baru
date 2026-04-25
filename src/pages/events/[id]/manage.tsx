import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import QRCode from "qrcode";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";

type LogisticsStatus = "collected" | "in_transit" | "arrived";

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
  qr_token: string;
  leader_id: string;
  image_url: string | null;
  logistics_status: LogisticsStatus;
  logistics_weight_kg: number | null;
}

type ViewMode = "overview" | "qr_modal" | "logistics";

const BG_GRADIENT =
  "bg-[linear-gradient(180deg,_#F4FAD7_0%,_#E6F3FC_60.1%,_#FEFFFF_100%)]";

export default function EventManagePage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const eventId = typeof router.query.id === "string" ? router.query.id : null;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("overview");
  const [closingQr, setClosingQr] = useState<boolean>(false);
  const [advancing, setAdvancing] = useState<boolean>(false);
  const [weightInput, setWeightInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      void router.replace("/login");
      return;
    }
    if (profile.role !== "leader" && profile.role !== "admin") {
      void router.replace("/hunter/dashboard");
    }
  }, [profile, isLoading, router]);

  const loadEvent = useCallback(async (): Promise<void> => {
    if (!eventId || !profile) return;
    setLoadingEvent(true);
    setEventError(null);

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, river_name, start_time, end_time, status, max_participants, qr_token, leader_id, image_url, logistics_status, logistics_weight_kg",
      )
      .eq("id", eventId)
      .single<EventDetail>();

    if (error || !data) {
      setEventError("Event tidak ditemukan.");
      setLoadingEvent(false);
      return;
    }
    if (data.leader_id !== profile.id) {
      setEventError("Anda bukan Leader event ini.");
      setLoadingEvent(false);
      return;
    }

    setEvent(data);
    setLoadingEvent(false);
  }, [eventId, profile]);

  const loadAttendanceCount = useCallback(async (): Promise<void> => {
    if (!eventId) return;
    const { count } = await supabase
      .from("event_attendances")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
    setAttendanceCount(count ?? 0);
  }, [eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    void loadAttendanceCount();
  }, [loadAttendanceCount]);

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event_${eventId}_manage`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_attendances",
          filter: `event_id=eq.${eventId}`,
        },
        () => void loadAttendanceCount(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, loadAttendanceCount]);

  const handleQrFinish = async (): Promise<void> => {
    if (!event) return;
    setClosingQr(true);
    setErrorMsg(null);

    try {
      if (event.status === "upcoming" || event.status === "active") {
        const { data, error } = await supabase.rpc(
          "mark_event_pending_validation",
          {
            p_event_id: event.id,
          },
        );
        if (error) throw error;
        const res = data as { success: boolean; error?: string };
        if (!res.success && res.error !== "INVALID_STATUS_TRANSITION") {
          throw new Error(res.error ?? "Gagal mengubah status event.");
        }
        await loadEvent();
      }
      setView("logistics");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setClosingQr(false);
    }
  };

  const handleAdvanceLogistics = async (): Promise<void> => {
    if (!event) return;
    setAdvancing(true);
    setErrorMsg(null);

    const weight =
      event.logistics_status === "collected" && weightInput
        ? parseFloat(weightInput)
        : null;

    try {
      const { data, error } = await supabase.rpc("advance_event_logistics", {
        p_event_id: event.id,
        p_weight_kg: weight,
      });
      if (error) throw error;
      const res = data as {
        success: boolean;
        error?: string;
        logistics_status?: string;
      };
      if (!res.success) {
        setErrorMsg(translateError(res.error));
        return;
      }

      if (res.logistics_status === "arrived") {
        setTimeout(() => {
          void router.push("/leader/dashboard");
        }, 1500);
      }

      await loadEvent();
      setWeightInput("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setAdvancing(false);
    }
  };

  if (isLoading || loadingEvent) {
    return (
      <div
        className={`min-h-screen ${BG_GRADIENT} flex items-center justify-center`}
      >
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div
        className={`min-h-screen ${BG_GRADIENT} flex items-center justify-center px-6`}
      >
        <div className="rounded-3xl bg-white p-8 max-w-sm w-full text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            Tidak dapat memuat event
          </p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {eventError ?? "Terjadi kesalahan."}
          </p>
          <Link
            href="/leader/dashboard"
            className="mt-5 inline-block w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const eventEnded = new Date() >= new Date(event.end_time);

  if (view === "logistics") {
    return (
      <LogisticsView
        event={event}
        advancing={advancing}
        errorMsg={errorMsg}
        weightInput={weightInput}
        bgClass={BG_GRADIENT}
        onWeightChange={setWeightInput}
        onAdvance={handleAdvanceLogistics}
        onBack={() => setView("overview")}
      />
    );
  }

  return (
    <>
      <Head>
        <title>{event.title} · Jakal</title>
      </Head>

      <div className={`min-h-screen ${BG_GRADIENT} text-slate-900`}>
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
          <header className="pt-6 pb-4">
            <Link
              href="/leader/dashboard"
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

          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900 leading-tight">
              {event.title}
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Klik tombol di bawah untuk memunculkan Kode QR kehadiran. Pastikan
              setiap Pasukan Kali memindai kode ini saat tiba di lokasi sebagai
              tanda dimulainya aksi kita hari ini.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-100 overflow-hidden">
              {event.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full aspect-[16/10] object-cover"
                />
              ) : (
                <div className="w-full aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-sky-100 to-emerald-100">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-12 h-12 text-sky-700/40"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {event.logistics_status !== "arrived" &&
              event.status !== "validated" && (
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => setView("qr_modal")}
                    className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99]"
                  >
                    {attendanceCount > 0
                      ? "Tampilkan QR Code"
                      : "Generate QR Code"}
                  </button>

                  {(eventEnded || event.status === "pending_validation") && (
                    <button
                      type="button"
                      onClick={() => setView("logistics")}
                      className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-semibold transition-all hover:bg-slate-50 active:scale-[0.99]"
                    >
                      Kelola Pengiriman
                    </button>
                  )}
                </div>
              )}
          </article>

          <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pasukan Kali Hadir
                </p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">
                  {attendanceCount}
                  {event.max_participants && (
                    <span className="text-sm text-slate-400 ml-1">
                      / {event.max_participants}
                    </span>
                  )}
                </p>
              </div>
              {!eventEnded && event.status !== "pending_validation" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                    Live
                  </span>
                </span>
              )}
            </div>
          </section>

          {errorMsg && view === "overview" && (
            <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
              {errorMsg}
            </div>
          )}
        </div>

        <QRModal
          open={view === "qr_modal"}
          eventTitle={event.title}
          qrToken={event.qr_token}
          attendanceCount={attendanceCount}
          maxParticipants={event.max_participants}
          closing={closingQr}
          bgClass={BG_GRADIENT}
          onFinish={() => void handleQrFinish()}
          onBack={() => setView("overview")}
        />
      </div>
    </>
  );
}

// ============================================================================
// QR MODAL — fixed sizing
// ============================================================================

interface QRModalProps {
  open: boolean;
  eventTitle: string;
  qrToken: string;
  attendanceCount: number;
  maxParticipants: number | null;
  closing: boolean;
  bgClass: string;
  onFinish: () => void;
  onBack: () => void;
}

function QRModal({
  open,
  qrToken,
  attendanceCount,
  maxParticipants,
  closing,
  bgClass,
  onFinish,
  onBack,
}: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const cssSize = Math.min(canvas.parentElement?.clientWidth ?? 280, 280);
    const dpr = window.devicePixelRatio || 1;

    void QRCode.toCanvas(canvas, qrToken, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: Math.round(cssSize * dpr),
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then(() => {
      canvas.style.width = `${cssSize}px`;
      canvas.style.height = `${cssSize}px`;
    });
  }, [open, qrToken]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${bgClass} overflow-y-auto`}
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
        <header className="pt-6 pb-4">
          <button
            type="button"
            onClick={onBack}
            disabled={closing}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors disabled:opacity-50"
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
          </button>
        </header>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 leading-tight">
            QR Verifikasi Kehadiran
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Tampilkan QR ini ke Pasukan Kali yang sudah datang di lokasi event.
          </p>

          <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="block rounded-xl"
              style={{
                width: "min(100%, 320px)",
                height: "auto",
                imageRendering: "pixelated",
              }}
            />
          </div>

          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-800">
                Sudah scan
              </span>
            </span>
            <span className="text-sm font-semibold text-emerald-900 tabular-nums">
              {attendanceCount}
              {maxParticipants !== null && (
                <span className="text-emerald-700/70 font-medium">
                  {" "}
                  / {maxParticipants}
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={onFinish}
            disabled={closing}
            className="mt-5 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100 disabled:cursor-not-allowed"
          >
            {closing ? "Memproses..." : "Selesai"}
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500 text-center px-4 leading-relaxed">
          Tap Selesai setelah event berakhir untuk melanjutkan ke status
          pengiriman ke Station.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// LOGISTICS VIEW
// ============================================================================

interface LogisticsViewProps {
  event: EventDetail;
  advancing: boolean;
  errorMsg: string | null;
  weightInput: string;
  bgClass: string;
  onWeightChange: (v: string) => void;
  onAdvance: () => void;
  onBack: () => void;
}

const LOGISTICS_STEPS: ReadonlyArray<{ id: LogisticsStatus; label: string }> = [
  { id: "collected", label: "Sampah dikumpulkan" },
  { id: "in_transit", label: "Dalam perjalanan" },
  { id: "arrived", label: "Tiba di Station Sampah" },
];

function LogisticsView({
  event,
  advancing,
  errorMsg,
  weightInput,
  bgClass,
  onWeightChange,
  onAdvance,
  onBack,
}: LogisticsViewProps) {
  const currentIdx = LOGISTICS_STEPS.findIndex(
    (s) => s.id === event.logistics_status,
  );
  const isArrived = event.logistics_status === "arrived";

  const currentLabel: Record<LogisticsStatus, string> = {
    collected: "Sampah dikumpulkan",
    in_transit: "Sedang dibawa ke station",
    arrived: "Sudah tiba di station",
  };

  const ctaLabel: Record<LogisticsStatus, string> = {
    collected: "Mulai Pengiriman",
    in_transit: "Tandai tiba di Station",
    arrived: "Selesai",
  };

  const weightDisplay =
    event.logistics_weight_kg !== null
      ? `${event.logistics_weight_kg}kg`
      : weightInput
        ? `${weightInput}kg`
        : "— kg";

  return (
    <>
      <Head>
        <title>Status · {event.title}</title>
      </Head>

      <div className={`min-h-screen ${bgClass} text-slate-900`}>
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
          <header className="pt-6 pb-4">
            <button
              type="button"
              onClick={onBack}
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
            </button>
          </header>

          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Status
            </h1>

            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5">
              <p className="text-sm font-semibold text-slate-900">
                {currentLabel[event.logistics_status]}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {event.title}
                <span className="mx-1.5">·</span>
                <span className="tabular-nums">{weightDisplay}</span>
              </p>
            </div>

            <div className="mt-6 space-y-1">
              {LOGISTICS_STEPS.map((step, idx) => {
                const isActive = idx <= currentIdx;
                const isCompleted = idx < currentIdx;
                const isLast = idx === LOGISTICS_STEPS.length - 1;
                return (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <StepDot active={isActive} completed={isCompleted} />
                      {!isLast && (
                        <StepLine
                          completed={isActive && idx + 1 <= currentIdx}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {event.logistics_status === "collected" && (
              <div className="mt-2">
                <label
                  htmlFor="weight"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Total Berat Sampah (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={0}
                  value={weightInput}
                  onChange={(e) => onWeightChange(e.target.value)}
                  placeholder="Contoh: 120"
                  className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors tabular-nums"
                />
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {!isArrived && (
              <button
                type="button"
                onClick={onAdvance}
                disabled={
                  advancing ||
                  (event.logistics_status === "collected" && !weightInput)
                }
                className="mt-6 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                {advancing ? "Memproses..." : ctaLabel[event.logistics_status]}
              </button>
            )}

            {isArrived && (
              <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-5 h-5 text-emerald-700"
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
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Selesai
                  </p>
                  <p className="text-xs text-emerald-700/80">
                    Sampah sudah tiba di Station.
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StepDot({
  active,
  completed,
}: {
  active: boolean;
  completed: boolean;
}) {
  if (completed || active) {
    return (
      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-3.5 h-3.5 text-white"
          aria-hidden="true"
        >
          <path
            d="M5 12.5L10 17.5L19 7.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white flex-shrink-0" />
  );
}

function StepLine({ completed }: { completed: boolean }) {
  return (
    <div
      className={`w-px flex-1 my-1 ${
        completed ? "bg-slate-900" : "border-l-2 border-dashed border-slate-300"
      }`}
    />
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function translateError(error: string | undefined): string {
  switch (error) {
    case "NOT_AUTHENTICATED":
      return "Sesi habis. Silakan login ulang.";
    case "NOT_EVENT_LEADER":
      return "Anda bukan Leader event ini.";
    case "EVENT_NOT_FOUND":
      return "Event tidak ditemukan.";
    case "ALREADY_ARRIVED":
      return "Status sudah final.";
    case "INVALID_STATUS_TRANSITION":
      return "Transisi status tidak valid.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}
