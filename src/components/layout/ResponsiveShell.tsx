import { type ReactNode } from "react";

interface ResponsiveShellProps {
  children: ReactNode;
}

export default function ResponsiveShell({ children }: ResponsiveShellProps) {
  return (
    <>
      {/* Decorative background (desktop only, behind everything) */}
      <div
        aria-hidden="true"
        className="hidden lg:block fixed inset-0 -z-10 bg-[linear-gradient(135deg,_#dff1f3_0%,_#eef7f8_50%,_#f4fad7_100%)]"
      >
        {/* Floating organic shapes */}
        <div className="absolute top-[10%] left-[8%] w-72 h-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute top-[55%] left-[15%] w-96 h-96 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute top-[20%] right-[10%] w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-[15%] right-[15%] w-72 h-72 rounded-full bg-sky-300/25 blur-3xl" />
      </div>

      {/* Desktop side panels (only visible >=lg) */}
      <div
        aria-hidden="true"
        className="hidden lg:flex fixed inset-y-0 left-0 right-0 pointer-events-none"
      >
        <div className="flex-1 flex items-center justify-end pr-12">
          <DesktopLeftPanel />
        </div>
        {/* Center spacer matches mobile width */}
        <div className="w-[448px]" />
        <div className="flex-1 flex items-center justify-start pl-12">
          <DesktopRightPanel />
        </div>
      </div>

      {/* Main content — render children unchanged */}
      <main className="relative lg:flex lg:justify-center lg:items-start lg:min-h-screen">
        <div className="lg:w-[448px] lg:flex-shrink-0 lg:my-6 lg:rounded-[2.5rem] lg:overflow-hidden lg:shadow-2xl lg:ring-1 lg:ring-slate-200">
          {children}
        </div>
      </main>
    </>
  );
}

function DesktopLeftPanel() {
  return (
    <div className="max-w-sm pointer-events-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5 text-white"
            aria-hidden="true"
          >
            <path
              d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-2xl font-semibold tracking-tight text-slate-900">
          Jakal.
        </span>
      </div>

      <h2 className="text-3xl font-semibold tracking-tight leading-tight text-slate-900">
        Jaga Kali,
        <br />
        Jaga Hidup Kita.
      </h2>
      <p className="text-sm text-slate-600 mt-4 leading-relaxed">
        Platform restorasi sungai berbasis komunitas yang menghubungkan Pasukan
        Kali, Penggerak Aksi, dan mitra Station dalam ekosistem ekonomi
        sirkular.
      </p>

      <div className="mt-8 space-y-3">
        <FeatureBullet icon="📍" label="Aksi terverifikasi via QR & GPS" />
        <FeatureBullet
          icon="♻️"
          label="Bio-Circular Economy untuk reward nyata"
        />
        <FeatureBullet icon="🌊" label="Eliminasi spesies invasif Sapu-Sapu" />
      </div>
    </div>
  );
}

function DesktopRightPanel() {
  return (
    <div className="max-w-sm pointer-events-auto">
      <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Mobile Priority
          </span>
        </div>
        <h3 className="text-base font-semibold text-slate-900 leading-tight">
          Aplikasi ini didesain untuk mobile
        </h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Pengalaman terbaik di smartphone karena sebagian besar aksi (scan QR,
          ambil foto bukti, check-in lokasi) terjadi di lapangan.
        </p>

        <div className="mt-5 pt-5 border-t border-slate-200 space-y-2.5">
          <DesktopHint label="Pakai HP" value="Buka URL ini di smartphone" />
          <DesktopHint
            label="Atau"
            value="Aktifkan device emulation di browser"
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white/50 backdrop-blur-md border border-white/60 p-5">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Hackfest 2026 · Demo Project
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Pages" value="15" />
          <Stat label="RPC" value="12" />
          <Stat label="Tables" value="10" />
        </div>
      </div>
    </div>
  );
}

function FeatureBullet({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg leading-none mt-0.5">{icon}</span>
      <span className="text-sm text-slate-700 leading-relaxed">{label}</span>
    </div>
  );
}

function DesktopHint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 flex-shrink-0">
        {label}
      </span>
      <span className="text-xs text-slate-700 leading-relaxed">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}
