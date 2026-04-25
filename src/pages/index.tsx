import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const jakalGradient = {
    background:
      "linear-gradient(180deg, #D7F9FA 0%, #E6F3FC 60.1%, #FEFFFF 100%)",
  };

  const faqs = [
    {
      question: "Kenapa kita harus menjaga sungai?",
      answer:
        "Sungai yang bersih adalah sumber air bersih dan kunci ekosistem yang sehat bagi kita semua.",
    },
    {
      question: "Bagaimana cara ikut bergabung?",
      answer:
        "Cukup daftar melalui aplikasi Jakal, pilih peran sebagai Pasukan Kali atau Penggerak Aksi, dan ikuti misi pembersihan terdekat di kota Anda.",
    },
    {
      question: "Apakah ada biaya untuk mendaftar?",
      answer:
        "Tidak ada biaya sama sekali. Program ini 100% gratis dan Anda justru bisa mendapatkan poin yang bisa ditukarkan.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
      <Head>
        <title>Jakal - Jaga Kali, Jaga Hidup Kita</title>
      </Head>
      <div
        className="min-h-screen flex flex-col relative z-10"
        style={jakalGradient}
      >
        {/* --- STICKY LIQUID GLASS NAVBAR --- */}
        <header
          className={`fixed top-0 left-0 right-0 z-[70] flex justify-between items-center px-6 rounded-b-2xl py-5 transition-all duration-300 max-w-md mx-auto ${
            isScrolled || isMenuOpen
              ? "bg-white/50 backdrop-blur-sm border-b border-white/20"
              : "bg-transparent"
          }`}
        >
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Jakal.
          </h1>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-full transition-all focus:outline-none ${
              isMenuOpen ? "bg-slate-900/5" : "bg-transparent"
            }`}
          >
            {isMenuOpen ? (
              /* Close Icon (X) */
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
              /* Hamburger Icon */
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
          {/* Efek Liquid Glass UI diterapkan di container ini */}
          <div className="bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-lg rounded-b-3xl">
            <nav className="flex flex-col px-8 pt-28 pb-10 gap-6">
              {["Beranda", "Tentang Kami", "Aksi"].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (item === "Beranda") router.push("/");
                  }}
                  className="text-left text-xl font-extrabold text-slate-900 tracking-tight transition-all active:scale-95 active:text-sky-700"
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Backdrop Transparan agar 3/4 layar bawah sedikit blur saat menu buka */}
        {isMenuOpen && (
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-[50] bg-slate-900/10 backdrop-blur-[1px] transition-opacity duration-300"
          />
        )}

        {/* Spacer & Sisa Konten Landing Page ... */}
        <div className="h-20" />
        {/* Hero Content */}
        <section className="px-6 pt-2 pb-6">
          <p className="text-sm font-medium text-slate-500 mb-2">lorem ipsum</p>
          <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-4">
            Jaga Kali,
            <br />
            Jaga Hidup Kita
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed pr-4 mb-8">
            Jadilah bagian dari solusi. Pilih untuk menjadi pasukan kali di
            garis depan atau penggerak aksi perubahan hari ini.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/auth/login")}
              className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              Mulai Sekarang
            </button>
            <button className="flex-1 py-3.5 rounded-xl bg-white/60 backdrop-blur-md border border-slate-200 text-slate-900 font-semibold text-sm shadow-sm hover:bg-white transition-all active:scale-[0.98]">
              Lihat lainnya
            </button>
          </div>
        </section>
        {/* Fading River Image Section */}
        <div className="relative w-full h-80 mt-4 overflow-hidden">
          <Image
            src="/images/landpageImg.png"
            alt="Sungai CitraLand Surabaya"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay Gradient tetap di bawahnya */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, #FEFFFF 0%, transparent 100%)",
            }}
          ></div>
        </div>
        {/* Bottom Content Area & FAQ Section */}
        <div className="bg-[#FEFFFF] px-6 py-12 flex flex-col items-center text-center flex-grow">
          <p className="text-sm font-medium text-slate-500 mb-2">lorem ipsum</p>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
            Jaga Kali,
            <br />
            Jaga Hidup Kita
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed px-4 mb-8">
            Jadilah bagian dari solusi. Pilih untuk menjadi pasukan kali di
            garis depan atau penggerak aksi perubahan hari ini.
          </p>

          {/* Accordion List */}
          <div className="w-full flex flex-col gap-3 pb-12">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden text-left transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-5 focus:outline-none"
                  >
                    <span className="font-semibold text-slate-900 text-sm pr-4">
                      {faq.question}
                    </span>
                    <span className="text-slate-400 flex-shrink-0">
                      {/* Chevron Icon dengan animasi putar */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Jawaban FAQ */}
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Impact & Steps Section */}
        <section className="w-full py-10 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-slate-500 mb-2">lorem ipsum</p>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
            Mudah Bergabung,
            <br />
            Dampaknya Nyata
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed px-6 mb-8">
            Lihat seberapa besar Jakal telah tumbuh dan ikuti langkah sederhana
            di bawah ini untuk mulai beraksi
          </p>

          {/* Statistics Card */}
          <div className="w-full bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden mb-6">
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-6 text-left">
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  1.250+ Pasukan Kali
                </h4>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Rutin turun langsung ke lapangan untuk menjaga kebersihan.
                </p>
              </div>
              <div className="p-6 text-left">
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  85+ Penggerak Aksi
                </h4>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Pemimpin yang mengorganisir gerakan di berbagai wilayah.
                </p>
              </div>
            </div>

            {/* Image inside Card */}
            <div className="px-4 pb-4">
              <div className="relative w-full h-48 rounded-2xl overflow-hidden">
                <Image
                  src="/images/landpages.png"
                  alt="Sampah di sungai"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Steps List */}
            <div className="px-6 py-6 space-y-4 text-left border-t border-slate-50">
              {[
                "Pilih aksi bersih sungai di lokasi terdekatmu.",
                "Daftarkan dirimu di aksi bersih yang tersedia.",
                "Hadir di lokasi dan beraksi bersama tim Jakal.",
                "Scan konfirmasi",
                "Lapor hasil kegiatan dan unggah dokumentasi.",
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="white"
                      className="w-3 h-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-tight">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* CTA & Footer Section */}
        <footer
          className="w-full mt-12 flex flex-col items-center rounded-t-4xl"
          style={{
            background:
              "linear-gradient(180deg, #D7F9FA 0%, #E6F3FC 60.1%, #FEFFFF 100%), #E5F3FC",
          }}
        >
          {/* Call to Action Card */}
          <div className="px-6 py-16 text-center w-full">
            <h3 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
              Siap Beraksi untuk
              <br />
              Sungai Kita?
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed px-4 mb-8">
              Langkah kecilmu hari ini adalah harapan bagi generasi mendatang.
              Mari pulihkan ekosistem bersama Jakal!
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-10 py-3.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-sm shadow-lg shadow-slate-900/20 transition-all active:scale-[0.95]"
            >
              Mulai Perubahan
            </button>
          </div>

          {/* Real Footer Links */}
          <div className="w-full px-6 pt-12 pb-8 bg-white border-t border-white/50">
            <div className="mb-8">
              <h4 className="text-xl font-bold text-slate-900 mb-2">Jakal.</h4>
              <p className="text-sm text-slate-400">
                Pimpin komunitas dan organisir aksi lingkungan.
              </p>
            </div>

            <nav className="flex flex-col gap-4 mb-16">
              <button
                onClick={() => router.push("/")}
                className="text-left text-sm font-semibold text-slate-900 hover:text-sky-600 transition-colors"
              >
                Beranda
              </button>
              <button className="text-left text-sm font-semibold text-slate-900 hover:text-sky-600 transition-colors">
                Tentang Kami
              </button>
              <button className="text-left text-sm font-semibold text-slate-900 hover:text-sky-600 transition-colors">
                Aksi
              </button>
            </nav>

            <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                © 2026 Jakal. Jaga Kali, Jaga Hidup Kita. Dibuat dengan bangga
                untuk lingkungan. Made with ❤️ by TB Cahaya Baru
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
