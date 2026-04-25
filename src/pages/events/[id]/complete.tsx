import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";

interface EventInfo {
  id: string;
  title: string;
  description: string | null;
  river_name: string;
  start_time: string;
  points_per_hunter_override: number | null;
}

interface AttendanceInfo {
  id: string;
  status: "checked_in" | "checked_out" | "invalidated" | "completed_action";
  action_completed_at: string | null;
}

interface EvidencePhoto {
  id: string;
  storage_path: string;
}

export default function CompleteActionPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const eventId = typeof router.query.id === "string" ? router.query.id : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [attendance, setAttendance] = useState<AttendanceInfo | null>(null);
  const [evidence, setEvidence] = useState<EvidencePhoto | null>(null);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState<string | null>(
    null,
  );
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const [uploading, setUploading] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successPoints, setSuccessPoints] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) void router.replace("/login");
  }, [profile, isLoading, router]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!eventId || !profile) return;
    setLoadingData(true);

    const [{ data: eventData }, { data: attData }] = await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, description, river_name, start_time, points_per_hunter_override",
        )
        .eq("id", eventId)
        .single<EventInfo>(),
      supabase
        .from("event_attendances")
        .select("id, status, action_completed_at")
        .eq("event_id", eventId)
        .eq("hunter_id", profile.id)
        .maybeSingle<AttendanceInfo>(),
    ]);

    setEvent(eventData);
    setAttendance(attData);

    // Load existing evidence (kalau Hunter sudah upload tapi belum complete)
    if (attData) {
      const { data: photoData } = await supabase
        .from("evidence_photos")
        .select("id, storage_path")
        .eq("attendance_id", attData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<EvidencePhoto>();

      if (photoData) {
        setEvidence(photoData);
        const { data: signedUrlData } = await supabase.storage
          .from("evidence-photos")
          .createSignedUrl(photoData.storage_path, 3600);
        if (signedUrlData?.signedUrl) {
          setEvidencePreviewUrl(signedUrlData.signedUrl);
        }
      }
    }

    setLoadingData(false);
  }, [eventId, profile]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (loadingData || !attendance || !eventId) return;
    if (attendance.status === "completed_action") {
      return;
    }
    if (attendance.status !== "checked_in") {
      void router.replace(`/events/${eventId}/checkin`);
    }
  }, [loadingData, attendance, eventId, router]);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !profile || !eventId) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Ukuran foto maksimal 10MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg("Format foto harus JPG, PNG, atau WebP.");
      return;
    }

    setErrorMsg(null);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${eventId}/${profile.id}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("evidence-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) throw uploadErr;

      const { data, error: rpcErr } = await supabase.rpc(
        "submit_evidence_photo",
        {
          p_event_id: eventId,
          p_storage_path: path,
          p_file_size: file.size,
          p_client_meta: { uploaded_at: new Date().toISOString() },
        },
      );

      if (rpcErr) throw rpcErr;

      const res = data as {
        success: boolean;
        photo_id?: string;
        error?: string;
      };
      if (!res.success) {
        await supabase.storage.from("evidence-photos").remove([path]);
        throw new Error(translateRpcError(res.error));
      }

      const previewUrl = URL.createObjectURL(file);
      setEvidence({ id: res.photo_id ?? "", storage_path: path });
      setEvidencePreviewUrl(previewUrl);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload foto gagal.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleComplete = async (): Promise<void> => {
    if (!eventId || !evidence) return;

    setCompleting(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc("complete_action", {
        p_event_id: eventId,
      });

      if (error) {
        setErrorMsg(error.message);
        setCompleting(false);
        return;
      }

      const res = data as {
        success: boolean;
        error?: string;
        points_awarded?: number;
        new_balance?: number;
      };

      if (!res.success) {
        setErrorMsg(translateRpcError(res.error));
        setCompleting(false);
        return;
      }

      setSuccessPoints(res.points_awarded ?? 0);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setCompleting(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[#dff1f3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  if (!event || !attendance) {
    return (
      <div className="min-h-screen bg-[#dff1f3] flex items-center justify-center px-6">
        <div className="rounded-3xl bg-white p-8 max-w-sm w-full text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            Data tidak ditemukan
          </p>
          <Link
            href="/hunter/dashboard"
            className="mt-5 inline-block w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold"
          >
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  if (successPoints !== null || attendance.status === "completed_action") {
    const points = successPoints ?? event.points_per_hunter_override ?? 20;
    return <RewardSuccessScreen points={points} />;
  }

  const hasEvidence = evidence !== null;

  return (
    <>
      <Head>
        <title>{event.title} · Jakal</title>
      </Head>

      <div className="min-h-screen bg-[#dff1f3] text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 pb-10">
          <header className="pt-6 pb-4">
            <button
              type="button"
              onClick={() => void router.push("/hunter/dashboard")}
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
            <h1 className="text-xl font-semibold text-slate-900 leading-tight">
              {event.title}
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {hasEvidence
                ? `Jika telah selesai berkontribusi pembersihan di ${event.river_name.split(",")[0]} silahkan klik tombol "Selesaikan Aksi".`
                : `Satu langkah lagi! Bagikan ambil foto kesiapanmu untuk memulai.`}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => void handleFileSelect(e)}
              className="hidden"
            />

            {hasEvidence && evidencePreviewUrl ? (
              <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={evidencePreviewUrl}
                  alt="Bukti hasil pembersihan"
                  className="w-full aspect-[4/3] object-cover rounded-xl"
                />
                <p className="text-sm font-semibold text-slate-700 text-center mt-3">
                  Hasil Gambar
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 flex items-center justify-center text-slate-700 mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-9 h-9"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 9a2 2 0 012-2h2.586a2 2 0 001.414-.586l1.414-1.414A2 2 0 0111.828 4h.344a2 2 0 011.414.586l1.414 1.414A2 2 0 0016.414 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="12"
                      cy="13"
                      r="3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Kenapa kita harus menjaga sungai?
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs">
                  Unggah foto kegiatan untuk mendapatkan point dari Jakal!
                </p>
              </div>
            )}

            {hasEvidence && (
              <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm text-slate-700">Mendapatkan</span>
                <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold tabular-nums">
                  {event.points_per_hunter_override ?? 20} point
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {!hasEvidence ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-6 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                {uploading ? "Mengunggah..." : "Ambil Gambar"}
              </button>
            ) : (
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={completing}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100 disabled:cursor-not-allowed"
                >
                  {completing ? "Memproses..." : "Selesaikan Aksi"}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || completing}
                  className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Ganti Foto
                </button>
              </div>
            )}
          </article>

          {!hasEvidence && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm space-y-3">
              <ReadOnlyField
                label="Tanggal & Waktu"
                value={formatFullDate(event.start_time)}
              />
              <ReadOnlyField label="Lokasi" value={event.river_name} />
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  Informasi
                </p>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 flex items-center justify-between">
                  <span className="text-sm text-slate-700">
                    Penggerak Aksi ke {event.points_per_hunter_override ?? 20}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold tabular-nums">
                    {event.points_per_hunter_override ?? 20} point
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
      <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 text-sm text-slate-700">
        {value}
      </div>
    </div>
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

function translateRpcError(error: string | undefined): string {
  switch (error) {
    case "NOT_AUTHENTICATED":
      return "Sesi habis. Silakan login ulang.";
    case "NOT_REGISTERED":
      return "Kamu belum terdaftar di event ini.";
    case "NOT_CHECKED_IN":
      return "Kamu belum check-in.";
    case "NOT_ACTIVE_ATTENDANCE":
      return "Status kehadiran tidak aktif.";
    case "ALREADY_COMPLETED":
      return "Aksi sudah pernah diselesaikan.";
    case "NO_EVIDENCE_UPLOADED":
      return "Upload foto bukti dulu sebelum selesai.";
    case "GPS_OUT_OF_RANGE":
      return "Kamu di luar lokasi event.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}

// ============================================================================
// REWARD SUCCESS SCREEN
// ============================================================================

interface RewardSuccessScreenProps {
  points: number;
}

function RewardSuccessScreen({ points }: RewardSuccessScreenProps) {
  return (
    <>
      <Head>
        <title>Selamat! · Jakal</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-[#dff1f3] via-[#eef7f8] to-white text-slate-900 flex flex-col">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6 py-10">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="reward-badge">
              <SunburstBadge points={points} />
            </div>

            <div className="reward-title mt-10">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                Selamat kamu telah
                <br />
                mendapatkan {points} poin!
              </h1>
            </div>

            <p className="reward-desc mt-4 text-sm text-slate-500 leading-relaxed max-w-xs">
              Terima kasih atas dedikasimu. Setiap poin yang kamu kumpulkan
              adalah bukti nyata kepedulianmu pada lingkungan
            </p>
          </div>

          <Link
            href="/hunter/dashboard"
            className="reward-cta block w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold text-center hover:bg-slate-800 active:scale-[0.99] transition-all"
          >
            Kembali ke Dashboard
          </Link>
        </div>

        <style jsx global>{`
          @keyframes reward-badge-in {
            0% {
              opacity: 0;
              transform: scale(0.6);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes reward-fade-up {
            0% {
              opacity: 0;
              transform: translateY(12px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes reward-float {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
            }
          }
          .reward-badge {
            opacity: 0;
            animation:
              reward-badge-in 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) 0.1s
                forwards,
              reward-float 3.5s ease-in-out 1s infinite;
          }
          .reward-title {
            opacity: 0;
            animation: reward-fade-up 0.5s ease-out 0.6s forwards;
          }
          .reward-desc {
            opacity: 0;
            animation: reward-fade-up 0.5s ease-out 0.75s forwards;
          }
          .reward-cta {
            opacity: 0;
            animation: reward-fade-up 0.5s ease-out 0.9s forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .reward-badge,
            .reward-title,
            .reward-desc,
            .reward-cta {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

interface SunburstBadgeProps {
  points: number;
}

function SunburstBadge({ points }: SunburstBadgeProps) {
  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      {/* Sunburst background — rotates */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 224 235"
        className="reward-sunburst absolute inset-0 w-full h-full drop-shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
        aria-hidden="true"
      >
        <path
          d="M105.129 4.16643C107.937 -1.38887 115.87 -1.38888 118.677 4.16642L133.475 33.4465C135.375 37.2051 139.971 38.6986 143.717 36.7744L172.899 21.7842C178.436 18.9402 184.854 23.603 183.86 29.7476L178.621 62.1337C177.949 66.291 180.79 70.201 184.951 70.8461L217.371 75.8716C223.522 76.8251 225.973 84.3697 221.558 88.7566L198.283 111.878C195.296 114.846 195.296 119.679 198.283 122.647L221.558 145.769C225.974 150.156 223.522 157.701 217.371 158.654L184.951 163.68C180.79 164.325 177.949 168.235 178.621 172.392L183.86 204.778C184.854 210.923 178.436 215.585 172.899 212.741L143.717 197.751C139.971 195.827 135.375 197.32 133.475 201.079L118.677 230.359C115.87 235.915 107.937 235.915 105.129 230.359L90.3314 201.079C88.4319 197.32 83.8354 195.827 80.0894 197.751L50.9072 212.741C45.3705 215.585 38.9527 210.923 39.9466 204.778L45.1853 172.392C45.8578 168.235 43.017 164.325 38.8554 163.68L6.43556 158.654C0.284563 157.701 -2.16685 150.156 2.24896 145.769L25.5232 122.647C28.5109 119.679 28.5109 114.846 25.5232 111.878L2.24897 88.7566C-2.16684 84.3697 0.28455 76.8251 6.43555 75.8716L38.8554 70.8461C43.017 70.201 45.8578 66.291 45.1853 62.1337L39.9466 29.7476C38.9527 23.603 45.3705 18.9402 50.9072 21.7842L80.0894 36.7744C83.8354 38.6986 88.4319 37.2051 90.3314 33.4465L105.129 4.16643Z"
          fill="#4B8BA7"
        />
      </svg>

      {/* Dark badge front — static */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 190 187"
        className="relative w-[80%] h-[80%]"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="badge-inner-shadow"
            x="0"
            y="0"
            width="189.24"
            height="190.25"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"
            />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          </filter>
        </defs>
        <g filter="url(#badge-inner-shadow)">
          <path
            d="M79.4342 3.4661C89.0308 -1.15535 100.21 -1.15534 109.806 3.46611L157.617 26.4908C167.214 31.1123 174.184 39.8522 176.554 50.2365L188.362 101.973C190.732 112.357 188.245 123.255 181.604 131.583L148.517 173.072C141.876 181.4 131.805 186.25 121.153 186.25H68.0868C57.4355 186.25 47.3638 181.4 40.7228 173.072L7.6363 131.583C0.995289 123.255 -1.49221 112.357 0.877941 101.973L12.6864 50.2365C15.0565 39.8522 22.0264 31.1123 31.6229 26.4908L79.4342 3.4661Z"
            fill="#092430"
          />
        </g>
      </svg>

      {/* Number + label overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="text-white tabular-nums leading-none"
          style={{
            fontSize: "54px",
            fontWeight: 600,
            letterSpacing: "-0.03em",
          }}
        >
          {points}
        </span>
        <span className="text-white/70 text-[13px] mt-1">Point</span>
      </div>
    </div>
  );
}
