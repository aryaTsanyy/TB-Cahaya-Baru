import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
        {/* Navbar */}
        <header className="flex justify-between items-center px-6 py-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Jakal.
          </h1>
          <button
            className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
            aria-label="Open Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12h18M3 6h18M3 18h18"
              />
            </svg>
          </button>
        </header>

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
      </div>
    </>
  );
}
