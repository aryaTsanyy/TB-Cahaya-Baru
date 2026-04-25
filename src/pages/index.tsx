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

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Head>
        <title>Jakal - Jaga Kali, Jaga Hidup Kita</title>
      </Head>

      <div
        className="min-h-screen flex flex-col relative w-full overflow-x-hidden"
        style={jakalGradient}
      >
        {/* --- FULL WIDTH STICKY NAVBAR --- */}
        <header
          className={`fixed top-0 inset-x-0 z-[70] transition-all duration-300 ${
            isScrolled || isMenuOpen
              ? "bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-5">
            <h1
              className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight cursor-pointer"
              onClick={() => {
                router.push("/");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Jakal.
            </h1>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-full transition-all focus:outline-none ${
                isMenuOpen
                  ? "bg-slate-900/5"
                  : "bg-transparent hover:bg-white/30"
              }`}
            >
              {isMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-7 h-7 text-slate-900"
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
                  className="w-7 h-7 text-slate-800"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12h18M3 6h18M3 18h18"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* --- FULL WIDTH DROPDOWN MENU --- */}
        <div
          className={`fixed top-0 inset-x-0 z-[60] transition-all duration-500 ease-in-out w-full overflow-hidden ${
            isMenuOpen
              ? "translate-y-0 opacity-100 max-h-[50vh] md:max-h-[40vh]"
              : "-translate-y-full opacity-0 max-h-0"
          }`}
        >
          <div className="bg-white/80 backdrop-blur-2xl border-b border-white/60 shadow-xl rounded-b-3xl">
            <nav className="max-w-6xl mx-auto flex flex-col px-8 pt-32 pb-12 gap-6 md:gap-8">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-left text-2xl md:text-3xl font-extrabold text-slate-900 hover:text-sky-700 transition-colors"
              >
                Beranda
              </button>
              <button
                onClick={() => scrollToSection("faq-section")}
                className="text-left text-2xl md:text-3xl font-extrabold text-slate-900 hover:text-sky-700 transition-colors"
              >
                Tentang Kami
              </button>
              <button
                onClick={() => scrollToSection("impact-section")}
                className="text-left text-2xl md:text-3xl font-extrabold text-slate-900 hover:text-sky-700 transition-colors"
              >
                Aksi
              </button>
            </nav>
          </div>
        </div>

        {/* Backdrop Transparan */}
        {isMenuOpen && (
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-[50] bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300"
          />
        )}

        <div className="h-24 md:h-32" />

        {/* --- HERO SECTION --- */}
        <section className="max-w-6xl mx-auto px-6 pt-4 pb-12 md:pb-20 w-full flex flex-col items-center md:text-center text-start">
          <p className="text-sm md:text-base w-full font-semibold text-slate-500 mb-3 md:mb-5 tracking-wide uppercase">
            Jaga Kali
          </p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-[#092430] leading-tight md:leading-tight mb-6 max-w-4xl">
            Kembalikan Kesegaran
            <br className="hidden md:block" /> Sungai Kita Semua
          </h2>
          <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Jadilah bagian dari solusi. Pilih untuk menjadi pasukan kali di
            garis depan atau penggerak aksi perubahan hari ini.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full md:w-auto">
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-4 rounded-xl md:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm md:text-base shadow-xl transition-all active:scale-[0.98]"
            >
              Mulai Beraksi
            </button>
            <button
              onClick={() => scrollToSection("faq-section")}
              className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-4 rounded-xl md:rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200 text-slate-900 font-semibold text-sm md:text-base shadow-sm hover:bg-white transition-all active:scale-[0.98]"
            >
              Pelajari Lebih Lanjut
            </button>
          </div>
        </section>

        {/* --- RIVER IMAGE (WIDE) --- */}
        <div className="relative w-full h-80 md:h-[500px] lg:h-[600px] overflow-hidden">
          <Image
            src="/images/landpageImg.png"
            alt="Sungai CitraLand Surabaya"
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40 md:h-64 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, #FEFFFF 0%, transparent 100%)",
            }}
          ></div>
        </div>

        {/* --- FAQ SECTION --- */}
        <div
          id="faq-section"
          className="bg-[#FEFFFF] w-full pt-16 md:pt-28 px-6 py-16 flex flex-col items-center"
        >
          <p className="text-sm md:text-base font-semibold text-slate-400 mb-3 tracking-wide uppercase">
            Tentang Kami
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-[#092430] leading-tight mb-6 text-center">
            Jaga Kali,
            <br />
            Jaga Hidup Kita
          </h2>
          <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-12 text-center max-w-2xl">
            Pahami misi kami lebih dalam. Berikut adalah hal-hal yang sering
            ditanyakan oleh relawan baru sebelum bergabung dengan gerakan Jakal.
          </p>

          <div className="w-full max-w-3xl flex flex-col gap-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-100/80 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md overflow-hidden text-left transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-6 md:p-8 focus:outline-none"
                  >
                    <span className="font-semibold text-slate-900 text-base md:text-lg pr-4">
                      {faq.question}
                    </span>
                    <span className="text-slate-400 flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 md:px-8 pb-6 md:pb-8 text-sm md:text-base text-slate-500 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- IMPACT SECTION (SPLIT LAYOUT ON DESKTOP) --- */}
        <div
          id="impact-section"
          className="bg-[#FEFFFF] w-full py-16 md:py-28 px-6"
        >
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            <p className="text-sm md:text-base font-semibold text-slate-400 mb-3 tracking-wide uppercase">
              Aksi
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Mudah Bergabung,
              <br className="md:hidden" /> Dampaknya Nyata
            </h2>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-12 max-w-2xl">
              Lihat seberapa besar Jakal telah tumbuh dan ikuti langkah
              sederhana di bawah ini untuk mulai beraksi bersama ribuan relawan
              lainnya.
            </p>

            {/* Desktop Flex Layout, Mobile Stack */}
            <div className="w-full bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-slate-100 overflow-hidden flex flex-col lg:flex-row">
              {/* Image Side */}
              <div className="lg:w-1/2 relative h-64 md:h-96 lg:h-auto">
                <Image
                  src="/images/landpages.png"
                  alt="Sampah di sungai"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content Side */}
              <div className="lg:w-1/2 p-6 md:p-12 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-6 mb-8 md:mb-12">
                  <div className="text-left">
                    <h4 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
                      1.250+
                    </h4>
                    <p className="text-sm md:text-base font-medium text-slate-800 mb-1">
                      Pasukan Kali
                    </p>
                    <p className="text-xs md:text-sm text-slate-400 leading-snug">
                      Rutin turun langsung ke lapangan.
                    </p>
                  </div>
                  <div className="text-left">
                    <h4 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
                      85+
                    </h4>
                    <p className="text-sm md:text-base font-medium text-slate-800 mb-1">
                      Penggerak Aksi
                    </p>
                    <p className="text-xs md:text-sm text-slate-400 leading-snug">
                      Pemimpin gerakan di berbagai wilayah.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6 text-left">
                  {[
                    "Pilih aksi bersih sungai di lokasi terdekatmu.",
                    "Daftarkan dirimu di aksi bersih yang tersedia.",
                    "Hadir di lokasi dan beraksi bersama tim Jakal.",
                    "Scan konfirmasi QR Code",
                    "Lapor hasil kegiatan dan unggah dokumentasi.",
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-0.5 md:mt-1 w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="white"
                          className="w-3 h-3 md:w-4 md:h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      </div>
                      <p className="text-sm md:text-base font-medium text-slate-800 leading-tight">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- CTA & FOOTER --- */}
        <footer
          className="w-full flex-grow flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, #D7F9FA 0%, #E6F3FC 60.1%, #FEFFFF 100%), #E5F3FC",
          }}
        >
          <div className="max-w-4xl mx-auto px-6 py-20 md:py-32 text-center w-full">
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Siap Beraksi untuk
              <br />
              Sungai Kita?
            </h3>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
              Langkah kecilmu hari ini adalah harapan bagi generasi mendatang.
              Mari pulihkan ekosistem bersama Jakal!
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-10 py-4 md:px-12 md:py-5 rounded-xl md:rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-sm md:text-base shadow-2xl transition-all active:scale-[0.95]"
            >
              Mulai Perubahan
            </button>
          </div>

          <div className="w-full px-6 pt-12 md:pt-16 pb-8 md:pb-12 bg-white border-t border-white/50 mt-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 md:mb-16 gap-8">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-2">
                    Jakal.
                  </h4>
                  <p className="text-sm md:text-base text-slate-400">
                    Pimpin komunitas dan organisir aksi lingkungan.
                  </p>
                </div>
                <nav className="flex flex-row gap-6 md:gap-10">
                  <button
                    onClick={() => {
                      router.push("/");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-sm md:text-base font-semibold text-slate-900 hover:text-sky-600 transition-colors"
                  >
                    Beranda
                  </button>
                  <button
                    onClick={() => scrollToSection("faq-section")}
                    className="text-sm md:text-base font-semibold text-slate-900 hover:text-sky-600 transition-colors"
                  >
                    Tentang Kami
                  </button>
                  <button
                    onClick={() => scrollToSection("impact-section")}
                    className="text-sm md:text-base font-semibold text-slate-900 hover:text-sky-600 transition-colors"
                  >
                    Aksi
                  </button>
                </nav>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs md:text-sm text-slate-400">
                  © 2026 Jakal. Jaga Kali, Jaga Hidup Kita.
                </p>
                <p className="text-xs md:text-sm text-slate-400">
                  Dibuat dengan bangga oleh TB Cahaya Baru
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
