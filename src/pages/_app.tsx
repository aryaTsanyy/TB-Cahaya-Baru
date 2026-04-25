import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Jakal</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </Head>

      <div
        className={`${geist.variable} font-sans min-h-screen bg-slate-200 flex items-center justify-center`}
      >
        <main className="w-full min-h-screen bg-white shadow-2xl overflow-y-auto relative">
          <AuthProvider>
            <Component {...pageProps} />
          </AuthProvider>
        </main>
      </div>
    </>
  );
}
