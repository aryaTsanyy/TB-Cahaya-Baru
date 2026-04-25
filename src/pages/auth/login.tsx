import { useState, useEffect } from "react";

import { useRouter } from "next/router";

import Link from "next/link";

import Head from "next/head";

import { supabase } from "@/lib/SupabaseClient";

type Role = "hunter" | "leader";

interface RoleOption {
  id: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const LeaderIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    {" "}
    <path
      d="M18.0407 16.5626C16.8508 14.5055 15.0172 13.0305 12.8774 12.3313C13.9358 11.7012 14.7582 10.741 15.2182 9.59833C15.6781 8.45561 15.7503 7.19349 15.4235 6.0058C15.0968 4.81811 14.3892 3.77051 13.4094 3.0239C12.4296 2.27728 11.2318 1.87292 10 1.87292C8.76821 1.87292 7.57044 2.27728 6.59067 3.0239C5.6109 3.77051 4.90331 4.81811 4.57654 6.0058C4.24978 7.19349 4.32193 8.45561 4.78189 9.59833C5.24186 10.741 6.06422 11.7012 7.12268 12.3313C4.98284 13.0297 3.14925 14.5047 1.9594 16.5626C1.91577 16.6337 1.88683 16.7129 1.87429 16.7954C1.86174 16.8779 1.86585 16.9621 1.88638 17.043C1.9069 17.1239 1.94341 17.1998 1.99377 17.2664C2.04413 17.333 2.10731 17.3888 2.17958 17.4305C2.25185 17.4722 2.33175 17.4991 2.41457 17.5095C2.49738 17.5198 2.58143 17.5135 2.66176 17.4909C2.74209 17.4682 2.81708 17.4297 2.88228 17.3776C2.94749 17.3255 3.00161 17.2609 3.04143 17.1876C4.51331 14.6438 7.11487 13.1251 10 13.1251C12.8852 13.1251 15.4867 14.6438 16.9586 17.1876C16.9984 17.2609 17.0526 17.3255 17.1178 17.3776C17.183 17.4297 17.258 17.4682 17.3383 17.4909C17.4186 17.5135 17.5027 17.5198 17.5855 17.5095C17.6683 17.4991 17.7482 17.4722 17.8205 17.4305C17.8927 17.3888 17.9559 17.333 18.0063 17.2664C18.0566 17.1998 18.0932 17.1239 18.1137 17.043C18.1342 16.9621 18.1383 16.8779 18.1258 16.7954C18.1132 16.7129 18.0843 16.6337 18.0407 16.5626ZM5.62503 7.50005C5.62503 6.63476 5.88162 5.7889 6.36235 5.06943C6.84308 4.34997 7.52636 3.78921 8.32579 3.45808C9.12521 3.12694 10.0049 3.0403 10.8535 3.20911C11.7022 3.37792 12.4818 3.7946 13.0936 4.40646C13.7055 5.01831 14.1222 5.79786 14.291 6.64653C14.4598 7.4952 14.3731 8.37486 14.042 9.17429C13.7109 9.97372 13.1501 10.657 12.4306 11.1377C11.7112 11.6185 10.8653 11.8751 10 11.8751C8.84009 11.8738 7.72801 11.4125 6.90781 10.5923C6.0876 9.77207 5.62627 8.65999 5.62503 7.50005Z"
      fill="black"
    />{" "}
  </svg>
);
const HunterIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    {""}
    <path
      d="M19.1247 11.7501C19.0591 11.7993 18.9844 11.8351 18.9049 11.8555C18.8254 11.8759 18.7426 11.8804 18.6614 11.8688C18.5801 11.8572 18.5019 11.8297 18.4313 11.7879C18.3607 11.746 18.299 11.6907 18.2497 11.6251C17.873 11.1187 17.3827 10.7079 16.8182 10.4256C16.2537 10.1434 15.6309 9.99761 14.9997 10.0001C14.8768 10 14.7567 9.9638 14.6543 9.89585C14.5519 9.8279 14.4717 9.73126 14.424 9.61803C14.3915 9.54113 14.3748 9.45852 14.3748 9.37506C14.3748 9.2916 14.3915 9.20898 14.424 9.13209C14.4717 9.01885 14.5519 8.92222 14.6543 8.85427C14.7567 8.78632 14.8768 8.75007 14.9997 8.75006C15.3504 8.75003 15.6941 8.65165 15.9916 8.46611C16.2892 8.28056 16.5288 8.01528 16.6832 7.7004C16.8375 7.38552 16.9005 7.03367 16.8649 6.68479C16.8293 6.33592 16.6966 6.00402 16.4819 5.72679C16.2671 5.44957 15.9789 5.23812 15.65 5.11648C15.3211 4.99483 14.9646 4.96787 14.6212 5.03864C14.2777 5.10941 13.961 5.27509 13.707 5.51685C13.4529 5.75861 13.2718 6.06676 13.1841 6.40631C13.1636 6.48582 13.1276 6.56051 13.0782 6.62612C13.0289 6.69172 12.967 6.74696 12.8963 6.78867C12.8256 6.83039 12.7473 6.85776 12.666 6.86923C12.5847 6.8807 12.5019 6.87605 12.4224 6.85553C12.3429 6.83501 12.2682 6.79903 12.2026 6.74964C12.137 6.70026 12.0818 6.63844 12.04 6.5677C11.9983 6.49697 11.971 6.41872 11.9595 6.3374C11.948 6.25609 11.9527 6.17332 11.9732 6.09381C12.0949 5.62296 12.3248 5.18701 12.6446 4.82065C12.9644 4.45428 13.3653 4.16761 13.8154 3.98346C14.2655 3.7993 14.7524 3.72273 15.2373 3.75985C15.7222 3.79696 16.1917 3.94674 16.6086 4.19725C17.0254 4.44777 17.378 4.79211 17.6383 5.20288C17.8987 5.61366 18.0595 6.07952 18.1081 6.5634C18.1567 7.04728 18.0917 7.53583 17.9183 7.99017C17.7449 8.44452 17.4678 8.85211 17.1091 9.18053C17.959 9.54849 18.6978 10.1324 19.2521 10.8743C19.3013 10.9401 19.3371 11.015 19.3574 11.0947C19.3776 11.1743 19.382 11.2572 19.3701 11.3386C19.3583 11.4199 19.3305 11.4982 19.2884 11.5688C19.2463 11.6394 19.1907 11.701 19.1247 11.7501ZM14.9154 16.5626C14.9606 16.6337 14.991 16.7132 15.0046 16.7964C15.0183 16.8796 15.015 16.9647 14.995 17.0465C14.9749 17.1284 14.9385 17.2054 14.8879 17.2728C14.8374 17.3403 14.7737 17.3968 14.7007 17.439C14.6277 17.4811 14.547 17.5081 14.4633 17.5183C14.3796 17.5285 14.2947 17.5216 14.2138 17.4981C14.1328 17.4746 14.0575 17.435 13.9922 17.3816C13.927 17.3283 13.8732 17.2622 13.8341 17.1876C13.4404 16.5209 12.8797 15.9684 12.2073 15.5846C11.5349 15.2008 10.774 14.9989 9.99975 14.9989C9.22551 14.9989 8.46464 15.2008 7.79223 15.5846C7.11982 15.9684 6.55909 16.5209 6.16537 17.1876C6.1263 17.2622 6.07253 17.3283 6.00728 17.3816C5.94203 17.435 5.86666 17.4746 5.78571 17.4981C5.70475 17.5216 5.61988 17.5285 5.53621 17.5183C5.45253 17.5081 5.37177 17.4811 5.29879 17.439C5.22582 17.3968 5.16212 17.3403 5.11155 17.2728C5.06098 17.2054 5.02457 17.1284 5.00452 17.0465C4.98446 16.9647 4.98118 16.8796 4.99486 16.7964C5.00854 16.7132 5.0389 16.6337 5.08412 16.5626C5.69006 15.5214 6.61396 14.7021 7.72006 14.2251C7.09766 13.7485 6.64024 13.0889 6.41209 12.339C6.18395 11.589 6.19655 10.7865 6.44812 10.044C6.69969 9.30163 7.1776 8.65672 7.81465 8.19996C8.4517 7.7432 9.21587 7.49755 9.99975 7.49755C10.7836 7.49755 11.5478 7.7432 12.1849 8.19996C12.8219 8.65672 13.2998 9.30163 13.5514 10.044C13.803 10.7865 13.8156 11.589 13.5874 12.339C13.3593 13.0889 12.9018 13.7485 12.2794 14.2251C13.3855 14.7021 14.3094 15.5214 14.9154 16.5626ZM9.99975 13.7501C10.4942 13.7501 10.9776 13.6034 11.3887 13.3287C11.7998 13.054 12.1202 12.6636 12.3094 12.2068C12.4987 11.75 12.5482 11.2473 12.4517 10.7623C12.3552 10.2774 12.1171 9.83192 11.7675 9.48229C11.4179 9.13266 10.9724 8.89456 10.4875 8.79809C10.0025 8.70163 9.49986 8.75114 9.04304 8.94036C8.58622 9.12958 8.19578 9.45001 7.92108 9.86113C7.64637 10.2723 7.49975 10.7556 7.49975 11.2501C7.49975 11.9131 7.76314 12.549 8.23198 13.0178C8.70082 13.4867 9.33671 13.7501 9.99975 13.7501ZM5.62475 9.37506C5.62475 9.2093 5.5589 9.05033 5.44169 8.93312C5.32448 8.81591 5.16551 8.75006 4.99975 8.75006C4.64907 8.75003 4.30542 8.65165 4.00785 8.46611C3.71028 8.28056 3.4707 8.01528 3.31634 7.7004C3.16197 7.38552 3.09901 7.03367 3.13459 6.68479C3.17018 6.33592 3.30289 6.00402 3.51765 5.72679C3.7324 5.44957 4.02061 5.23812 4.34951 5.11648C4.67842 4.99483 5.03485 4.96787 5.37832 5.03864C5.72178 5.10941 6.03852 5.27509 6.29254 5.51685C6.54657 5.75861 6.7277 6.06676 6.81537 6.40631C6.85681 6.56689 6.96035 6.70443 7.1032 6.78867C7.24605 6.87292 7.41651 6.89697 7.57709 6.85553C7.73767 6.81409 7.87521 6.71055 7.95946 6.5677C8.0437 6.42485 8.06775 6.25439 8.02631 6.09381C7.90463 5.62296 7.67473 5.18701 7.35491 4.82065C7.0351 4.45428 6.63419 4.16761 6.18409 3.98346C5.73399 3.7993 5.24712 3.72273 4.76222 3.75985C4.27732 3.79696 3.80777 3.94674 3.39094 4.19725C2.97411 4.44777 2.6215 4.79211 2.36117 5.20288C2.10084 5.61366 1.93997 6.07952 1.89136 6.5634C1.84276 7.04728 1.90776 7.53583 2.08119 7.99017C2.25462 8.44452 2.5317 8.85211 2.89037 9.18053C2.04138 9.54884 1.30343 10.1327 0.749749 10.8743C0.650189 11.0069 0.607385 11.1736 0.630754 11.3378C0.654123 11.5019 0.74175 11.6501 0.874358 11.7497C1.00697 11.8492 1.17369 11.892 1.33786 11.8687C1.50203 11.8453 1.65019 11.7577 1.74975 11.6251C2.12646 11.1187 2.61679 10.7079 3.18128 10.4256C3.74577 10.1434 4.36864 9.99761 4.99975 10.0001C5.16551 10.0001 5.32448 9.93421 5.44169 9.817C5.5589 9.69979 5.62475 9.54082 5.62475 9.37506Z"
      fill="#092430"
    />
  </svg>
);

const ROLE_OPTIONS: ReadonlyArray<RoleOption> = [
  {
    id: "hunter",
    label: "Pasukan Kali",
    description: "Aksi langsung di lapangan untuk bersihkan sungai.",
    icon: HunterIcon,
  },

  {
    id: "leader",
    label: "Penggerak Aksi",
    description: "Pimpin komunitas dan organisir aksi lingkungan.",
    icon: LeaderIcon,
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role>("hunter");

  const [email, setEmail] = useState<string>("");

  const [password, setPassword] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) return;

    setSubmitting(true);

    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),

        password,
      });

      if (error || !data.user) {
        setErrorMsg(
          error?.message ?? "Gagal masuk. Periksa email & kata sandi.",
        );

        setSubmitting(false);

        return;
      }

      const { data: profile, error: profileError } = await supabase

        .from("profiles")

        .select("role")

        .eq("id", data.user.id)

        .single<{ role: Role }>();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        setErrorMsg("Profil tidak ditemukan. Hubungi admin.");

        setSubmitting(false);

        return;
      }

      if (profile.role !== selectedRole) {
        await supabase.auth.signOut();

        setErrorMsg(
          selectedRole === "leader"
            ? "Akun ini bukan Penggerak Aksi."
            : "Akun ini bukan Pasukan Kali.",
        );

        setSubmitting(false);

        return;
      }

      void router.push(
        profile.role === "hunter" ? "/hunter/dashboard" : "/leader/dashboard",
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");

      setSubmitting(false);
    }
  };

  const navigateToLandingSection = (section: string) => {
    router.push(`/?section=${section}`);
  };

  return (
    <>
      <Head>
        <title>Masuk · Jakal</title>
      </Head>

      <div className="min-h-screen bg-[#dff1f3] text-slate-900">
        <div className="mx-auto w-full max-w-md min-h-screen flex flex-col px-6">
          {/* --- STICKY LIQUID GLASS NAVBAR --- */}
          <header
            className={`fixed top-0 left-0 right-0 z-[70] flex justify-between items-center px-6 rounded-b-2xl py-5 transition-all duration-300 max-w-md mx-auto ${
              isScrolled || isMenuOpen
                ? "bg-white/50 backdrop-blur-sm border-b border-white/20"
                : "bg-transparent"
            }`}
          >
            <h1
              className="text-2xl font-bold text-slate-900 tracking-tight cursor-pointer"
              onClick={() => router.push("/")}
            >
              Jakal.
            </h1>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-full transition-all focus:outline-none ${
                isMenuOpen ? "bg-slate-900/5" : "bg-transparent"
              }`}
            >
              {isMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-slate-900"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-slate-800"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12h18M3 6h18M3 18h18"
                  />
                </svg>
              )}
            </button>
          </header>

          {/* --- 1/4 SCREEN LIQUID GLASS DROPDOWN MENU --- */}
          <div
            className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out max-w-md mx-auto overflow-hidden ${
              isMenuOpen
                ? "translate-y-0 opacity-100 max-h-[40vh]"
                : "-translate-y-full opacity-0 max-h-0"
            }`}
          >
            <div className="bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-lg rounded-b-3xl">
              <nav className="flex flex-col px-8 pt-28 pb-10 gap-6">
                {/* Navigasi Beranda */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left text-xl font-extrabold text-slate-900 tracking-tight transition-all active:scale-95 active:text-sky-700"
                >
                  Beranda
                </button>

                {/* Navigasi Tentang Kami (FAQ) */}
                <button
                  onClick={() => navigateToLandingSection("faq")}
                  className="text-left text-xl font-extrabold text-slate-900 tracking-tight transition-all active:scale-95 active:text-sky-700"
                >
                  Tentang Kami
                </button>

                {/* Navigasi Aksi (Impact) */}
                <button
                  onClick={() => navigateToLandingSection("impact-section")}
                  className="text-left text-xl font-extrabold text-slate-900 tracking-tight transition-all active:scale-95 active:text-sky-700"
                >
                  Aksi
                </button>
              </nav>
            </div>
          </div>

          {/* Backdrop tetap sama */}
          {isMenuOpen && (
            <div
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[50] bg-slate-900/10 backdrop-blur-[1px] transition-opacity duration-300"
            />
          )}

          {/* Spacer & Sisa Konten Landing Page ... */}
          <div className="h-20" />

          <section className="pt-6 pb-8">
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Jaga Kali,
              <br />
              Jaga Hidup Kita
            </h1>

            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Masuk untuk bergabung dalam aksi pemulihan sungai bersama
              komunitas.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Pilih peran
              </p>

              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((option) => {
                  const isActive = selectedRole === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedRole(option.id)}
                      aria-pressed={isActive}
                      className={`text-left rounded-2xl px-4 py-3.5 transition-all ${
                        isActive
                          ? "bg-white border-2 border-slate-900 shadow-sm"
                          : "bg-white/60 border-2 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-sky-100 text-slate-900 mb-3">
                        {" "}
                        {option.icon}{" "}
                      </span>{" "}
                      <p
                        className={`text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-700"}`}
                      >
                        {option.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl px-4 py-3.5 bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
              />

              <div className="flex justify-end mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Lupa kata sandi?
                </Link>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !email.trim() || !password.trim()}
              className="mt-2 w-full py-4 rounded-2xl bg-slate-900 text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
            >
              {submitting ? "Memproses..." : "Masuk Sekarang"}
            </button>
          </form>
          <div className="mt-8 mb-8 text-center">
            <p className="text-sm text-slate-500">
              Belum punya akun?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-slate-900 hover:underline underline-offset-4"
              >
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
