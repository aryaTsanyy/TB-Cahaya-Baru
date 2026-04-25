import { useEffect, useRef, useState, useCallback, forwardRef } from "react";
import { supabase } from "@/lib/SupabaseClient";

interface StationHandoverModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  stationName: string;
  qualifiedHunterCount: number;
  onSuccess?: (result: ValidationSuccess) => void;
}

interface ValidationSuccess {
  validation_id: string;
  total_points: number;
  qualified_hunters: number;
  points_per_hunter: number;
}

type Step = "weight" | "pin" | "submitting" | "success" | "error";

export default function StationHandoverModal({
  open,
  onClose,
  eventId,
  eventTitle,
  stationName,
  qualifiedHunterCount,
  onSuccess,
}: StationHandoverModalProps) {
  const [step, setStep] = useState<Step>("weight");
  const [weight, setWeight] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationSuccess | null>(null);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const weightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("weight");
        setWeight("");
        setPin(["", "", "", ""]);
        setErrorMsg(null);
        setResult(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open && step === "weight") {
      setTimeout(() => weightInputRef.current?.focus(), 100);
    }
  }, [open, step]);

  useEffect(() => {
    if (step === "pin") {
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "submitting") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  const handleWeightContinue = useCallback(() => {
    const num = parseFloat(weight);
    if (isNaN(num) || num <= 0) {
      setErrorMsg("Berat harus lebih dari 0 kg.");
      return;
    }
    if (num > 100000) {
      setErrorMsg("Berat tidak masuk akal (>100 ton).");
      return;
    }
    setErrorMsg(null);
    setStep("pin");
  }, [weight]);

  const handleSubmit = useCallback(
    async (pinValue: string) => {
      setStep("submitting");
      setErrorMsg(null);

      try {
        const { data, error } = await supabase.rpc(
          "validate_event_at_station",
          {
            p_event_id: eventId,
            p_total_weight_kg: parseFloat(weight),
            p_station_pin: pinValue,
            p_weight_breakdown: {},
            p_notes: null,
          },
        );

        if (error) throw error;

        const res = data as {
          success: boolean;
          error?: string;
          validation_id?: string;
          total_points?: number;
          qualified_hunters?: number;
          points_per_hunter?: number;
        };

        if (!res.success) {
          setErrorMsg(translateError(res.error));
          setStep("pin");
          setPin(["", "", "", ""]);
          setTimeout(() => pinRefs.current[0]?.focus(), 100);
          return;
        }

        const success: ValidationSuccess = {
          validation_id: res.validation_id!,
          total_points: res.total_points!,
          qualified_hunters: res.qualified_hunters!,
          points_per_hunter: res.points_per_hunter!,
        };
        setResult(success);
        setStep("success");
        onSuccess?.(success);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setErrorMsg(msg);
        setStep("error");
      }
    },
    [eventId, weight, onSuccess],
  );

  const handlePinChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(0, 1);
      const newPin = [...pin];
      newPin[index] = digit;
      setPin(newPin);
      setErrorMsg(null);

      if (digit && index < 3) {
        pinRefs.current[index + 1]?.focus();
      }

      if (digit && index === 3 && newPin.every((d) => d !== "")) {
        handleSubmit(newPin.join(""));
      }
    },
    [pin], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handlePinKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !pin[index] && index > 0) {
        pinRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowLeft" && index > 0) {
        pinRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 3) {
        pinRefs.current[index + 1]?.focus();
      }
    },
    [pin],
  );

  const handlePinPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 4);
      if (text.length === 0) return;
      const newPin = ["", "", "", ""];
      for (let i = 0; i < text.length; i++) {
        newPin[i] = text[i];
      }
      setPin(newPin);
      const focusIdx = Math.min(text.length, 3);
      pinRefs.current[focusIdx]?.focus();
      if (text.length === 4) {
        handleSubmit(newPin.join(""));
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* BACKDROP */}
      <button
        aria-label="Tutup modal"
        onClick={() => step !== "submitting" && onClose()}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* PANEL */}
      <div className="relative w-full sm:max-w-md mx-auto sm:m-4 animate-slide-up">
        <div className="relative overflow-hidden rounded-t-3xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl">
          {/* Inner glow accent */}
          <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* HEADER */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <StepDot active={step === "weight"} done={step !== "weight"} />
              <StepConnector />
              <StepDot
                active={step === "pin" || step === "submitting"}
                done={step === "success"}
              />
            </div>
            <button
              onClick={onClose}
              disabled={step === "submitting"}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* BODY */}
          <div className="px-6 py-6">
            {step === "weight" && (
              <WeightStep
                weight={weight}
                onWeightChange={setWeight}
                eventTitle={eventTitle}
                stationName={stationName}
                hunterCount={qualifiedHunterCount}
                errorMsg={errorMsg}
                onContinue={handleWeightContinue}
                inputRef={weightInputRef}
              />
            )}

            {(step === "pin" || step === "submitting") && (
              <PinStep
                pin={pin}
                onPinChange={handlePinChange}
                onPinKeyDown={handlePinKeyDown}
                onPinPaste={handlePinPaste}
                stationName={stationName}
                weight={weight}
                errorMsg={errorMsg}
                submitting={step === "submitting"}
                pinRefs={pinRefs}
                onBack={() => {
                  setStep("weight");
                  setPin(["", "", "", ""]);
                  setErrorMsg(null);
                }}
              />
            )}

            {step === "success" && result && (
              <SuccessStep result={result} onClose={onClose} />
            )}

            {step === "error" && (
              <ErrorStep
                message={errorMsg ?? "Terjadi kesalahan tidak terduga."}
                onRetry={() => {
                  setStep("pin");
                  setPin(["", "", "", ""]);
                  setErrorMsg(null);
                }}
                onClose={onClose}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1);
        }
        @media (min-width: 640px) {
          @keyframes slide-up {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        }
      `}</style>
    </div>
  );
}

interface WeightStepProps {
  weight: string;
  onWeightChange: (v: string) => void;
  eventTitle: string;
  stationName: string;
  hunterCount: number;
  errorMsg: string | null;
  onContinue: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

function WeightStep({
  weight,
  onWeightChange,
  eventTitle,
  stationName,
  hunterCount,
  errorMsg,
  onContinue,
  inputRef,
}: WeightStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium text-sky-400 uppercase tracking-wider mb-1.5">
          Langkah 1 dari 2
        </p>
        <h2 className="text-xl font-semibold text-white">
          Validasi ke Station
        </h2>
        <p className="text-sm text-white/60 mt-1.5 leading-relaxed">
          Masukkan total berat hasil pembersihan yang diterima Station.
        </p>
      </div>

      {/* Event info card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
        <Row label="Event" value={eventTitle} />
        <Row label="Station" value={stationName} />
        <Row label="Hunter qualified" value={`${hunterCount} orang`} />
      </div>

      {/* Weight input */}
      <div>
        <label
          htmlFor="weight"
          className="block text-sm font-medium text-white/80 mb-2"
        >
          Total berat tangkapan
        </label>
        <div className="relative">
          <input
            id="weight"
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            placeholder="0"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onContinue();
            }}
            className="w-full text-3xl font-light text-white placeholder-white/20 bg-white/5 border border-white/15 focus:border-sky-400 focus:bg-white/10 rounded-2xl pl-5 pr-16 py-4 outline-none transition-colors tabular-nums"
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-light text-white/50">
            kg
          </span>
        </div>
        {errorMsg && (
          <p className="text-xs text-red-300 mt-2 flex items-center gap-1.5">
            <AlertIcon className="w-3.5 h-3.5" />
            {errorMsg}
          </p>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={!weight}
        className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed text-white font-medium text-sm transition-all shadow-lg shadow-sky-500/25 border border-sky-400/30"
      >
        Lanjutkan ke PIN Station
      </button>
    </div>
  );
}

// ============================================================================
// STEP: PIN INPUT
// ============================================================================

interface PinStepProps {
  pin: string[];
  onPinChange: (idx: number, v: string) => void;
  onPinKeyDown: (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPinPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  stationName: string;
  weight: string;
  errorMsg: string | null;
  submitting: boolean;
  pinRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onBack: () => void;
}

function PinStep({
  pin,
  onPinChange,
  onPinKeyDown,
  onPinPaste,
  stationName,
  weight,
  errorMsg,
  submitting,
  pinRefs,
  onBack,
}: PinStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium text-sky-400 uppercase tracking-wider mb-1.5">
          Langkah 2 dari 2
        </p>
        <h2 className="text-xl font-semibold text-white">
          Serahkan HP ke Petugas Station
        </h2>
        <p className="text-sm text-white/60 mt-1.5 leading-relaxed">
          Petugas{" "}
          <span className="text-white/90 font-medium">{stationName}</span> akan
          memasukkan PIN Station untuk konfirmasi penerimaan{" "}
          <span className="text-white/90 font-medium tabular-nums">
            {weight} kg
          </span>
          .
        </p>
      </div>

      {/* PIN slots */}
      <div>
        <div className="flex items-center justify-center gap-3">
          {pin.map((digit, idx) => (
            <PinSlot
              key={idx}
              ref={(el) => {
                pinRefs.current[idx] = el;
              }}
              value={digit}
              filled={digit !== ""}
              error={!!errorMsg}
              disabled={submitting}
              onChange={(v) => onPinChange(idx, v)}
              onKeyDown={(e) => onPinKeyDown(idx, e)}
              onPaste={onPinPaste}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-red-300 mt-4 text-center flex items-center justify-center gap-1.5">
            <AlertIcon className="w-3.5 h-3.5" />
            {errorMsg}
          </p>
        )}

        {submitting && !errorMsg && (
          <p className="text-xs text-sky-300/80 mt-4 text-center flex items-center justify-center gap-2">
            <Spinner className="w-3.5 h-3.5" />
            Memverifikasi PIN...
          </p>
        )}
      </div>

      {/* Footer hint + back */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-xs font-medium text-white/50 hover:text-white/80 disabled:opacity-30 transition-colors"
        >
          ← Ubah berat
        </button>
        <p className="text-[11px] text-white/40">PIN tidak ditampilkan</p>
      </div>
    </div>
  );
}

// ============================================================================
// PIN SLOT
// ============================================================================

interface PinSlotProps {
  value: string;
  filled: boolean;
  error: boolean;
  disabled: boolean;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

const PinSlot = forwardRef<HTMLInputElement, PinSlotProps>(function PinSlot(
  { value, filled, error, disabled, onChange, onKeyDown, onPaste, autoFocus },
  ref,
) {
  return (
    <div className="relative">
      <input
        ref={ref}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`
          w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-semibold
          bg-white/5 border-2 rounded-2xl outline-none transition-all
          text-transparent caret-transparent tabular-nums
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            error
              ? "border-red-400/60 bg-red-500/10"
              : filled
                ? "border-sky-400/80 bg-sky-500/10"
                : "border-white/15 focus:border-sky-400 focus:bg-white/10"
          }
        `}
      />
      {/* Visual indicator (dot kalau filled, garis kalau kosong) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {filled ? (
          <div
            className={`w-3 h-3 rounded-full transition-all ${
              error ? "bg-red-400" : "bg-sky-400"
            }`}
          />
        ) : (
          <div className="w-5 h-0.5 bg-white/20 rounded-full" />
        )}
      </div>
    </div>
  );
});

// ============================================================================
// STEP: SUCCESS
// ============================================================================

function SuccessStep({
  result,
  onClose,
}: {
  result: ValidationSuccess;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 text-center py-2">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
          <CheckIcon className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white">Validasi Berhasil</h2>
        <p className="text-sm text-white/60 mt-1.5">
          Poin telah dibagikan ke {result.qualified_hunters} Hunter
        </p>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
        <Row
          label="Total poin"
          value={result.total_points.toLocaleString("id-ID")}
          accent
        />
        <Row
          label="Per Hunter"
          value={result.points_per_hunter.toLocaleString("id-ID")}
          accent
        />
      </div>

      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-medium text-sm transition-all shadow-lg shadow-sky-500/25 border border-sky-400/30"
      >
        Selesai
      </button>
    </div>
  );
}

// ============================================================================
// STEP: ERROR
// ============================================================================

function ErrorStep({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 text-center py-2">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center">
          <AlertIcon className="w-8 h-8 text-red-400" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">Gagal Validasi</h2>
        <p className="text-sm text-white/60 mt-1.5 leading-relaxed">
          {message}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onClose}
          className="py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 font-medium text-sm transition-colors border border-white/20"
        >
          Tutup
        </button>
        <button
          onClick={onRetry}
          className="py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm transition-colors shadow-lg shadow-sky-500/25 border border-sky-400/30"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SHARED SUB-COMPONENTS
// ============================================================================

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          accent ? "text-sky-300 text-base" : "text-white/90"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className={`w-2 h-2 rounded-full transition-all ${
        done
          ? "bg-emerald-400"
          : active
            ? "bg-sky-400 ring-4 ring-sky-400/20"
            : "bg-white/20"
      }`}
    />
  );
}

function StepConnector() {
  return <div className="w-8 h-px bg-white/15" />;
}

// ============================================================================
// ICONS
// ============================================================================

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 6L18 18M6 18L18 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12.5L10 17.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v6M12 16v.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function translateError(error: string | undefined): string {
  switch (error) {
    case "NOT_AUTHENTICATED":
      return "Sesi expired. Silakan login ulang.";
    case "EVENT_NOT_FOUND":
      return "Event tidak ditemukan.";
    case "NOT_EVENT_LEADER":
      return "Hanya Leader event yang dapat melakukan validasi.";
    case "EVENT_HAS_NO_STATION":
      return "Event ini tidak memiliki Station partner.";
    case "STATION_NOT_FOUND":
      return "Station tidak ditemukan.";
    case "STATION_PIN_NOT_SET":
      return "PIN Station belum diatur. Hubungi admin.";
    case "INVALID_PIN_FORMAT":
      return "PIN harus 4 digit angka.";
    case "INVALID_PIN":
      return "PIN salah. Coba lagi.";
    case "EVENT_NOT_ENDED_YET":
      return "Event belum berakhir.";
    case "ALREADY_VALIDATED":
      return "Event ini sudah pernah divalidasi.";
    case "INVALID_WEIGHT":
      return "Berat tidak valid.";
    case "NO_QUALIFIED_HUNTERS":
      return "Tidak ada Hunter yang berhasil check-out.";
    default:
      return "Terjadi kesalahan. Coba lagi.";
  }
}
