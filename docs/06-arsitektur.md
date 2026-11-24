# 06 — Arsitektur Sistem & Infrastruktur

## 1. Ikhtisar Arsitektur (C4 & Container View)
Sistem Multitech dikembangkan menggunakan arsitektur **Monolith Modular** berbasis Next.js 15 App Router (TypeScript). Antarmuka Publik Pelanggan dan Portal Internal Admin berada dalam satu repositori dan satu basis data PostgreSQL, dipisahkan pada lapisan perutean melalui `src/middleware.ts` (akses jalur `/admin/*` maupun subdomain `admin.*`).

```mermaid
flowchart TD
    subgraph Klien["Perangkat Pengguna"]
        P["Smartphone Pelanggan<br/>(Portal Publik: /, /cek, /track)"]
        A["Laptop/HP Admin<br/>(Portal Admin: /admin/*)"]
    end

    subgraph Runtime["Next.js 15 App Router Monolith (Node.js)"]
        MW["Middleware Auth & Subdomain Rewrite<br/>(src/middleware.ts)"]
        PUB["App Router (public)<br/>SSR PostgreSQL + Cek Akses"]
        ADM["App Router (admin) & Client Hooks<br/>useDataset + Minimal Hairline Print"]
        API["Route Handlers & Server Actions<br/>/api/dataset · /api/media · cek/actions"]
        RULES["Domain Logic & Guard<br/>Zod Validation + business-rules.ts"]
    end

    subgraph Storage["Persistensi Lokal & Kontainer"]
        PG[("PostgreSQL 18 / 16<br/>(multitech_db via Prisma ORM)")]
        MEDIA[("Local Media Storage Volume<br/>./media/YYYY/MM/*.{webp,jpg,png}")]
    end

    P --> MW --> PUB
    A --> MW --> ADM
    PUB --> API
    ADM --> API
    API --> RULES
    RULES --> PG
    API --> MEDIA
```

---

## 2. Strategi Pemisahan Domain & Perutean (`src/middleware.ts`)

`src/middleware.ts` memvalidasi cookie sesi admin (`ADMIN_COOKIE_NAME`) pada `/api/dataset` dan seluruh rute `/admin/*` (kecuali `/admin/login`), serta menerjemahkan permintaan dari subdomain `admin.*` secara transparan ke jalur internal `/admin/*`:

```text
src/
├── middleware.ts                    # Auth gate admin & rewrite host admin.* -> /admin/*
├── app/
│   ├── (public)/                    # Portal Pelanggan
│   │   ├── page.tsx                 # Papan antrean anonim (SSR query Prisma)
│   │   ├── cek/
│   │   │   ├── page.tsx             # Verifikasi kode + 4 digit HP
│   │   │   ├── [code]/page.tsx      # Verifikasi prefill kode dari URL
│   │   │   └── actions.ts           # verifyCustomerAccessAction -> track_session_<publicId>
│   │   └── track/[publicId]/        # Halaman progres publik, biaya, garansi & cetak nota
│   ├── (admin)/admin/               # Portal Admin
│   │   ├── login/page.tsx           # Autentikasi admin (bcryptjs + jose)
│   │   ├── dashboard/page.tsx       # KPI Strip, unit aktif, Top 3 prioritas, chart bulanan
│   │   ├── services/page.tsx        # Manajemen servis, intake, edit tahap BR-03, garansi
│   │   ├── customers/               # Master pelanggan & detail kendaraan (+ VIN)
│   │   └── reports/page.tsx         # Laporan keuangan, Top Modul/Mitra, CSV & Print PDF
│   └── api/
│       ├── dataset/route.ts         # GET/POST dataset terautentikasi admin
│       ├── media/route.ts           # POST upload gambar tervalidasi magic-byte (<= 2 MB)
│       └── media/[...path]/route.ts # GET gambar dengan cek sesi admin / isPublic tracking
├── components/
│   ├── public/                      # Kartu antrean, carousel, CekProgresView, modal cek
│   ├── admin/                       # Nav, Dashboard, Services, Reports, PrintableReportsDocument
│   └── shared/                      # BrandLogo, ThemeProvider, PrintableServiceReceipt
├── lib/
│   ├── db.ts                        # Prisma Client singleton
│   ├── auth.ts                      # Bcrypt + Signed HS256 JWT Cookie helper (jose)
│   ├── business-rules.ts            # Transisi BR-03, billing BR-05..07, garansi BR-08, CSV
│   ├── validation.ts                # Skema validasi Zod & DatasetRuleError
│   ├── dataset-store.ts             # Repository transaksi PostgreSQL (+ fallback JSON read)
│   └── use-dataset.ts               # Hook state client + rollback optimistik saat error API
└── tests/
    └── business-rules.test.ts       # 8 skenario unit test aturan bisnis & skema Zod
```

---

## 3. Sequence Diagram Alur Data Kritis

### 3.1 Verifikasi Pelanggan & Penerbitan Sesi Pelacakan
```mermaid
sequenceDiagram
    autonumber
    actor P as Pelanggan
    participant B as Browser (/cek atau /cek/[code])
    participant SA as Server Action (verifyCustomerAccessAction)
    participant PG as PostgreSQL (Prisma)
    participant TRK as SSR Page (/track/[publicId])

    P->>B: Isi Kode 4 Digit & 4 Digit Akhir No. HP
    B->>SA: POST FormData (code, phoneLast4)
    SA->>PG: findUnique ServiceOrder WHERE code = cleanCode
    PG-->>SA: Return publicId & customer.phone
    alt Kode tidak ditemukan ATAU 4 digit HP tidak cocok
        SA-->>B: Error generik: "Kode servis atau 4 digit nomor HP tidak cocok."
    else Verifikasi berhasil
        SA->>SA: signTrackSessionToken(publicId) (HS256 via jose)
        SA-->>B: Set Cookie HttpOnly: track_session_<publicId> + Redirect
        B->>TRK: GET /track/[publicId]
        TRK->>TRK: Verifikasi cookie / sesi admin
        TRK->>PG: Query detail order + progressLogs WHERE isPublic = true
        PG-->>TRK: Return data publik (tanpa plateNumber)
        TRK-->>B: Render TrackingDetailClient & Nota Minimal Hairline
    end
```

### 3.2 Update Progres, Upload Foto Terkompresi & Simpan Order Admin
```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant UI as ServiceEditForm (Browser)
    participant MEDIA as POST /api/media
    participant API as POST /api/dataset
    participant PG as PostgreSQL (Prisma)

    A->>UI: Pilih foto + tulis catatan + ubah tahap (BR-03)
    opt Terdapat unggahan gambar
        UI->>UI: Kompresi WebP/JPEG max 1280px via HTML5 Canvas
        UI->>MEDIA: Upload FormData (multipart)
        MEDIA->>MEDIA: Cek sesi admin + magic bytes + <= 2 MB
        MEDIA-->>UI: { url: "/api/media/YYYY/MM/<uuid>.<ext>" }
    end
    A->>UI: Klik "Simpan Perubahan"
    UI->>API: POST /api/dataset { action: "upsertOrder", payload }
    API->>API: Cek sesi admin + Zod + validateOrderRules (BR-03/06/07)
    API->>PG: Prisma $transaction (update items, logs, media, charges, payments)
    PG-->>API: Commit & Return dataset terbaru
    API-->>UI: 200 OK (sinkron state UI & rollback snapshot)
```

---

## 4. Keamanan & Perlindungan Data Pribadi (UU PDP No. 27/2022)

1. **Privasi Papan Antrean (`/`):**
   - Query SSR hanya mengambil kolom non-PII (`publicId`, `intakeType`, `unitCategory`, `receivedAt`, merek/model/tahun unit, nama modul, status). Nama, nomor telepon, kode servis, dan nomor polisi tidak pernah dikirim ke DOM publik.
2. **Isolasi Media & Log Pemeriksaan (`/api/media/[...path]`):**
   - Setiap catatan dan foto memiliki status visibilitas `isPublic` (`Tampil ke Pelanggan` vs `Internal Saja`).
   - Halaman `/track/[publicId]` hanya memuat `progressLogs` dengan `isPublic: true`, dan `GET /api/media/[...path]` mengembalikan `403 Forbidden` kepada pemegang cookie tracking apabila `Media.isPublic` atau `ProgressLog.isPublic` bernilai `false`.
3. **Penyimpanan Kredensial:**
   - Kata sandi admin di-hash dengan `bcryptjs`, dan token sesi admin maupun tracking ditandatangani dengan HMAC-SHA256 (`AUTH_SECRET`) lewat pustaka `jose`.
4. **Proteksi Jaringan Server Rumahan:**
   - Menggunakan Cloudflare Tunnel sehingga server Ubuntu lokal **tidak memerlukan port forwarding** atau IP publik statis.
   - Port 80 dan 443 pada router internet rumah tetap tertutup sepenuhnya dari pemindaian publik luar.

---

## 5. Rencana Backup & Disaster Recovery

- **Database:** Skrip terjadwal via Linux `crontab` menjalankan `pg_dump` setiap hari pukul 02:00 WIB, mengompresi arsip `.sql.gz`, dan menyimpan retensi 14 hari terakhir.
- **Media:** Folder `/var/data/multitech/media` disinkronkan secara inkremental ke penyimpanan terpisah (harddisk eksternal atau S3-compatible cloud storage).
