import { useEffect, useRef, useState, useCallback } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/SupabaseClient";

type ScannerState = "idle" | "scanning" | "processing" | "success" | "error";

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onCheckInSuccess?: (result: CheckInSuccess) => void;
}

interface CheckInSuccess {
  event_id: string;
  event_title: string;
  attendance_id: string;
  already_checked_in: boolean;
}

interface CheckInResponse {
  success: boolean;
  error?: string;
  event_id?: string;
  event_title?: string;
  attendance_id?: string;
  already_checked_in?: boolean;
}

const SCANNER_ELEMENT_ID = "jakal-qr-scanner-region";

export default function QRScannerModal({
  open,
  onClose,
  onCheckInSuccess,
}: QRScannerModalProps) {
  const [state, setState] = useState<ScannerState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInSuccess | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef<boolean>(false);

  const handleScan = useCallback(
    async (decoded: string): Promise<void> => {
      if (lockRef.current) return;
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

        const success: CheckInSuccess = {
          event_id: res.event_id ?? "",
          event_title: res.event_title ?? "",
          attendance_id: res.attendance_id ?? "",
          already_checked_in: res.already_checked_in ?? false,
        };
        setResult(success);
        setState("success");
        onCheckInSuccess?.(success);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setState("error");
      }
    },
    [onCheckInSuccess],
  );

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        void scannerRef.current.stop().catch(() => undefined);
        scannerRef.current = null;
      }
      setState("idle");
      setErrorMsg(null);
      setResult(null);
      lockRef.current = false;
      return;
    }

    let cancelled = false;

    const start = async (): Promise<void> => {
      setState("scanning");
      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new mod.Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            void handleScan(decodedText);
          },
          () => undefined,
        );
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Gagal akses kamera.");
        setState("error");
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [open, handleScan]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <div className="relative w-full sm:max-w-md mx-auto sm:m-4">
        <div className="relative overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Scan QR Event
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4"
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
          </div>

          <div className="relative aspect-square bg-slate-950 mx-6 rounded-2xl overflow-hidden">
            <div
              id={SCANNER_ELEMENT_ID}
              className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
            />

            {state === "scanning" && (
              <div className="absolute inset-8 border-2 border-white/40 rounded-2xl pointer-events-none" />
            )}

            {state === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin mb-3" />
                <p className="text-sm text-white/90">Memproses...</p>
              </div>
            )}

            {state === "success" && result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/85 backdrop-blur-sm p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-7 h-7 text-emerald-300"
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
                  {result.already_checked_in
                    ? "Sudah Terdaftar"
                    : "Berhasil Daftar!"}
                </p>
                <p className="text-xs text-emerald-100/80 mt-1.5 leading-relaxed">
                  {result.event_title}
                </p>
              </div>
            )}

            {state === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/85 backdrop-blur-sm p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/30 border border-red-400/50 flex items-center justify-center mb-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-7 h-7 text-red-300"
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
                <p className="text-xs text-red-100/80 mt-1.5 leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            )}
          </div>

          <div className="px-6 pt-4 pb-6">
            {state === "scanning" && (
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Arahkan kamera ke QR Code yang ditampilkan oleh Penggerak Aksi
                di lokasi event.
              </p>
            )}

            {(state === "success" || state === "error") && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99]"
              >
                Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function translateError(error: string | undefined): string {
  switch (error) {
    case "NOT_AUTHENTICATED":
      return "Sesi habis. Silakan login ulang.";
    case "INVALID_QR":
      return "QR Code tidak valid atau bukan QR Jakal.";
    case "EVENT_INACTIVE":
      return "Event sudah tidak aktif.";
    case "EVENT_OUT_OF_WINDOW":
      return "Event di luar jadwal.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}
