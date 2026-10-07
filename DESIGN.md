# DESIGN.md — Multitech Auto Electronics

> **Design Direction & Tokens for Multitech Service Tracking**  
> Menggabungkan presisi teknik elektronika otomotif dengan kesederhanaan desain ala Apple: bersih, intuitif, berorientasi mobile (*mobile-first*), bebas dari dekorasi tanpa tujuan (*anti-AI slop*), serta mendukung Dark Mode dan Light Mode penuh.

---

## 1. Identitas & Karakter Desain

- **Entitas:** Multitech Auto Electronics (Tasikmalaya).
- **Karakter:** Presisi, transparan, tenang, terpercaya, dan ramah pengguna (*human-centered*).
- **Filosofi UI (Apple-Inspired Simplicity):**
  - **Fokus Konten, Bukan Dekorasi:** Tidak ada ornamen abstrak, grid titik-titik melayang, atau kartu *glassmorphism* berlebihan yang mengaburkan teks.
  - **Bebas Sup Ikon (*No Icon Soup*):** Ikon hanya digunakan untuk aksi fungsional kritis (Pencarian, Kembali, Lampiran Foto, Status Berhasil). Setiap label status dan tombol utama mengandalkan tipografi yang kuat dan kontras tinggi.
  - **Mobile-First Ergonomics:** Area interaksi jempol (*thumb-zone*), tombol aksi melayang di bagian bawah layar (*bottom action bar*), dan target sentuh minimal 48px $\times$ 48px.

---

## 2. Antislop Dials

| Parameter | Tingkat | Alasan & Penerapan |
|---|---|---|
| **ENERGY** | **2 (Terkontrol & Tenang)** | Mengutamakan keterbacaan status teknis (ECU/BCM) dan angka rupiah tanpa animasi norak atau gradien ungu/biru generik AI. |
| **RHYTHM** | **2 (Terstruktur)** | Tata letak ritmis dengan kartu antrean yang konsisten, diselingi detail stepper progres horizontal yang adaptif. Menghindari *bento grid* acak. |
| **MOTION** | **1 (Mikro & Fungsional)** | Transisi lembut (150ms–200ms ease-out) saat pergantian tab, modal, dan drawer. Mematuhi `prefers-reduced-motion`. |

---

## 3. Palet Warna & Token Tema (Light & Dark Mode)

Sistem menggunakan tema ganda terkalibrasi kontras WCAG 2.2 AA (minimal 4.5:1 untuk teks normal).

### 3.1 Light Mode
- **Latar Belakang Canvas:** `#F8FAFC` (Slate 50)
- **Permukaan Kartu / Kontainer:** `#FFFFFF` (Pure White)
- **Garis Batas (*Border*):** `#E2E8F0` (Slate 200, garis tipis 1px sebagai pemisah bidang)
- **Teks Utama:** `#0F172A` (Slate 900)
- **Teks Sekunder / Keterangan:** `#475569` (Slate 600)
- **Warna Brand Utama (Navy):** `#0B2545` (Deep Tech Navy — navbar, judul utama)
- **Warna Aksen Kritis (Crimson):** `#E63946` (Indikator aktif, tombol utama, badge urgent)

### 3.2 Dark Mode
- **Latar Belakang Canvas:** `#0A0E17` (Deep Midnight Charcoal, bukan abu-abu kusam)
- **Permukaan Kartu / Kontainer:** `#111827` (Gray 900)
- **Garis Batas (*Border*):** `#1F2937` (Gray 800)
- **Teks Utama:** `#F9FAFB` (Gray 50)
- **Teks Sekunder / Keterangan:** `#9CA3AF` (Gray 400)
- **Warna Brand Utama (Navy):** `#1E3A8A` (Reflektif pada elemen header gelap)
- **Warna Aksen Kritis (Crimson):** `#F87171` (Crimson cerah dengan rasio kontras 5.2:1 terhadap `#111827`)

### 3.3 Indikator Status Tahapan (Semantic Chips)

| Status | Tampilan Light Mode | Tampilan Dark Mode | Karakter |
|---|---|---|---|
| **Diterima** | Latar `#F1F5F9`, Teks `#334155` | Latar `#1E293B`, Teks `#94A3B8` | Netral / Menunggu |
| **Diagnosa** | Latar `#FEF3C7`, Teks `#92400E` | Latar `#451A03`, Teks `#FCD34D` | Kuning / Investigasi |
| **Perbaikan** | Latar `#E0E7FF`, Teks `#3730A3` | Latar `#1E1B4B`, Teks `#A5B4FC` | Biru / Pengerjaan |
| **Uji / QC** | Latar `#F3E8FF`, Teks `#6B21A8` | Latar `#3B0764`, Teks `#D8B4FE` | Ungu / Pengujian |
| **Siap Diambil** | Latar `#DCFCE7`, Teks `#166534` | Latar `#052E16`, Teks `#86EFAC` | Hijau / Siap |
| **Batal** | Latar `#FEE2E2`, Teks `#991B1B` | Latar `#450A0A`, Teks `#FCA5A5` | Merah / Dibatalkan |

---

## 4. Tipografi & Skala Spasi

- **Font Sans-Serif:** `Plus Jakarta Sans` / `Inter` — font netral dengan *x-height* besar, mudah dibaca di layar smartphone bengkel yang terpapar cahaya luar.
- **Font Monospace:** `JetBrains Mono` — wajib digunakan untuk:
  - Kode servis 4 digit (`4821`)
  - Nomor part modul ECU/BCM (`89661-0K040`)
  - Nilai nominal rupiah (`Rp 850.000`)
- **Skala Spasi:** Kelipatan 4px (`p-2`, `p-3`, `p-4`, `p-6`). Jarak napas lega antara elemen informasi.

---

## 5. Pola Komponen Mobile-First (Referensi Apple UI)

1. **Segmented Control Tabs:**
   - Bentuk kapsul bersarang (`rounded-full bg-slate-100 p-1 dark:bg-gray-800`), tombol aktif berwarna putih solid (`dark:bg-gray-700 shadow-sm`).
2. **Kartu Antrean Servis (Thumb-Friendly):**
   - Sudut melengkung halus `rounded-2xl`.
   - Tanpa bayangan (*shadow*) raksasa yang melayang; gunakan batas garis tipis `border border-slate-200 dark:border-gray-800`.
   - Judul kendaraan tebal, diikuti chip part modul di bawahnya.
3. **Formulir Input 4-Digit:**
   - 4 kotak input angka terpisah berukuran besar ($56\text{px} \times 64\text{px}$) dengan font monospace besar (`text-2xl`), otomatis berpindah fokus ke kotak berikutnya.
4. **Modal / Sheet dari Bawah (*Bottom Drawer*):**
   - Pada layar mobile, verifikasi dan unggah foto muncul dari bawah (*slide-up drawer* dengan pegangan geser di atas), bukan modal melayang di tengah layar yang sulit dijangkau jempol.
5. **Floating Bottom Action:**
   - Tombol utama seperti "Hubungi via WhatsApp" atau "Cek Progres" dipasang pada bilah bawah yang lengket (*sticky bottom bar with safe-area-inset padding*).
