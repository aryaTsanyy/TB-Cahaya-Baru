import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import type { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";

type ScannerState =
  | "starting"
  | "scanning"
  | "processing"
  | "success"
  | "error";

interface CheckInResponse {
  success: boolean;
  error?: string;
  event_id?: string;
  attendance_id?: string;
  already_checked_in?: boolean;
}

const SCANNER_ID = "jakal-fullscreen-scanner";

export default function CheckInPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const eventId = typeof router.query.id === "string" ? router.query.id : null;

  const [state, setState] = useState<ScannerState>("starting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef<boolean>(false);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) void router.replace("/login");
  }, [profile, isLoading, router]);

  const handleScan = useCallback(
    async (decoded: string): Promise<void> => {
      if (lockRef.current || !eventId) return;
      lockRef.current = true;

      setState("processing");
      setErrorMsg(null);

      try {
        if (scannerRef.current) {
          await scannerRef.current.stop().catch(() => undefined);
        }
      } catch {
        // ignore
      }

      try {
        const { data, error } = await supabase.rpc("check_in_event", {
          p_qr_token: decoded,
        });

        if (error) {
          setErrorMsg(error.message);
          setState("error");
          return;
        }

        const res = data as CheckInResponse;
        if (!res.success) {
          setErrorMsg(translateError(res.error));
          setState("error");
          return;
        }

        if (res.event_id !== eventId) {
          setErrorMsg("QR ini bukan untuk event yang sedang Anda daftar.");
          setState("error");
          return;
        }

        setState("success");
        setTimeout(() => {
          void router.replace(`/events/${eventId}/complete`);
        }, 800);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setState("error");
      }
    },
    [eventId, router],
  );

  useEffect(() => {
    if (!profile || !eventId) return;
    let cancelled = false;

    const start = async (): Promise<void> => {
      try {
        if (
          typeof window !== "undefined" &&
          window.location.protocol === "http:" &&
          window.location.hostname !== "localhost"
        ) {
          throw new Error("HTTPS_REQUIRED");
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("CAMERA_NOT_SUPPORTED");
        }

        const mod = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new mod.Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;

        // Compute qrbox size: 70% of shortest viewport dimension
        const minDim = Math.min(window.innerWidth, window.innerHeight);
        const qrSize = Math.floor(minDim * 0.7);

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: qrSize, height: qrSize },
            aspectRatio: window.innerWidth / window.innerHeight,
          },
          (decodedText: string) => {
            void handleScan(decodedText);
          },
          () => undefined,
        );

        if (!cancelled) setState("scanning");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(parseCameraError(err));
        setState("error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        void scannerRef.current.stop().catch(() => undefined);
        scannerRef.current = null;
      }
    };
  }, [profile, eventId, handleScan]);

  const handleRetry = (): void => {
    lockRef.current = false;
    setErrorMsg(null);
    setState("starting");
    void router.replace(router.asPath);
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Scan QR · Jakal</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
      </Head>

      <div className="fixed inset-0 bg-black text-white overflow-hidden">
        {/* Scanner container — render dengan video fullscreen via global CSS */}
        <div id={SCANNER_ID} className="absolute inset-0 z-0 jakal-scanner" />

        {/* Overlay — frame guides, tombol close, hint text */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
          <div className="flex-1" />

          {/* Frame guides */}
          <div className="relative w-64 h-64 mx-auto">
            <CornerBracket className="absolute -top-1 -left-1" />
            <CornerBracket className="absolute -top-1 -right-1 rotate-90" />
            <CornerBracket className="absolute -bottom-1 -right-1 rotate-180" />
            <CornerBracket className="absolute -bottom-1 -left-1 -rotate-90" />
          </div>

          <div className="flex-1 flex items-start justify-center px-8 pt-12">
            {state === "scanning" && (
              <p className="text-sm text-white/90 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Scan QR Code untuk mendeteksi kehadiran
              </p>
            )}
            {state === "starting" && (
              <p className="text-sm text-white/70 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Memuat kamera...
              </p>
            )}
          </div>

          <div className="h-12" />
        </div>

        {/* Close button — pointer-events enabled */}
        <button
          type="button"
          onClick={() => void router.back()}
          aria-label="Tutup"
          className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          style={{ top: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              d="M6 6L18 18M6 18L18 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Processing overlay */}
        {state === "processing" && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
            <p className="text-sm text-white/90">Memproses...</p>
          </div>
        )}

        {/* Success overlay */}
        {state === "success" && (
          <div className="absolute inset-0 z-30 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-emerald-300"
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
            <p className="text-base font-semibold text-white">
              Kehadiran Tercatat
            </p>
            <p className="text-xs text-emerald-100/80 mt-2">
              Mengarahkan ke halaman aksi...
            </p>
          </div>
        )}

        {/* Error overlay */}
        {state === "error" && (
          <div className="absolute inset-0 z-30 bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/30 border border-red-400/50 flex items-center justify-center mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8 text-red-300"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 7v6M12 16v.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-white">Gagal</p>
            <p className="text-xs text-red-100/80 mt-2 max-w-xs leading-relaxed">
              {errorMsg}
            </p>

            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full py-3.5 rounded-2xl bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={() => void router.back()}
                className="w-full py-3.5 rounded-2xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors border border-white/20"
              >
                Kembali
              </button>
            </div>
          </div>
        )}

        {/* Global styles untuk override html5-qrcode internal layout */}
        <style jsx global>{`
          .jakal-scanner {
            width: 100% !important;
            height: 100% !important;
          }
          .jakal-scanner > div {
            width: 100% !important;
            height: 100% !important;
            padding: 0 !important;
            border: 0 !important;
          }
          .jakal-scanner video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
          }
          .jakal-scanner canvas {
            display: none !important;
          }
        `}</style>
      </div>
    </>
  );
}

function CornerBracket({ className = "" }: { className?: string }) {
  return (
    <div className={`w-12 h-12 ${className}`}>
      <div className="absolute top-0 left-0 w-8 h-1 bg-white rounded-full" />
      <div className="absolute top-0 left-0 w-1 h-8 bg-white rounded-full" />
    </div>
  );
}

function parseCameraError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "HTTPS_REQUIRED") {
      return "Kamera butuh HTTPS. Akses via domain HTTPS (bukan IP lokal).";
    }
    if (err.message === "CAMERA_NOT_SUPPORTED") {
      return "Browser tidak mendukung akses kamera.";
    }
    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      return "Akses kamera ditolak. Buka pengaturan browser dan izinkan kamera untuk situs ini.";
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "Tidak ada kamera di perangkat ini.";
    }
    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain dulu.";
    }
    if (err.name === "SecurityError") {
      return "Akses kamera diblokir. Pastikan situs HTTPS dan izin kamera aktif.";
    }
    return err.message;
  }
  return "Gagal akses kamera. Coba refresh halaman.";
}

function translateError(error: string | undefined): string {
  switch (error) {
    case "NOT_AUTHENTICATED":
      return "Sesi habis. Silakan login ulang.";
    case "INVALID_QR":
      return "QR Code tidak valid. Pastikan QR berasal dari Jakal.";
    case "EVENT_INACTIVE":
      return "Event sudah tidak aktif atau sudah selesai.";
    case "EVENT_OUT_OF_WINDOW":
      return "Event di luar jadwal. Belum dimulai atau sudah berakhir.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}
