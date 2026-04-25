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

        // Validasi: QR ini harus untuk event yang sama dengan halaman ini
        if (res.event_id !== eventId) {
          setErrorMsg("QR ini bukan untuk event ini.");
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
        const mod = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new mod.Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            void handleScan(decodedText);
          },
          () => undefined,
        );

        if (!cancelled) setState("scanning");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Gagal akses kamera.");
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
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <div
          id={SCANNER_ID}
          className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
        />

        <div className="absolute inset-0 pointer-events-none flex flex-col">
          <div className="flex-1" />

          <div className="relative w-64 h-64 mx-auto">
            <CornerBracket className="absolute -top-1 -left-1" />
            <CornerBracket className="absolute -top-1 -right-1 rotate-90" />
            <CornerBracket className="absolute -bottom-1 -right-1 rotate-180" />
            <CornerBracket className="absolute -bottom-1 -left-1 -rotate-90" />
          </div>

          <div className="flex-1 flex items-center justify-center px-8 pt-12">
            {state === "scanning" && (
              <p className="text-sm text-white/80 text-center">
                Scan QR Code untuk mendeteksi kehadiran
              </p>
            )}
            {state === "starting" && (
              <p className="text-sm text-white/60 text-center">
                Memuat kamera...
              </p>
            )}
          </div>

          <div className="h-20" />
        </div>

        <button
          type="button"
          onClick={() => void router.back()}
          aria-label="Tutup"
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors pointer-events-auto"
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

        {state === "processing" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
            <p className="text-sm text-white/90">Memproses...</p>
          </div>
        )}

        {state === "success" && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center px-8 text-center">
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

        {state === "error" && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center px-8 text-center">
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

function translateError(error: string | undefined): string {
  switch (error) {
    case "NOT_AUTHENTICATED":
      return "Sesi habis. Silakan login ulang.";
    case "INVALID_QR":
      return "QR Code tidak valid.";
    case "EVENT_INACTIVE":
      return "Event sudah tidak aktif.";
    case "EVENT_OUT_OF_WINDOW":
      return "Event di luar jadwal.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}
