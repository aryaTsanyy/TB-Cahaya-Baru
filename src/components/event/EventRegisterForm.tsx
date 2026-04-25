import { useState, useEffect } from "react";
import type { Profile } from "@/contexts/AuthContext";

export interface EventRegistrationData {
  name: string;
  email: string;
}

interface EventRegisterFormProps {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  leaderName: string;
  pointsPerHunter: number;
  profile: Profile;
  userEmail: string;
  isFull: boolean;
  isJoined: boolean;
  submitting: boolean;
  errorMsg: string | null;
  onSubmit: (data: EventRegistrationData) => void;
}

export default function EventRegisterForm({
  eventTitle,
  eventDate,
  eventLocation,
  leaderName,
  pointsPerHunter,
  profile,
  userEmail,
  isFull,
  isJoined,
  submitting,
  errorMsg,
  onSubmit,
}: EventRegisterFormProps) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    setName(profile.full_name ?? profile.username);
    setEmail(userEmail);
  }, [profile, userEmail]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSubmit({ name: name.trim(), email: email.trim() });
  };

  const ctaLabel = isJoined
    ? "Sudah Terdaftar"
    : isFull
      ? "Kuota Penuh"
      : submitting
        ? "Memproses..."
        : "Daftar";

  const ctaDisabled =
    isJoined || isFull || submitting || !name.trim() || !email.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-6 shadow-sm"
    >
      <h1 className="text-xl font-semibold text-slate-900 leading-tight">
        {eventTitle}
      </h1>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        Klik tombol Daftar dibawah ini untuk bergabung dalam aksi pembersihan di{" "}
        {eventLocation.split(",")[0]}.
      </p>

      <div className="mt-6 space-y-4">
        <ReadOnlyField label="Tanggal & Waktu" value={eventDate} />
        <ReadOnlyField label="Alamat" value={eventLocation} />

        <EditableField
          label="Nama"
          id="reg-name"
          type="text"
          value={name}
          onChange={setName}
          placeholder="Nama lengkap"
          required
          disabled={isJoined || submitting}
        />

        <EditableField
          label="Email"
          id="reg-email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="email@contoh.com"
          required
          disabled={isJoined || submitting}
        />

        <div>
          <p className="text-sm font-semibold text-slate-900 mb-2">Informasi</p>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-700 truncate">
              {leaderName}
            </span>
            <span className="flex-shrink-0 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold">
              {pointsPerHunter} point
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={ctaDisabled}
        className="mt-6 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
      >
        {ctaLabel}
      </button>
    </form>
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

interface EditableFieldProps {
  label: string;
  id: string;
  type: "text" | "email";
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required: boolean;
  disabled: boolean;
}

function EditableField({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  required,
  disabled,
}: EditableFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-slate-900 mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}
