import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "@/hooks/UseAuth";
import { supabase } from "@/lib/SupabaseClient";

interface StationOption {
  id: string;
  name: string;
}

interface FormState {
  title: string;
  description: string;
  riverName: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  startDateTime: string;
  maxParticipants: string;
  pointsPerHunter: string;
  stationId: string;
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  riverName: "",
  imageFile: null,
  imagePreviewUrl: null,
  startDateTime: "",
  maxParticipants: "10",
  pointsPerHunter: "20",
  stationId: "",
};

const EVENT_DURATION_HOURS = 4;

export default function CreateEventPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [loadingStations, setLoadingStations] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
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

  useEffect(() => {
    const loadStations = async (): Promise<void> => {
      const { data } = await supabase
        .from("stations")
        .select("id, name")
        .eq("verified", true)
        .eq("active", true)
        .order("name", { ascending: true })
        .returns<StationOption[]>();

      setStations(data ?? []);
      if (data && data.length > 0) {
        setForm((prev) => ({ ...prev, stationId: data[0].id }));
      }
      setLoadingStations(false);
    };
    void loadStations();
  }, []);

  useEffect(() => {
    return () => {
      if (form.imagePreviewUrl) {
        URL.revokeObjectURL(form.imagePreviewUrl);
      }
    };
  }, [form.imagePreviewUrl]);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]): void => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran gambar maksimal 5MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg("Format gambar harus JPG, PNG, atau WebP.");
      return;
    }

    setErrorMsg(null);
    if (form.imagePreviewUrl) {
      URL.revokeObjectURL(form.imagePreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreviewUrl: previewUrl,
    }));
  };

  const handleImageRemove = (): void => {
    if (form.imagePreviewUrl) {
      URL.revokeObjectURL(form.imagePreviewUrl);
    }
    setForm((prev) => ({ ...prev, imageFile: null, imagePreviewUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = (): string | null => {
    if (form.title.trim().length < 5)
      return "Nama kegiatan minimal 5 karakter.";
    if (form.riverName.trim().length < 3)
      return "Lokasi sungai minimal 3 karakter.";
    if (!form.startDateTime) return "Tanggal & waktu wajib diisi.";
    if (!form.stationId) return "Station partner wajib dipilih.";

    const start = new Date(form.startDateTime);
    if (isNaN(start.getTime())) return "Format tanggal tidak valid.";

    const maxP = parseInt(form.maxParticipants, 10);
    if (isNaN(maxP) || maxP < 1 || maxP > 500) {
      return "Jumlah Pasukan Kali harus antara 1-500.";
    }

    const points = parseInt(form.pointsPerHunter, 10);
    if (isNaN(points) || points < 1 || points > 10000) {
      return "Point harus antara 1-10000.";
    }

    return null;
  };

  const uploadImage = async (
    file: File,
    userId: string,
  ): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error } = await supabase.storage
      .from("event-images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      throw new Error(`Upload gambar gagal: ${error.message}`);
    }

    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!profile) return;

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let imageUrl: string | null = null;
      if (form.imageFile) {
        imageUrl = await uploadImage(form.imageFile, profile.id);
      }

      const startTime = new Date(form.startDateTime);
      const endTime = new Date(
        startTime.getTime() + EVENT_DURATION_HOURS * 60 * 60 * 1000,
      );

      const { data, error } = await supabase
        .from("events")
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          river_name: form.riverName.trim(),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          leader_id: profile.id,
          station_id: form.stationId,
          max_participants: parseInt(form.maxParticipants, 10),
          points_per_hunter_override: parseInt(form.pointsPerHunter, 10),
          radius_meters: 100,
          min_duration_minutes: 30,
          status: "upcoming",
          image_url: imageUrl,
        })
        .select("id")
        .single<{ id: string }>();

      if (error || !data) {
        throw new Error(error?.message ?? "Gagal membuat event.");
      }

      void router.push(`/events/${data.id}/manage`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#dff1f3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Buat Event · Jakal</title>
      </Head>

      <div className="min-h-screen bg-[#dff1f3] text-slate-900">
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

          <form
            onSubmit={handleSubmit}
            className="flex-1 rounded-3xl bg-white p-6 shadow-sm space-y-6"
          >
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Nama Kegiatan
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Pembersihan Sungai Serayu"
                required
                maxLength={120}
                className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Deskripsi
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Tulis deskripsi disini..."
                rows={4}
                maxLength={500}
                className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="riverName"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Lokasi Sungai
              </label>
              <input
                id="riverName"
                type="text"
                value={form.riverName}
                onChange={(e) => updateField("riverName", e.target.value)}
                placeholder="Sungai Banjir Kanal Barat, Semarang"
                required
                maxLength={200}
                className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Gambar Kegiatan
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              {form.imagePreviewUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imagePreviewUrl}
                    alt="Preview"
                    className="w-full aspect-[16/9] object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    aria-label="Hapus gambar"
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-sm text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
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
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 transition-colors py-12 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-10 h-10 flex items-center justify-center text-slate-700">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-7 h-7"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500">
                    Upload gambar untuk kegiatan
                  </p>
                </button>
              )}
            </div>

            <div>
              <label
                htmlFor="startDateTime"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Tanggal & Waktu
              </label>
              <input
                id="startDateTime"
                type="datetime-local"
                value={form.startDateTime}
                onChange={(e) => updateField("startDateTime", e.target.value)}
                required
                className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors tabular-nums"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Durasi event otomatis {EVENT_DURATION_HOURS} jam dari waktu
                mulai.
              </p>
            </div>

            <div>
              <label
                htmlFor="stationId"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Station Partner
              </label>
              {loadingStations ? (
                <div className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-400">
                  Memuat station...
                </div>
              ) : stations.length === 0 ? (
                <div className="w-full rounded-2xl px-4 py-3.5 bg-amber-50 border border-amber-200 text-xs text-amber-700 leading-relaxed">
                  Belum ada Station verified. Hubungi admin untuk menambahkan
                  partner.
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="stationId"
                    value={form.stationId}
                    onChange={(e) => updateField("stationId", e.target.value)}
                    required
                    className="w-full appearance-none rounded-2xl px-4 py-3.5 pr-10 bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                  >
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Butuh Berapa Pasukan Kali?
              </label>
              <input
                id="maxParticipants"
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                value={form.maxParticipants}
                onChange={(e) => updateField("maxParticipants", e.target.value)}
                required
                className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="pointsPerHunter"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Point yang diberikan
              </label>
              <input
                id="pointsPerHunter"
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                value={form.pointsPerHunter}
                onChange={(e) => updateField("pointsPerHunter", e.target.value)}
                required
                className="w-full rounded-2xl px-4 py-3.5 bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors tabular-nums"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Setiap Pasukan Kali yang hadir & qualified mendapat poin ini.
              </p>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Status
              </label>
              <div className="relative">
                <select
                  id="status"
                  value="upcoming"
                  disabled
                  className="w-full appearance-none rounded-2xl px-4 py-3.5 pr-10 bg-slate-50 border border-slate-200 text-sm text-slate-900 cursor-not-allowed"
                >
                  <option value="upcoming">Mendatang</option>
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || stations.length === 0}
              className="w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
            >
              {submitting ? "Membuat..." : "Buat Kegiatan"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
