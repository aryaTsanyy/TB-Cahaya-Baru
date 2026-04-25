# 🐟 Jakal — Jaga Kali

**Platform Restorasi Sungai Berbasis Komunitas dengan Sistem Reward Bio-Circular Economy**

> Memulihkan ekosistem sungai Indonesia dengan memobilisasi komunitas untuk eliminasi spesies invasif (Ikan Sapu-Sapu) dan pembersihan sampah, melalui sistem insentif ekonomi sirkular yang menghubungkan aksi warga dengan mitra pengepul/pabrik daur ulang.

---

## 🎯 Tentang Project

Jakal (akronim dari **Jaga Kali**) adalah aplikasi web mobile-first yang menghubungkan tiga aktor utama dalam ekosistem restorasi sungai:

- **Pasukan Kali (Hunter)** — warga, mahasiswa, atau komunitas yang turun langsung ke lapangan untuk membersihkan sungai
- **Penggerak Aksi (Leader)** — koordinator yang membuat & memimpin event pembersihan di lokasi tertentu
- **Station** — mitra pengepul, pabrik daur ulang, atau dinas yang menerima hasil pembersihan untuk diolah lebih lanjut

Setiap tangkapan/sampah yang dikumpulkan dikonversi menjadi poin yang tercatat di **append-only ledger** (mirip blockchain mini), dengan arsitektur yang siap di-extend ke fitur redemption marketplace di masa depan.

---

## ✨ Fitur yang Sudah Dikembangkan (MVP)

### 🔐 Autentikasi & Otorisasi

- Register & Login berbasis email + password (Supabase Auth)
- Role-based access control: Hunter dan Leader (Leader di-assign sistem)
- Session management dengan auto-redirect ke dashboard sesuai role
- Row Level Security (RLS) yang ketat di setiap tabel database

### 👥 Hunter (Pasukan Kali)

- **Dashboard personal** dengan saldo poin real-time dan list event aktif terdekat
- **Browse event** dengan filter status (Live, Mendatang)
- **Form pendaftaran event** dengan pre-fill data profil yang bisa di-override per event
- **Scan QR Code Leader** untuk verifikasi kehadiran di lokasi (in-app camera via `getUserMedia`)
- **Upload bukti foto** hasil pembersihan dengan native camera capture
- **Selesaikan Aksi** dengan reward poin instant + animasi celebrasi
- **Resume flow otomatis** kalau Hunter interrupted (close tab, refresh)
- **Auto-hide event** yang sudah completed dari dashboard

### 🛠️ Leader (Penggerak Aksi)

- **Dashboard Leader** dengan counter event aktif & event selesai
- **Form create event** lengkap: judul, deskripsi, lokasi sungai, gambar, tanggal & waktu, kuota peserta, poin reward, Station partner
- **Image upload** ke Supabase Storage dengan validasi format & ukuran
- **Generate QR Code** otomatis per event untuk verifikasi kehadiran Hunter
- **QR Display fullscreen** dengan counter realtime peserta yang sudah scan
- **Logistics tracking 3-tahap**: Sampah dikumpulkan → Dalam perjalanan → Tiba di Station
- **Input total berat sampah** saat handoff ke Station
- **Auto-archive event** ke status "Selesai" setelah delivery confirmed

### 🗄️ Database & Backend

- **Schema PostgreSQL** dengan 8+ tabel: profiles, events, event_attendances, evidence_photos, stations, restoration_logs, points_ledger, station_validations
- **17 migration files** dengan progresi schema yang ter-versioning
- **9 RPC Functions** dengan SECURITY DEFINER untuk operasi atomic & validasi server-side
- **Row Level Security policies** komprehensif: read scoped per-role, write hanya via RPC untuk data sensitif
- **Append-only ledger** untuk integritas audit trail poin
- **Realtime subscription** untuk update live (Hunter check-in count di Leader dashboard)
- **Storage bucket** dengan RLS untuk evidence photos & event images

### 🎨 UI/UX

- **Mobile-first design** dengan max-width container 448px (`max-w-md`)
- **Dual color theme**: Pastel mint untuk Hunter, gradient kuning-biru untuk Leader
- **Liquid glass aesthetic** pada elemen kontekstual
- **Smooth animations**: entrance choreography, badge floating, sunburst rotation
- **Reduced motion support** untuk accessibility
- **Loading states** & error boundaries di setiap async operation
- **Adaptive button states** berdasarkan attendance status & event lifecycle

---

## 🚧 Roadmap Pengembangan Selanjutnya

### Phase 2: Bio-Circular Economy

- **Station Validation Flow** — petugas pengepul input PIN di HP Leader untuk verifikasi penerimaan sampah
- **Marketplace Redemption** — konversi poin Hunter ke voucher, sembako, atau cash
- **Pengepul/Mitra B2B Portal** — dashboard untuk mitra mengelola pickup & laporan penerimaan
- **Dynamic Point Rates** — admin bisa adjust rate poin per jenis (sapu-sapu, plastik, B3) secara real-time

### Phase 3: Anti-Fraud & Trust

- **AI Photo Verification** — deteksi foto-of-photo, verifikasi konten foto memang sungai/ikan
- **EXIF Metadata Validation** — verifikasi timestamp & GPS koordinat foto di server-side
- **Rate Limiting** untuk PIN attempts & multi-account abuse detection
- **Hunter Reputation System** dengan tier-based rewards

### Phase 4: Engagement & Scale

- **Public Impact Dashboard** — total kg sampah/ikan yang sudah di-clean, CO2 equivalent, leaderboard regional
- **Badge & Achievement System** — gamifikasi untuk retention
- **PWA Offline-First** untuk lokasi remote dengan koneksi terbatas
- **Push Notifications** — notif event baru di area user
- **Multi-language** (Indonesia, English, Jawa)

### Phase 5: Government Integration

- **Integrasi DLH** (Dinas Lingkungan Hidup) untuk reporting mandatory ke pemerintah daerah
- **Carbon Credit** integration via partner sertifikasi
- **Open Data API** untuk peneliti & journalist

---

## 🛠️ Tech Stack

### Frontend

| Tools                         | Penggunaan                                                 |
| ----------------------------- | ---------------------------------------------------------- |
| **Next.js 15** (Pages Router) | Framework full-stack React                                 |
| **TypeScript** (strict mode)  | Type safety, no `any` policy                               |
| **Tailwind CSS v4**           | Utility-first styling, pure CSS variables (no config file) |
| **React 19**                  | UI library dengan hooks                                    |
| **Geist Font**                | Typography sistem (sans-serif modern)                      |

### Backend & Database

| Tools                  | Penggunaan                                          |
| ---------------------- | --------------------------------------------------- |
| **Supabase**           | Backend-as-a-Service all-in-one                     |
| **PostgreSQL**         | Relational database via Supabase                    |
| **Supabase Auth**      | Email/password authentication, JWT-based session    |
| **Supabase Storage**   | Object storage untuk event images & evidence photos |
| **Supabase Realtime**  | WebSocket subscription untuk live updates           |
| **Row Level Security** | Database-level authorization                        |
| **PL/pgSQL**           | Stored procedures untuk operasi atomic              |
| **pgcrypto**           | Bcrypt hashing untuk PIN Station                    |

### Libraries & Integrations

| Library                 | Penggunaan                                 |
| ----------------------- | ------------------------------------------ |
| `@supabase/supabase-js` | Supabase client SDK                        |
| `@supabase/ssr`         | Server-side rendering helpers              |
| `html5-qrcode`          | QR code scanner di browser (kamera native) |
| `qrcode`                | QR code generator (canvas + SVG)           |
| `zod`                   | Runtime validation                         |

### Development Tools

| Tools                  | Penggunaan                       |
| ---------------------- | -------------------------------- |
| **Vercel**             | Hosting & continuous deployment  |
| **GitHub**             | Version control                  |
| **Supabase Dashboard** | Database management & SQL editor |
| **VS Code / Cursor**   | Code editor                      |

### Architectural Patterns

- **Mobile-first responsive design** dengan max container width 448px
- **Strict TypeScript** dengan zero `any` dan zero `@ts-ignore`
- **Hydration-safe SSR** dengan proper `useEffect` boundary untuk browser APIs
- **Atomic database operations** via SECURITY DEFINER RPC functions
- **Append-only audit log** untuk integritas data finansial (poin)
- **Defense-in-depth security**: client validation + RLS + RPC validation
- **Component composition** dengan TypeScript discriminated unions

---

## 📂 Struktur Project

```
jakal/
├── src/
│   ├── components/
│   │   ├── event/         # EventCard, EventCardLeader, EventRegisterForm
│   │   └── hunter/        # QRScannerModal
│   ├── contexts/          # AuthContext (session management)
│   ├── hooks/             # useAuth
│   ├── lib/               # supabaseClient
│   ├── pages/
│   │   ├── auth/          # login, register
│   │   ├── hunter/        # dashboard
│   │   ├── leader/        # dashboard
│   │   └── events/        # create, [id], [id]/checkin, [id]/complete, [id]/manage
│   └── styles/            # globals.css (Tailwind v4)
├── supabase/
│   └── migrations/        # 17 SQL migration files (versioned)
└── public/                # Static assets
```

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat

- Node.js 18+ dan npm
- Supabase account (free tier OK)

### Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd jakal

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
# dari Supabase Dashboard → Project Settings → API

# 4. Apply migrations
# Buka Supabase SQL Editor, run file di supabase/migrations/ secara berurutan
# 001_schema.sql → 002_functions.sql → ... → 017_close_event_on_arrival.sql

# 5. Run dev server
npm run dev
# Buka http://localhost:3000
```

### Untuk Test di Mobile

Karena `getUserMedia` (kamera) butuh HTTPS context, gunakan **ngrok** untuk tunnel localhost:

```bash
npx ngrok http 3000
# Pakai HTTPS URL yang di-generate untuk akses dari HP
```

---

## 🌐 Live Demo

🔗 **[https://jakal.vercel.app](https://jakal.vercel.app)** _(akan tersedia setelah deploy)_

### Akun Demo

| Role                    | Email                | Password |
| ----------------------- | -------------------- | -------- |
| Hunter (Pasukan Kali)   | aryatsanie@gmail.com | password |
| Leader (Penggerak Aksi) | aryatsanyy@gmail.com | password |

---

## 👥 Tim Pengembang

**Tim [Nama Tim Anda]** — Hackfest 2026

- [Arya Tsany Kuncara] — FullStack Developer
- [Sekar Maulida Anisa Putri] — UI/UX Designer
- [Muhammad Syauqiy Alattas] — Idea Storming

---

## 📊 Status Pengembangan

| Phase                                                 | Status         |
| ----------------------------------------------------- | -------------- |
| Database Schema & RLS                                 | ✅ 100%        |
| Authentication Flow                                   | ✅ 100%        |
| Hunter Journey (Browse → Daftar → Check-in → Selesai) | ✅ 100%        |
| Leader Journey (Create Event → QR Code → Logistics)   | ✅ 100%        |
| UI/UX Mobile-First                                    | ✅ 100%        |
| Realtime Updates                                      | ✅ 100%        |
| Production Deployment                                 | 🟡 In progress |
| Station Validation (Phase 2)                          | ⬜ Roadmap     |
| Marketplace Redemption (Phase 2)                      | ⬜ Roadmap     |
| AI Photo Verification (Phase 3)                       | ⬜ Roadmap     |

---

## 🤝 Kontribusi

Project ini dikembangkan untuk **Hackfest 2026**. Untuk kolaborasi atau pertanyaan, hubungi tim via [email/contact].

---

## 📄 Lisensi

© 2026 Tim [TB Cahaya Baru] — Hackfest 2026 Submission
