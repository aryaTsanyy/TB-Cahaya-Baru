import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { supabase } from "@/lib/SupabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [agreed, setAgreed] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFormValid: boolean =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length >= 6 &&
    agreed;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const username = email
        .trim()
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username,
            role: "hunter",
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setSubmitting(false);
        return;
      }

      if (!data.session) {
        setErrorMsg(
          "Pendaftaran berhasil. Cek email untuk konfirmasi akun, lalu login.",
        );
        setSubmitting(false);
        return;
      }

      void router.push("/hunter/dashboard");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Daftar · Jakal</title>
      </Head>

      <div className="min-h-screen bg-[#dff1f3] text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6">
          <header className="flex items-center justify-between pt-6 pb-4">
            <span className="text-xl font-semibold tracking-tight">Jakal.</span>
            <button
              type="button"
              aria-label="Menu"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white/40 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <section className="pt-6 pb-8">
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Bergabung
              <br />
              Pasukan Kali
            </h1>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Daftar gratis untuk mulai berkontribusi memulihkan sungai dan
              dapatkan poin dari setiap aksimu.
            </p>
          </section>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 mb-5">
            {" "}
            <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-sky-100 text-slate-900 mb-3">
              {" "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
                aria-hidden="true"
              >
                {" "}
                <circle
                  cx="9"
                  cy="8"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />{" "}
                <circle
                  cx="17"
                  cy="9"
                  r="2.2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />{" "}
                <path
                  d="M3 19c0-3 2.5-5 6-5s6 2 6 5M15 19c0-2 1.5-3.5 4-3.5s3 1.5 3 3.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />{" "}
              </svg>{" "}
            </span>{" "}
            <p className="text-sm font-bold text-slate-900">Pasukan Kali</p>{" "}
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {" "}
              Aksi langsung di lapangan untuk bersihkan sungai.{" "}
            </p>{" "}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
              >
                Nama Lengkap
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full rounded-2xl px-4 py-3.5 bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full rounded-2xl px-4 py-3.5 bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                minLength={6}
                required
                className="w-full rounded-2xl px-4 py-3.5 bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none mt-1">
              <span className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="block w-5 h-5 rounded-md border-2 border-slate-300 bg-white peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors" />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="absolute inset-0 w-5 h-5 p-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5L10 17L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-xs text-slate-600 leading-relaxed">
                Saya menyetujui{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-slate-900 underline underline-offset-2"
                >
                  Syarat & Ketentuan
                </Link>{" "}
                serta{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-slate-900 underline underline-offset-2"
                >
                  Kebijakan Privasi
                </Link>{" "}
                Jakal.
              </span>
            </label>

            {errorMsg && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className="mt-3 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
            >
              {submitting ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>
          <div className="mt-8 text-center mb-8">
            <p className="text-sm text-slate-500">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-slate-900 hover:underline underline-offset-4"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
