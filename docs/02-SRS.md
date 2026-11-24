# 02 — Spesifikasi Kebutuhan Perangkat Lunak (SRS)

Struktur dokumen ini mengacu secara ringkas pada ISO/IEC/IEEE 29148. Atribut kualitas memakai kategori ISO/IEC 25010.

Prioritas memakai **MoSCoW**: **M** = Must, **S** = Should, **C** = Could.

## 1. Aktor
| Aktor | Deskripsi |
|---|---|
| Pengunjung | Siapa pun yang membuka web pelanggan (belum memasukkan kode) |
| Pelanggan | Pengunjung yang berhasil memasukkan kode servis + 4 digit HP yang valid (perorangan maupun bengkel mitra) |
| Admin | Pengguna internal terautentikasi, punya akses penuh |
| Sistem | Proses otomatis (generate kode, hitung status bayar, hitung garansi) |

## 2. Kebutuhan Fungsional

### 2.1 Web Pelanggan
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-P01 | Sistem menampilkan papan antrean berisi servis yang **minimal satu modulnya** belum berstatus `SELESAI`/`BATAL` | M (Selesai) |
| FR-P02 | Kartu papan menampilkan: merek, tipe, tahun unit (atau kategori "Modul saja" / "Genset/Industri"), daftar jenis modul + status, tanggal masuk. **Tidak** menampilkan nama, No. HP, plat nomor, atau kode servis | M (Selesai) |
| FR-P03 | Pengunjung dapat mencari/memfilter papan berdasarkan merek, model, jenis modul, dan kategori unit | S (Selesai) |
| FR-P04 | Pembaruan papan otomatis secara *polling* berkala (ditunda; rilis saat ini memakai rendering dinamis `force-dynamic` per muat ulang) | C (Ditunda) |
| FR-P05 | Klik kartu membuka modal verifikasi: kode servis (4 digit) + 4 digit akhir No. HP. Kartu hanya membawa ID publik acak; verifikasi harus cocok dengan servis kartu tersebut | M (Selesai) |
| FR-P06 | Tautan langsung `/cek/[code]` (dari WhatsApp/nota) membuka form verifikasi dengan kode terisi otomatis. Pengunjung cukup memasukkan 4 digit HP | M (Selesai) |
| FR-P07 | Halaman detail (`/track/[publicId]`) menampilkan per modul: status terkini, progress bar 6 tahap, timeline catatan & foto **publik** urut waktu | M (Selesai) |
| FR-P08 | Halaman detail menampilkan rincian biaya terkini, total, total dibayar, sisa, dan status bayar | M (Selesai) |
| FR-P09 | Halaman detail menampilkan estimasi tanggal selesai dan metode penyerahan (`Datang Langsung`/`Ekspedisi` + resi) | M (Selesai) |
| FR-P10 | Halaman detail menampilkan masa garansi per modul (durasi bulan & tanggal berakhir `warrantyUntil`) serta penanda klaim garansi tertaut | M (Selesai) |
| FR-P11 | Pelanggan dapat mencetak atau menyimpan PDF nota tanda terima & rincian biaya melalui tata letak cetak datar *Minimal Hairline* (`window.print()`) | M (Selesai) |
| FR-P12 | Riwayat & garansi tetap dapat diakses dengan kode yang sama setelah servis selesai | M (Selesai) |
| FR-P13 | Sesi verifikasi diingat di perangkat melalui cookie `track_session_<publicId>` bertanda tangan HMAC (24 jam) | S (Selesai) |

### 2.2 Web Internal — Autentikasi & Master
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-A01 | Admin login dengan email & password ter-hash bcrypt, lalu logout | M (Selesai) |
| FR-A02 | UI Manajemen akun admin tambahan & ganti password *(dikeluarkan dari lingkup v1 sesuai kesepakatan akhir)* | Out of Scope |
| FR-A03 | CRUD Pelanggan: nama, No. HP (unik), tipe (Perorangan/Mitra), nama bengkel mitra, alamat | M (Selesai) |
| FR-A04 | Pencarian pelanggan berdasarkan No. HP/nama/plat/mitra, lalu tampilkan kendaraan & riwayat servisnya | M (Selesai) |
| FR-A05 | CRUD Kendaraan milik pelanggan: merek, tipe, tahun, plat nomor (privat), nomor rangka / VIN (opsional) | M (Selesai) |
| FR-A06 | UI CRUD Jenis Modul *(dikeluarkan dari lingkup v1; daftar jenis modul diisi melalui `prisma/seed.ts`)* | Out of Scope |

### 2.3 Web Internal — Servis
| ID | Kebutuhan | Status |
|---|---|---|
| FR-S01 | Admin membuat servis: pilih/buat pelanggan, isi unit (`Mobil Utuh`/`Modul Saja`/`Genset & Industri`), cara masuk (`Datang`/`Ekspedisi` + No. resi), estimasi selesai, catatan kondisi | M (Selesai) |
| FR-S02 | Satu servis memuat ≥ 1 modul. Tiap modul memiliki nama/jenis, detail/part number, dan keluhan | M (Selesai) |
| FR-S03 | Sistem membuat **kode servis 4 digit acak unik** saat servis dibuat (BR-01) | M (Selesai) |
| FR-S04 | Admin mengubah status tiap modul secara terurut (BR-03). Setiap perubahan & entri catatan tahap tersimpan di timeline | M (Selesai) |
| FR-S05 | Admin menambah/mengubah catatan progres per modul dengan toggle publik/privat (`isPublic`) | M (Selesai) |
| FR-S06 | Admin mengunggah foto bukti (JPG/PNG/WebP terkompresi via `/api/media`) dengan toggle publik/privat (`isPublic`) tanpa dukungan video | M (Selesai) |
| FR-S07 | Admin menambah/menghapus item biaya (`Jasa`/`Sparepart`/`Diagnosa`) selama modul belum seluruhnya final (BR-07) | M (Selesai) |
| FR-S08 | Admin mencatat pembayaran (nominal, metode `TUNAI`/`TRANSFER`/`QRIS`, tanggal, catatan). Status bayar dihitung otomatis (BR-05) | M (Selesai) |
| FR-S09 | Admin menetapkan masa garansi (bulan) per modul; tanggal berakhir `warrantyUntil` dihitung otomatis saat modul `SIAP_DIAMBIL`/`SELESAI` | M (Selesai) |
| FR-S10 | Admin menandai modul `BATAL` dengan alasan wajib (`cancelReason`). Biaya diagnosa tetap dapat ditagihkan | M (Selesai) |
| FR-S11 | Admin membuat **Klaim Garansi** dari modul yang garansinya masih berlaku (BR-08). Order baru tertaut ke `warrantySourceItemId` asal | M (Selesai) |
| FR-S12 | Admin memperbarui estimasi selesai dan catatan pengingat prioritas | S (Selesai) |
| FR-S13 | QR Code menuju `/cek/{kode}` pada nota PDF *(dikeluarkan dari lingkup v1 atas arahan pemilik proyek)* | Out of Scope |
| FR-S14 | Cetak Nota Tanda Terima & Invoice Ringkas A4 datar *Minimal Hairline* (`PrintableServiceReceipt.tsx`) melalui dialog cetak/simpan PDF browser | M (Selesai) |
| FR-S15 | Tombol "Kirim via WhatsApp" membuka `wa.me/<no>` dengan template pesan yang memuat kode nota & tautan pelacakan | M (Selesai) |

### 2.4 Web Internal — Dashboard & Laporan
| ID | Kebutuhan | Status |
|---|---|---|
| FR-D01 | Dashboard ringkas: 4 KPI status/antrean, tabel unit aktif, panel Top 3 Prioritas Tindak Lanjut, dan grafik bulanan (`GroupedBarChart`) | M (Selesai) |
| FR-D02 | Penanda visual servis yang mendekati atau melewati estimasi selesai (*Terlambat* / *Urgent*) | S (Selesai) |
| FR-D03 | Laporan per periode (Semua, Bulan Ini, 3 Bulan Terakhir, Mitra B2B, Perorangan): jumlah unit, tagihan, kas masuk, piutang, realisasi (%) | M (Selesai) |
| FR-D04 | Statistik jenis modul & merek unit terbanyak (`topModuleStats`) pada halaman laporan | S (Selesai) |
| FR-D05 | Statistik bengkel mitra teraktif (`topPartnerStats`) beserta nilai tagihan & kas masuk | S (Selesai) |
| FR-D06 | Rata-rata durasi pengerjaan & rasio klaim garansi per jenis modul *(ditunda ke pengembangan lanjut)* | C (Ditunda) |
| FR-D07 | Ekspor laporan ke **CSV** (`escapeCsvCell` aman injeksi rumus) dan Cetak Laporan / PDF datar *Minimal Hairline* | S (Selesai) |

## 3. Aturan Bisnis
| ID | Aturan |
|---|---|
| BR-01 | Kode servis = 4 digit angka (`0000`–`9999`), dibuat acak, **unik seumur sistem**, tidak pernah berubah. Jika hasil acak sudah dipakai, sistem mengulang. Jika kapasitas tersisa < 10%, admin mendapat peringatan |
| BR-02 | Verifikasi pelanggan valid jika `kode` cocok **dan** 4 digit terakhir No. HP pelanggan pada servis itu cocok. Tanpa batas percobaan (keputusan desain). Pesan galat dibuat generik ("Kode atau nomor tidak cocok") |
| BR-03 | Status modul: `DITERIMA → DIAGNOSA → (MENUNGGU_PERSETUJUAN) → (MENUNGGU_SPAREPART) → PERBAIKAN → UJI_QC → SIAP_DIAMBIL → SELESAI`. `UJI_QC` dapat kembali ke `PERBAIKAN`. `BATAL` dapat dipilih dari status mana pun sebelum `SELESAI`. Status `SELESAI` & `BATAL` bersifat final |
| BR-04 | Status servis (agregat) diturunkan dari modul: **aktif** jika ada modul belum final, **selesai** jika semua modul final |
| BR-05 | `total = Σ(qty × harga)`, `dibayar = Σ pembayaran`. Status bayar: `BELUM_BAYAR` (dibayar = 0), `DP` (0 < dibayar < total), `LUNAS` (dibayar ≥ total, total > 0) |
| BR-06 | Modul hanya bisa diubah ke `SELESAI` jika servis berstatus `LUNAS`, kecuali admin memberi alasan override (misal mitra tempo) |
| BR-07 | Servis yang semua modulnya final dikunci: item biaya tidak bisa diubah, pembayaran masih bisa ditambah |
| BR-08 | Klaim garansi hanya bisa dibuat untuk modul yang `warranty_until ≥ hari ini`. Biaya default Rp0, admin boleh menambah biaya |
| BR-09 | Papan publik menampilkan servis aktif + yang memiliki modul `SIAP_DIAMBIL`. Servis yang seluruh modulnya `SELESAI`/`BATAL` tidak tampil |
| BR-10 | Hanya catatan & media dengan `is_public = true` yang tampil di web pelanggan. Perubahan status otomatis selalu publik |
| BR-11 | No. HP disimpan dalam format E.164 Indonesia (`62…`) untuk tautan `wa.me` |

## 4. Kebutuhan Non-Fungsional (ISO/IEC 25010)
| ID | Karakteristik | Kebutuhan |
|---|---|---|
| NFR-01 | Kesesuaian fungsional | Seluruh FR prioritas **M** terpenuhi & lulus uji Black Box |
| NFR-02 | Efisiensi kinerja | Halaman publik responsif cepat. Foto dikompres di browser via HTML5 Canvas (`WebP`/`JPEG`) dan dibatasi maks. 2 MB oleh `/api/media` |
| NFR-03 | Kompatibilitas | Chrome/Edge/Firefox/Safari 2 versi terakhir; Android & iOS |
| NFR-04 | Usabilitas | Mobile-first (lebar ≥ 360 px) bebas *horizontal overflow*. Target skor SUS ≥ 68. Bahasa Indonesia |
| NFR-05 | Aksesibilitas | Kontras warna minimal WCAG 2.2 AA (4.5:1), label pada semua input, dukungan fokus keyboard |
| NFR-06 | Keandalan | Basis data PostgreSQL 18 lokal (`multitech_db`) / PostgreSQL 16 kontainer, dilengkapi skema migrasi Prisma & seeder deterministik |
| NFR-07 | Keamanan | HTTPS via Cloudflare (saat deployment). Password di-hash bcryptjs. Cookie sesi admin & tracking (`HttpOnly`, `SameSite=Lax`, signed HS256 via `jose`). Validasi server Zod + business rules. Validasi magic-byte & auth gate `/api/media/[...path]` |
| NFR-08 | Privasi | Data pribadi (nama, HP, plat nomor) tidak pernah dikirim ke papan antrean atau DOM tracking publik. Log/foto privat disaring `isPublic = true`. Mengacu UU No. 27/2022 (PDP) |
| NFR-09 | Pemeliharaan | TypeScript strict (`tsc --noEmit`), ESLint (`next lint`), unit test (`tsx --test`), migrasi Prisma terversi, konvensi Conventional Commits |
| NFR-10 | Portabilitas | Seluruh layanan berjalan via Docker Compose; konfigurasi lewat `.env` |

## 5. Risiko & Mitigasi
| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Kode 4 digit ditebak (tanpa batas percobaan) | Sedang | Rendah–Sedang (data anonim, tapi biaya terlihat) | Verifikasi wajib kombinasi kode + HP. Rate limiting Cloudflare (WAF rule gratis) bisa diaktifkan tanpa mengubah kode. Dicatat sebagai batasan |
| Kapasitas kode habis (10.000) | Rendah (±3–5 tahun) | Tinggi | Peringatan kapasitas (BR-01). Rencana migrasi ke 6 karakter sebagai pengembangan lanjut |
| Server rumah mati (listrik/internet) | Sedang | Tinggi | UPS, `restart: always` di Docker, monitoring uptime gratis (misal UptimeRobot) |
| Disk penuh karena media | Sedang | Sedang | Kompresi, batas ukuran, monitoring disk |
| Kehilangan data | Rendah | Tinggi | Backup terjadwal + uji restore tiap sprint rilis |
| Lingkup melebar | Tinggi | Sedang | Backlog MoSCoW, Product Owner menjaga Sprint Goal |
