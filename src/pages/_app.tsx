import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import ResponsiveShell from "@/components/layout/ResponsiveShell";

const FULL_WIDTH_ROUTES = new Set<string>(["/"]);

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isFullWidth = FULL_WIDTH_ROUTES.has(router.pathname);

  return (
    <>
      <AuthProvider>
        {isFullWidth ? (
          <Component {...pageProps} />
        ) : (
          <ResponsiveShell>
            <Component {...pageProps} />
          </ResponsiveShell>
        )}
      </AuthProvider>
    </>
  );
}
