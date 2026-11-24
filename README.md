# Multitech Service Tracker

Sistem Informasi Pelacakan dan Manajemen Servis Elektronik Otomotif dan Modul Genset/Industri untuk **CV Multitech Tasikmalaya**. Aplikasi ini memisahkan **Portal Publik Pelanggan** yang anonim dari **Portal Internal Admin** dalam satu arsitektur monolith modular berbasis **Next.js 15 App Router**, **Prisma ORM 6**, dan **PostgreSQL 18**.

Dibangun sebagai produk **Capstone Project Program Studi Informatika, Fakultas Teknik, Universitas Siliwangi (UNSIL) 2026**.

---

## Ringkasan Fitur & Ruang Lingkup Rilis (`v0.1.0`)

### 1. Portal Pelanggan Publik (`/`, `/cek`, `/track/[publicId]`)
- **Papan Antrean Anonim (`/`):** Menampilkan antrean aktif tanpa mengekspos data pribadi (tanpa nama pelanggan, nomor HP, plat nomor, atau kode nota). Mendukung pencarian dan filter kategori unit (`OTOMOTIF`, `GENSET_INDUSTRI`) serta jenis modul.
- **Verifikasi 2 Faktor Ringan (`/cek` & `/cek/[code]`):** Pelanggan memasukkan **kode servis 4 digit** beserta **4 digit akhir nomor WhatsApp**. Rute `/cek/[code]` mengisi kode servis otomatis dan menerbitkan cookie sesi bertanda tangan `track_session_<publicId>` (berlaku 24 jam).
- **Detail Pelacakan Real-Time (`/track/[publicId]`):** Menampilkan progres independen per modul, estimasi selesai, metode masuk/ambil (`DATANG` atau `EKSPEDISI` + nomor resi), bukti foto & catatan terfilter `isPublic = true`, rincian biaya/pembayaran, status masa garansi, serta cetak nota tanda terima.

### 2. Portal Internal Admin (`/admin/*` & Subdomain `admin.*`)
- **Autentikasi & Subdomain Guard:** Login admin memakai email dan kata sandi ter-hash `bcryptjs` dengan cookie sesi JWT HS256 `multitech_admin_session` (berlaku 7 hari), ditegakkan oleh [`src/middleware.ts`](src/middleware.ts).
- **Dashboard Operasional (`/admin/dashboard`):** 4 ringkasan KPI, tabel unit aktif dengan penanda keterlambatan (*Terlambat* / *Urgent*), panel **Top 3 Prioritas Tindak Lanjut**, serta grafik perbandingan bulanan (`GroupedBarChart`).
- **Manajemen Servis & Multi-Modul (`/admin/services`):** Penerimaan unit datang langsung atau kiriman ekspedisi, generator kode servis 4 digit acak unik (`BR-01`), alur perubahan status tervalidasi 9 tahap (`BR-03`), catatan progres dengan kontrol visibilitas `isPublic`, serta unggah foto terkompresi HTML5 Canvas (`<= 2 MB`, WebP/JPEG).
- **Tagihan, Pembayaran & Klaim Garansi:** Input item biaya (`DIAGNOSA`, `JASA`, `SPAREPART`) terkunci otomatis ketika seluruh modul final (`BR-07`), pembayaran bertahap `TUNAI` / `TRANSFER` / `QRIS` (`BR-05`), validasi pelunasan sebelum status `SELESAI` (`BR-06`), serta pembuatan order **Klaim Garansi** tertaut ke modul asal (`BR-08`).
- **Manajemen Pelanggan & Kendaraan (`/admin/customers`):** CRUD data pelanggan `PERORANGAN` dan `MITRA` (bengkel B2B), pencarian via nama/HP/plat/mitra, dan pengelolaan kendaraan termasuk `VIN` (Nomor Rangka).
- **Cetak Nota, Laporan & WhatsApp:** Komponen cetak A4 datar bergaya **Minimal Hairline (Opsi A)** untuk Nota Servis ([`PrintableServiceReceipt.tsx`](src/components/shared/PrintableServiceReceipt.tsx)) dan Rekap Laporan Keuangan ([`PrintableReportsDocument.tsx`](src/components/admin/PrintableReportsDocument.tsx)), ekspor **CSV** aman dari injeksi rumus ([`escapeCsvCell`](src/lib/business-rules.ts#L225-L232)), dan tombol notifikasi cepat `wa.me`.

### 3. Batasan / Di Luar Lingkup v1
Sesuai kesepakatan ruang lingkup proyek, fitur berikut **tidak** termasuk dalam rilis `v0.1.0`:
- UI Manajemen Multi-Admin & ganti kata sandi (`FR-A02`) - memakai akun admin database/seed.
- UI CRUD Master Jenis Modul (`FR-A06`) - daftar jenis modul dikelola lewat [`prisma/seed.ts`](prisma/seed.ts).
- Pencantuman QR Code pada nota (`FR-S13`) - pelanggan memakai tautan langsung `/cek/[code]`.
- Unggah berkas video progres (`POST /api/media` hanya menerima JPG/PNG/WebP `<= 2 MB`), polling otomatis antrean publik (`FR-P04`), serta statistik durasi rata-rata pengerjaan (`FR-D06`).

---

## Teknologi yang Digunakan

| Komponen | Teknologi & Versi (`package.json`) | Keterangan |
|---|---|---|
| Framework & UI | **Next.js** `^15.1.4` (App Router), **React** `^19.0.0`, **TypeScript** `^5.7.3` | Server Components, Server Actions, Route Handlers, SSR/CSR hybrid |
| Styling & Ikon | **Tailwind CSS** `^3.4.17`, `clsx` `^2.1.1`, `tailwind-merge` `^2.6.0`, `lucide-react` `^0.469.0`, `next-themes` `^0.4.4` | Tata letak *Minimal Hairline*, tema terang/gelap, CSS `@media print` A4 |
| Database & ORM | **PostgreSQL 18** (lokal) / `postgres:16-alpine` (Docker), **Prisma** `^6.1.0` (`@prisma/client`) | 10 tabel relasional, transaksi atomik `$transaction` |
| Keamanan & Validasi | **jose** `^5.9.6` (JWT `HS256`), **bcryptjs** `^2.4.3`, **Zod** `^4.6.7` | Hash kredensial, cookie `HttpOnly`, validasi skema mutasi |
| Pengujian & Linting | **tsx** `^4.19.2` (`node:test`), **ESLint** `^9.17.0` (`eslint-config-next`) | Pengujian aturan bisnis `tests/business-rules.test.ts` |

---

## Arsitektur Sistem & Peta Direktori

### Diagram Arsitektur (C4 Container View)

```mermaid
flowchart LR
    subgraph CLI["1. Klien (Browser HP & Desktop)"]
        PUB_U["Pelanggan / Pengunjung\n(/, /cek/[code], /track/[publicId])"]
        ADM_U["Admin / Kepala Teknisi\n(/admin/*, window.print)"]
    end

    subgraph EDGE["2. Lapisan Edge & Routing (src/middleware.ts)"]
        MW_PUB["Jalur Publik\nLolos tanpa login"]
        MW_AUTH["Auth Guard JWT HS256\nCookie multitech_admin_session"]
        MW_SUB["Subdomain Rewrite\nadmin.* -> /admin/*"]
    end

    subgraph APP["3. Monolith Modular Next.js 15 App Router"]
        SSR_PUB["Portal Publik (SSR + Server Actions)\nPapan Anonim + Verifikasi 4 Digit HP"]
        UI_ADM["Portal Admin (SSR + CSR)\nDashboard, Servis, Pelanggan, Laporan"]
        CANVAS["Kompresi Klien HTML5 Canvas\nWebP/JPEG <= 2 MB (maxDim 1280px)"]
        API["API Route Handlers\n/api/dataset, /api/media, /api/media/[...path]"]
        DOMAIN["Domain & Security Core\nbusiness-rules.ts, validation.ts (Zod), auth.ts"]
    end

    subgraph DATA["4. Persistensi Data & Media Lokal"]
        PG[("PostgreSQL 18 (multitech_db)\nPrisma ORM - 10 Tabel Relasional")]
        FS[("Local Media Storage\n./media/YYYY/MM/<uuid>.<ext>")]
    end

    PUB_U -->|HTTPS| MW_PUB --> SSR_PUB
    ADM_U -->|HTTPS| MW_SUB --> MW_AUTH --> UI_ADM
    UI_ADM --> CANVAS -->|FormData| API
    UI_ADM -->|JSON Actions| API
    SSR_PUB --> DOMAIN
    API --> DOMAIN
    DOMAIN -->|Prisma $transaction| PG
    API -->|Simpan & Gate isPublic| FS
    SSR_PUB -->|Baca Proyeksi Aman| PG
```

### Peta Komponen ke Direktori (*Box-to-Directory Map*)

| Kotak / Lapisan Arsitektur | Jalur Direktori / Berkas | Tanggung Jawab Utama |
|---|---|---|
| **Edge & Routing Guard** | [`src/middleware.ts`](src/middleware.ts) | Proteksi JWT rute `/admin/*` dan `/api/dataset`, plus penulisan ulang subdomain `admin.*` |
| **Portal Publik (SSR & Actions)** | [`src/app/(public)/`](src/app/%28public%29/page.tsx), [`src/components/public/`](src/components/public/PublicQueueClient.tsx) | Papan antrean bebas PII, gerbang verifikasi [`cek/actions.ts`](src/app/%28public%29/cek/actions.ts), halaman [`track/[publicId]/page.tsx`](src/app/%28public%29/track/[publicId]/page.tsx) |
| **Portal Admin (SSR & CSR)** | [`src/app/(admin)/admin/`](src/app/%28admin%29/admin/actions.ts), [`src/components/admin/`](src/components/admin/AdminDashboardClient.tsx) | Dashboard KPI, manajemen servis & modul, manajemen pelanggan/VIN, laporan & ekspor CSV |
| **Komponen Cetak & Bersama** | [`src/components/shared/`](src/components/shared/PrintableServiceReceipt.tsx) | Nota servis A4 (`PrintableServiceReceipt`), logo, toggle tema, filter bar |
| **API Route Handlers** | [`src/app/api/dataset/route.ts`](src/app/api/dataset/route.ts), [`src/app/api/media/`](src/app/api/media/route.ts) | Mutasi dataset transaksi, unggah gambar `<= 2 MB` (magic bytes), dan gate berkas `isPublic` |
| **Domain, Auth & Persistensi** | [`src/lib/`](src/lib/business-rules.ts) | State machine `BR-03` ([`business-rules.ts`](src/lib/business-rules.ts)), skema [`validation.ts`](src/lib/validation.ts), JWT [`auth.ts`](src/lib/auth.ts), store Prisma [`dataset-store.ts`](src/lib/dataset-store.ts) |
| **Skema DB & Seed** | [`prisma/schema.prisma`](prisma/schema.prisma), [`prisma/seed.ts`](prisma/seed.ts) | Definisi 10 tabel PostgreSQL, migrasi Prisma, dan skrip data awal |
| **Pengujian & Dokumentasi** | [`tests/business-rules.test.ts`](tests/business-rules.test.ts), [`docs/`](docs/01-PRD.md) | Unit test aturan bisnis (`8` blok uji) dan 11 dokumen spesifikasi/bahan laporan |

---

## Desain Lengkap & Diagram Sistem (Mermaid)

### 1. Use Case Diagram

```mermaid
flowchart LR
    V(["Pengunjung Publik"])
    C(["Pelanggan / Bengkel Mitra"])
    A(["Admin / Kepala Teknisi"])

    C -->|Generalisasi| V

    subgraph SUB_PUB["Portal Pelanggan Publik (/, /cek, /track)"]
        direction TB
        UC01(["UC-01 Lihat Papan Antrean Anonim"])
        UC02(["UC-02 Cari & Filter Unit/Kategori"])
        UC03(["UC-03 Verifikasi Kode + 4 Digit HP"])
        UC04(["UC-04 Lihat Detail Progres & Biaya"])
        UC05(["UC-05 Cetak Nota Minimal Hairline"])
        UC06(["UC-06 Lihat Status & Batas Garansi"])
    end

    subgraph SUB_ADM["Portal Internal Admin (/admin/* - Tanpa CRUD Modul, Akun Admin, & QR)"]
        direction TB
        UC10(["UC-10 Login & Logout Admin"])
        UC11(["UC-11 Kelola Pelanggan & Mitra"])
        UC12(["UC-12 Kelola Kendaraan & VIN"])
        UC14(["UC-14 Terima Unit & Kode 4-Digit"])
        UC15(["UC-15 Ubah Status Modul BR-03"])
        UC16(["UC-16 Tambah Catatan & Foto isPublic"])
        UC17(["UC-17 Kelola Biaya Jasa & Sparepart"])
        UC18(["UC-18 Catat Pembayaran & DP"])
        UC19(["UC-19 Tetapkan Masa Garansi"])
        UC20(["UC-20 Buat Klaim Garansi BR-08"])
        UC21(["UC-21 Batalkan Modul + Alasan Wajib"])
        UC22(["UC-22 Cetak Nota & Laporan PDF"])
        UC23(["UC-23 Kirim Update WhatsApp"])
        UC24(["UC-24 Dashboard KPI & Ekspor CSV"])
    end

    V --- UC01
    V --- UC02
    V --- UC03
    C --- UC04
    C --- UC05
    C --- UC06
    UC04 -.->|include| UC03

    UC10 --- A
    UC11 --- A
    UC12 --- A
    UC14 --- A
    UC15 --- A
    UC16 --- A
    UC17 --- A
    UC18 --- A
    UC19 --- A
    UC20 --- A
    UC21 --- A
    UC22 --- A
    UC23 --- A
    UC24 --- A

    UC14 -.->|include| UC10
    UC19 -.->|extend| UC15
    UC21 -.->|extend| UC15
    UC20 -.->|include| UC14
```

### 2. Entity Relationship Diagram (ERD - 10 Tabel PostgreSQL)

```mermaid
erDiagram
    admins {
        string id PK
        string name
        string email UK
        string password_hash
        boolean is_active
        datetime created_at
    }

    customers {
        string id PK
        string name
        string phone UK "Format 62xxx"
        enum type "PERORANGAN | MITRA"
        string workshop_name
        string address
        string notes
        datetime created_at
    }

    vehicles {
        string id PK
        string customer_id FK
        string brand
        string model
        int year
        string plate_number "Privat tidak tampil publik"
        string vin
    }

    module_types {
        string id PK
        string name UK
        string description
        int default_warranty_months
        boolean is_active
    }

    service_orders {
        string id PK
        string public_id UK
        char4 code UK "4 digit acak permanen"
        string customer_id FK
        string vehicle_id FK
        enum intake_type "MOBIL_UTUH | MODUL_SAJA"
        enum entry_method "DATANG | EKSPEDISI"
        string unit_category
        string tracking_number
        string condition_notes
        string priority_note
        string custom_photo_url
        datetime received_at
        datetime estimated_done_at
        datetime handed_over_at
        boolean is_warranty_claim
        string warranty_source_item_id FK
        string created_by
        datetime created_at
        datetime updated_at
    }

    service_items {
        string id PK
        string order_id FK
        string module_type_id FK
        string module_detail
        string complaint
        enum status "9 status BR-03"
        int warranty_months
        datetime warranty_until
        string cancel_reason
        string override_reason
        datetime finished_at
        string before_photo_url
        string after_photo_url
        string before_caption
        string after_caption
    }

    progress_logs {
        string id PK
        string item_id FK
        enum kind "STATUS | NOTE | ESTIMATE"
        enum from_status
        enum to_status
        string note
        boolean is_public
        string created_by
        datetime created_at
    }

    media {
        string id PK
        string log_id FK
        string file_path
        string mime_type
        enum kind "FOTO | VIDEO"
        int size_bytes
        boolean is_public
        datetime created_at
    }

    charge_lines {
        string id PK
        string order_id FK
        string item_id FK
        enum kind "JASA | SPAREPART | DIAGNOSA"
        string description
        int qty
        float unit_price
        datetime created_at
    }

    payments {
        string id PK
        string order_id FK
        float amount
        enum method "TUNAI | TRANSFER | QRIS"
        datetime paid_at
        string note
        string created_by
    }

    customers ||--o{ vehicles : "memiliki"
    customers ||--o{ service_orders : "mengajukan"
    vehicles |o--o{ service_orders : "dirujuk pada"
    service_orders ||--|{ service_items : "memuat"
    module_types ||--o{ service_items : "mengkategorikan"
    service_items |o--o{ service_orders : "sumber klaim garansi"
    service_items ||--o{ progress_logs : "mencatat riwayat"
    progress_logs ||--o{ media : "melampirkan bukti"
    service_orders ||--o{ charge_lines : "menagihkan"
    service_items |o--o{ charge_lines : "rincian per modul"
    service_orders ||--o{ payments : "menerima pembayaran"
    admins ..o{ service_orders : "created_by (audit string)"
```

### 3. Alur Proses Operasional & State Machine Status Modul (`BR-03`)

```mermaid
flowchart LR
    S1["1. Penerimaan (Intake)\nCatat Pelanggan, Unit/VIN & Foto Kondisi\nGenerate Kode 4-Digit + publicId"]
    S2["2. Diagnosa & Estimasi\nUji modul ECU/BCM/EPS\nInput biaya diagnosa & estimasi"]
    S3["3. Perbaikan & Uji QC\nGanti komponen, foto Before/After\nUji beban/bench test (UJI_QC)"]
    S4["4. Pelunasan, Nota & Garansi\nCatat payment (Tunai/TF/QRIS)\nCetak Nota Hairline & aktifkan garansi"]
    TR["Kanal Pelacakan Pelanggan (/cek -> /track)\nVerifikasi kode + 4 digit HP -> cookie track_session\nBaca progres & foto isPublic=true atau ajukan Klaim Garansi"]

    S1 --> S2 --> S3 --> S4
    S1 -.-> TR
    S3 -.-> TR
    S4 -.-> TR
```

```mermaid
stateDiagram-v2
    [*] --> DITERIMA : Order dibuat (BR-01)
    DITERIMA --> DIAGNOSA
    DITERIMA --> BATAL : cancelReason wajib

    DIAGNOSA --> MENUNGGU_PERSETUJUAN
    DIAGNOSA --> MENUNGGU_SPAREPART
    DIAGNOSA --> PERBAIKAN
    DIAGNOSA --> BATAL : cancelReason wajib

    MENUNGGU_PERSETUJUAN --> DIAGNOSA
    MENUNGGU_PERSETUJUAN --> MENUNGGU_SPAREPART
    MENUNGGU_PERSETUJUAN --> PERBAIKAN
    MENUNGGU_PERSETUJUAN --> BATAL : cancelReason wajib

    MENUNGGU_SPAREPART --> MENUNGGU_PERSETUJUAN
    MENUNGGU_SPAREPART --> PERBAIKAN
    MENUNGGU_SPAREPART --> BATAL : cancelReason wajib

    PERBAIKAN --> MENUNGGU_PERSETUJUAN : Revisi biaya
    PERBAIKAN --> MENUNGGU_SPAREPART : Inden komponen tambahan
    PERBAIKAN --> UJI_QC
    PERBAIKAN --> BATAL : cancelReason wajib

    UJI_QC --> PERBAIKAN : Gagal uji / Rework
    UJI_QC --> SIAP_DIAMBIL : Lolos QC (+ hitung garansi)
    UJI_QC --> BATAL : cancelReason wajib

    SIAP_DIAMBIL --> UJI_QC : Cek ulang sebelum serah
    SIAP_DIAMBIL --> SELESAI : Lunas / Override mitra tempo (BR-06)
    SIAP_DIAMBIL --> BATAL : cancelReason wajib

    SELESAI --> [*]
    BATAL --> [*]
```

### 4. Sequence Diagram Autentikasi Pelanggan & Isolasi Media (`isPublic`)

```mermaid
sequenceDiagram
    autonumber
    actor P as Browser Pelanggan
    participant SA as Server Action (/cek/actions.ts)
    participant DB as PostgreSQL 18 (Prisma)
    participant AUTH as Auth Helper (src/lib/auth.ts)
    participant TRK as Halaman /track/[publicId]

    P->>SA: Submit code (4 digit) + phoneLast4 (4 digit)
    SA->>SA: Sanitasi 4 digit (cleanCode & cleanPhoneLast4)
    SA->>DB: prisma.serviceOrder.findUnique(code) + customer.phone
    alt DATABASE_URL tidak aktif (offline fallback)
        SA->>SA: Fallback getServerDataset().orders
    end
    DB-->>SA: Data order & nomor HP E.164 (62xxx)
    alt Kode cocok DAN phone.endsWith(phoneLast4)
        SA->>AUTH: signTrackSessionToken(publicId)
        AUTH-->>SA: JWT HS256 (scope: track, TTL: 24 jam)
        SA-->>P: Set HttpOnly Cookie track_session_<publicId> + Redirect /track/<publicId>
        P->>TRK: GET /track/<publicId> (+ cookie)
        TRK->>AUTH: verifyTrackSessionToken(token, publicId)
        TRK->>DB: Query order + filter logs.filter(isPublic == true)
        TRK-->>P: Render timeline publik tanpa catatan internal/plat
    else Tidak cocok
        SA-->>P: Pesan generik ("Kode servis atau 4 digit nomor HP tidak cocok.")
    end
```

```mermaid
sequenceDiagram
    autonumber
    actor CL as Browser (Admin / Pengunjung)
    participant UP as POST /api/media
    participant FS as Disk (MEDIA_STORAGE_PATH)
    participant DS as POST /api/dataset
    participant DB as PostgreSQL 18 (media & progress_logs)
    participant DL as GET /api/media/[...path]

    Note over CL,UP: Fase 1 - Unggah Foto Admin (HTML5 Canvas <= 2 MB)
    CL->>UP: Upload FormData (wajib cookie multitech_admin_session)
    UP->>UP: Validasi ukuran <= 2 MB & magic bytes JPG/PNG/WebP
    UP->>FS: Tulis file YYYY/MM/<uuid>.<ext>
    UP-->>CL: 200 OK { url: "/api/media/YYYY/MM/<uuid>.<ext>" }
    CL->>DS: POST /api/dataset (simpan log + relasi media + flag isPublic)
    DS->>DB: Simpan dalam prisma.$transaction

    Note over CL,DL: Fase 2 - Pengambilan Berkas Media oleh Pengunjung / Admin
    CL->>DL: GET /api/media/YYYY/MM/<uuid>.<ext>
    DL->>DL: Sanitasi segmen path & anti-traversal (tolak ".." -> 403)
    DL->>DB: Cek getAdminSession() ATAU query prisma.media + log.isPublic
    alt Sesi Admin valid ATAU (media.isPublic && log.isPublic && track_session_<publicId> valid)
        DL->>FS: Baca byte file di dalam MEDIA_STORAGE_PATH
        DL-->>CL: 200 OK stream gambar (X-Content-Type-Options: nosniff)
    else Gambar privat (isPublic = false) / path tidak sah
        DL-->>CL: 403 Forbidden
    else Belum verifikasi 4 digit HP (cookie track_session invalid)
        DL-->>CL: 401 Unauthorized
    end
```

---

## Ringkasan Aturan Bisnis (`BR-01` s.d. `BR-11`) & Keamanan

| Kode | Ringkasan Aturan | Penegakan di Kode |
|---|---|---|
| `BR-01` | Kode servis 4 digit unik (`0000`–`9999`), peringatan kapasitas jika tersisa `< 10%` | [`generateUniqueOrderCode`](src/lib/business-rules.ts#L186-L220) |
| `BR-02` | Verifikasi pelanggan valid bila `code` dan 4 digit akhir HP cocok; pesan galat generik | [`verifyCustomerAccessAction`](src/app/%28public%29/cek/actions.ts#L10-L87) |
| `BR-03` | Transisi status modul harus mengikuti peta 9 status resmi | [`ALLOWED_STATUS_TRANSITIONS`](src/lib/business-rules.ts#L6-L58) |
| `BR-04` | Order dianggap aktif selama minimal satu modul belum `SELESAI`/`BATAL` | [`areAllItemsFinal`](src/lib/business-rules.ts#L64-L66) |
| `BR-05` | Status pembayaran dihitung otomatis: `BELUM_DITAGIH`, `BELUM_BAYAR`, `DP`, `LUNAS` | [`calculateBillingSummary`](src/lib/business-rules.ts#L70-L121) |
| `BR-06` | Status `SELESAI` ditolak bila masih berhutang kecuali `overrideReason` diisi (mis. mitra tempo); status `BATAL` wajib `cancelReason` | [`validateOrderRules`](src/lib/business-rules.ts#L157-L184) |
| `BR-07` | Saat seluruh modul final (`SELESAI`/`BATAL`), item biaya dikunci sedangkan pembayaran masuk tetap diizinkan | [`dataset-store.ts`](src/lib/dataset-store.ts) & UI tab biaya |
| `BR-08` | Klaim garansi hanya sah bila status `SELESAI`/`SIAP_DIAMBIL` dan `warrantyUntil >= hari ini` | [`isWarrantyEligible`](src/lib/business-rules.ts#L135-L155) |
| `BR-09` | Papan publik hanya menampilkan order aktif (minimal 1 modul belum final) | [`src/app/(public)/page.tsx`](src/app/%28public%29/page.tsx#L9-L30) |
| `BR-10` | Hanya catatan dan media berstatus `isPublic = true` yang dapat dilihat dan diunduh pelanggan | [`track/[publicId]/page.tsx`](src/app/%28public%29/track/[publicId]/page.tsx#L218-L226), [`[...path]/route.ts`](src/app/api/media/%5B...path%5D/route.ts#L60-L85) |
| `BR-11` | Nomor HP dinormalisasi ke format E.164 Indonesia (`62xxx`) | [`upsertCustomerSchema`](src/lib/validation.ts#L22-L52), [`getWaLink`](src/components/admin/services/service-utils.ts#L167-L177) |

---

## Peta Rute Aplikasi & Endpoint API

| Rute / Endpoint | Akses | Fungsi |
|---|---|---|
| `/` | Publik | Papan antrean servis anonim + pencarian + filter kategori/modul |
| `/cek`, `/cek/[code]` | Publik | Form verifikasi kode servis + 4 digit akhir nomor HP (kode terisi otomatis pada `/cek/[code]`) |
| `/track/[publicId]` | Pelanggan terverifikasi (`track_session` / Admin) | Timeline progres per modul, foto bukti publik, biaya, pembayaran, garansi, & cetak nota |
| `/admin/login` | Publik (redirect ke dashboard jika sudah login) | Halaman masuk admin (`email` & `password`) |
| `/admin/dashboard` | Admin | Ringkasan 4 KPI, Top 3 Prioritas, unit terlambat/urgent, grafik bulanan |
| `/admin/services` | Admin | Manajemen order servis, penerimaan unit, status `BR-03`, media, biaya, pembayaran, klaim garansi |
| `/admin/customers`, `/admin/customers/[id]` | Admin | Daftar pelanggan Perorangan/Mitra, pencarian, riwayat servis, CRUD kendaraan & VIN |
| `/admin/reports` | Admin | Rekap keuangan per periode, statistik modul & bengkel mitra, ekspor CSV, & cetak laporan A4 |
| `GET / POST /api/dataset` | Admin (`multitech_admin_session`) | Membaca seluruh dataset atau menjalankan aksi (`upsertOrder`, `deleteOrder`, `createWarrantyClaim`, `upsertCustomer`, `addVehicle`, `updateVehicle`, `deleteVehicle`, `deleteCustomer`) |
| `POST /api/media` | Admin (`multitech_admin_session`) | Unggah foto JPG/PNG/WebP `<= 2 MB` tervalidasi *magic bytes* ke `MEDIA_STORAGE_PATH` |
| `GET /api/media/[...path]` | Admin / Pelanggan (`isPublic` + `track_session`) | Melayani berkas gambar terisolasi dengan pencegahan path traversal & header `nosniff` |

---

## Panduan Instalasi & Menjalankan Sistem (Quickstart)

### Prasyarat
- **Node.js** `>= 20` & **npm**
- **PostgreSQL 16 / 18** lokal (atau Docker Engine jika menggunakan Docker Compose)

### Opsi 1: Menjalankan Secara Lokal dengan PostgreSQL 18

1. **Instal dependensi proyek:**
   ```bash
   npm ci
   ```

2. **Konfigurasi variabel lingkungan:**
   Salin `.env.example` menjadi `.env`, lalu sesuaikan `DATABASE_URL` dan buat `AUTH_SECRET` acak minimal 32 karakter:
   ```bash
   cp .env.example .env
   ```

   | Variabel (`.env.example`) | Fungsi | Nilai Contoh / Default |
   |---|---|---|
   | `DATABASE_URL` | Koneksi PostgreSQL Prisma ORM | `postgresql://postgres:password@localhost:5432/multitech_db?schema=public` |
   | `AUTH_SECRET` | Kunci HMAC penandatangan JWT admin & pelacakan (wajib pada `production`) | String hex acak >= 32 karakter |
   | `ALLOW_OFFLINE_ADMIN_FALLBACK` | Mengizinkan login admin offline jika DB mati (`"false"` di produksi) | `"false"` |
   | `NEXT_PUBLIC_APP_URL` | URL dasar portal publik (tautan pelacakan & WA) | `"http://localhost:3000"` |
   | `NEXT_PUBLIC_ADMIN_URL` | URL portal admin berbasis subdomain | `"http://admin.localhost:3000"` |
   | `NEXT_PUBLIC_WORKSHOP_WA` | Nomor WhatsApp utama bengkel untuk kontak pada nota | `"6281234567890"` |
   | `MEDIA_STORAGE_PATH` | Direktori penyimpanan foto unggahan di disk | `"./media"` |

3. **Jalankan migrasi skema & isi data awal (seed):**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Jalankan server pengembangan atau build produksi:**
   ```bash
   # Mode pengembangan
   npm run dev

   # Atau mode produksi lokal
   npm run build
   npm run start
   ```
   Akses portal publik di `http://localhost:3000` dan portal admin di `http://localhost:3000/admin/login` (atau `http://admin.localhost:3000/login`).

### Opsi 2: Menjalankan via Docker Compose (`Dockerfile` + `docker-compose.yml`)

File [`Dockerfile`](Dockerfile) dan [`docker-compose.yml`](docker-compose.yml) sudah tersedia untuk orkestrasi service `postgres` (`postgres:16-alpine`) dan `app` (`port 3000`, volume `./media:/app/media`):

```bash
docker compose up -d --build
docker compose exec app npx prisma db seed
```
*(Catatan: konfigurasi container disiapkan mengikuti `package.json` dan `docker-compose.yml`, namun eksekusi build/run terhadap daemon Docker lokal belum dijalankan dalam sesi pengembangan ini.)*

### Akun & Data Uji Bawaan Seed (`prisma/seed.ts`)

| Peran / Skenario Uji | Kredensial / Kode Akses | Catatan |
|---|---|---|
| **Admin Default (Seed)** | Email: `admin@multitech.com` / Password: `admin123456` | Dapat diubah lewat env `ADMIN_EMAIL` & `ADMIN_PASSWORD` sebelum menjalankan `seed`; segera ganti pada server produksi |
| **Pelanggan Aktif (2 Modul: ECU & Speedometer)** | Kode: `4821` / 4 Digit Akhir HP: `4807` (`/cek/4821`) | Order milik `Asep Suryana` (`6285223194807`, status `PERBAIKAN` & `UJI_QC`, DP Rp300.000) |
| **Order Mitra Selesai untuk Uji Klaim Garansi** | Kode: `3417` | Order `Honda CR-V 2.4 RM` milik mitra `Wahana Retro` (`SELESAI`, garansi BCM 2 bulan) |

---

## Pengujian, Verifikasi Kualitas & Troubleshooting

### Perintah Verifikasi Utama

```bash
# 1. Unit test aturan bisnis (BR-01, BR-03, BR-05..BR-08, Zod, escapeCsvCell)
npm test

# 2. Pengecekan tipe TypeScript statis
npx tsc --noEmit

# 3. Linting ESLint Next.js
npm run lint

# 4. Kompilasi klien Prisma + build produksi Next.js
npm run build
```

Cakupan kasus uji Black Box `TC-01` s.d. `TC-19` beserta rancangan UAT mitra dan instrumen System Usability Scale (SUS) dirinci pada [`docs/09-rencana-pengujian.md`](docs/09-rencana-pengujian.md).

### Troubleshooting Umum

- **`AUTH_SECRET wajib dikonfigurasi pada environment production`:** Pastikan variabel `AUTH_SECRET` di `.env` terisi saat menjalankan `npm run start` (`NODE_ENV=production`).
- **Gagal login admin meski password benar:** Periksa `DATABASE_URL` dan pastikan PostgreSQL berjalan serta `npx prisma db seed` sudah dijalankan (saat `ALLOW_OFFLINE_ADMIN_FALLBACK="false"`, autentikasi hanya membaca tabel `admins`).
- **Akses subdomain `admin.localhost:3000` tidak mengarah ke `/admin`:** Browser modern memetakan `*.localhost` ke `127.0.0.1`; bila gagal pada host lokal non-Chrome, akses langsung melalui path `http://localhost:3000/admin/login`.

---

## Indeks Dokumentasi & Bahan Laporan (`docs/`)

Seluruh dokumen perancangan disinkronkan dengan kondisi basis kode aktual:

- [`docs/01-PRD.md`](docs/01-PRD.md) - Product Requirements Document & tujuan produk
- [`docs/02-SRS.md`](docs/02-SRS.md) - Software Requirements Specification (`FR-*`, `BR-01..BR-11`, & item Out of Scope v1)
- [`docs/03-use-case.md`](docs/03-use-case.md) - Spesifikasi Use Case (`UC-01..UC-24`) & sumber PlantUML [`docs/diagrams/use-case.puml`](docs/diagrams/use-case.puml)
- [`docs/04-activity-diagram.md`](docs/04-activity-diagram.md) - Activity Diagram skenario utama & alur kerja
- [`docs/05-erd-kamus-data.md`](docs/05-erd-kamus-data.md) - ERD & Kamus Data lengkap 10 tabel PostgreSQL
- [`docs/06-arsitektur.md`](docs/06-arsitektur.md) - Arsitektur sistem & Sequence Diagram
- [`docs/07-design-system.md`](docs/07-design-system.md) - Sistem desain UI & tata letak cetak *Minimal Hairline (Opsi A)*
- [`docs/08-backlog-sprint.md`](docs/08-backlog-sprint.md) - Backlog & riwayat sprint pengembangan
- [`docs/09-rencana-pengujian.md`](docs/09-rencana-pengujian.md) - Matriks uji Black Box (`TC-01..TC-19`), UAT mitra, & SUS
- [`docs/10-referensi.md`](docs/10-referensi.md) - Daftar referensi teknis dan pedoman
- [`docs/11-bahan-laporan-capstone.md`](docs/11-bahan-laporan-capstone.md) - Kompilasi bahan teknis terstruktur sesuai Templat Laporan Capstone UNSIL 2026 (`Tabel i..5.2` & `Lampiran 7..10`)
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - Panduan alur kontribusi & verifikasi repositori
