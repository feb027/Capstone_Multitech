# 01 — Product Requirements Document (PRD)

| Atribut | Nilai |
|---|---|
| Produk | Multitech Service Tracking System |
| Versi dokumen | 1.0 (Final Implementasi Capstone) |
| Tanggal | 24 November 2026 |
| Pemangku kepentingan | Pemilik & admin Multitech, pelanggan perorangan, bengkel mitra, dosen pembimbing |

## 1. Latar Belakang
Multitech (Tasikmalaya) dulu adalah toko penjualan komputer. Sejak pandemi COVID-19, model bisnisnya bergeser ke jasa servis, dan sekarang berfokus pada **perbaikan modul elektronik mobil**: ECU (*Engine Control Unit*), BCM (*Body Control Module*), EPS (*Electric Power Steering*), speedometer/cluster, dan modul lain.

Karakteristik servis ini:
- Unit yang datang bisa berupa **mobil utuh** atau **modul saja** (diantar langsung atau dikirim via ekspedisi, sering dari bengkel lain).
- Pengerjaan **berhari-hari** dan bertahap: diagnosa → konfirmasi biaya → menunggu komponen → perbaikan (solder, ganti IC) → pemrograman/uji → siap diambil.
- Biaya **bertambah seiring pengerjaan** (misalnya ada komponen tambahan yang perlu diganti).

## 2. Masalah
| # | Masalah | Dampak |
|---|---|---|
| P1 | Pelanggan tidak tahu progres unitnya | Banyak telepon/chat "sudah sampai mana?", sehingga waktu admin & teknisi tersita |
| P2 | Progres & biaya dicatat manual (kertas/chat) | Data mudah hilang, sulit melacak riwayat & garansi |
| P3 | Tidak ada bukti visual pekerjaan | Kepercayaan pelanggan terhadap servis elektronik (yang "tak terlihat") rendah |
| P4 | Tidak ada rekap usaha | Pemilik sulit melihat pendapatan, modul terbanyak, mitra teraktif |

## 3. Visi Produk
> *"Pelanggan Multitech bisa melihat progres servis mobil/modulnya kapan saja, semudah cek resi paket, sementara admin mengelola seluruh servis dari satu dashboard."*

## 4. Tujuan & Metrik Keberhasilan
| Tujuan | Metrik | Target (diukur saat UAT / 1 bulan pemakaian) |
|---|---|---|
| Mengurangi pertanyaan progres manual | Jumlah chat/telepon tanya progres per unit | Turun ≥ 50% dibanding sebelum sistem |
| Pencatatan servis terpusat | % servis yang tercatat di sistem | 100% unit baru |
| Transparansi | % unit yang punya ≥ 1 catatan progres publik per hari kerja | ≥ 80% |
| Kemudahan penggunaan | Skor System Usability Scale (SUS) | ≥ 68 (di atas rata-rata) |
| Kebenaran fungsi | Test case Black Box lulus | 100% skenario kritis |

## 5. Persona
| Persona | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Admin Multitech** | Satu-satunya pengguna internal (pemilik/staf), mengurus penerimaan, pengerjaan, dan kasir. Sering bekerja dari HP di meja servis | Input cepat, update progres + foto dari HP, cetak nota, rekap |
| **Pelanggan Perorangan** | Pemilik mobil, awam teknis, akses dari HP | Tahu status, estimasi selesai, biaya, tanpa perlu daftar akun |
| **Bengkel Mitra** | Bengkel umum yang menitipkan modul pelanggannya. Tidak login, tetap memakai kode servis | Memantau banyak unit, info yang bisa diteruskan ke pelanggannya |

## 6. Ruang Lingkup

### 6.1 Termasuk (In Scope - Realisasi Final)
**Web Pelanggan (publik, tanpa login)**
1. Papan antrean berisi unit aktif & *Siap Diambil*, ditampilkan anonim (merek/tipe/tahun mobil atau genset/industri, daftar jenis modul, status, tanggal masuk), dengan pencarian/filter status serta carousel layanan.
2. Cek progres: klik kartu atau buka tautan `/cek` maupun `/cek/[kode]`, lalu masukkan **kode servis 4 digit + 4 digit akhir No. HP**.
3. Halaman detail (`/track/[publicId]`): metode masuk (`Datang Langsung`/`Ekspedisi` + nomor resi), status per modul, timeline catatan + foto publik + perbandingan *Before-After*, rincian biaya terkini, status bayar, estimasi selesai, garansi aktif (`warrantyUntil`), tautan WhatsApp CS, serta cetak nota datar *Minimal Hairline* (`window.print()`).

**Web Internal (Admin)**
1. Login & logout admin (JWT Cookie `HttpOnly`, tanpa UI manajemen multi-admin).
2. Master data pelanggan (`Perorangan` / `Bengkel Mitra` dengan dropdown dinamis) & kendaraan (merek, model, tahun, plat nomor privat, nomor rangka/VIN opsional); daftar jenis modul dikelola melalui *seed* basis data.
3. Penerimaan servis (1 kode = 1 kunjungan, kategori `OTOMOTIF` / `GENSET_INDUSTRI`, `MOBIL_UTUH` / `MODUL_SAJA`, `Datang` / `Ekspedisi` + resi), menghasilkan kode acak 4 digit unik permanen (`BR-01`).
4. Update status per modul berurutan (`BR-03`), catatan progres, dan upload foto terkompresi via `/api/media` dengan toggle publik/privat (`BR-10`).
5. Item biaya (`Jasa`/`Sparepart`/`Diagnosa`) yang terkunci otomatis ketika seluruh modul sudah final (`BR-07`).
6. Pembayaran (`DP`/`Pelunasan`; `Tunai`/`Transfer`/`QRIS`) dengan kalkulasi status bayar otomatis (`BR-05`).
7. Garansi per modul (`warrantyMonths` & `warrantyUntil`) serta pembuatan **Klaim Garansi** tertaut ke modul asal (`BR-08`).
8. Pembatalan modul dengan alasan wajib (`FR-S10`) serta override pelunasan beralasan (`BR-06`).
9. Cetak Nota Tanda Terima A4 datar *Minimal Hairline* dan tombol **"Kirim via WhatsApp"** (`wa.me`).
10. Dashboard operasional (4 kartu KPI, tabel unit aktif dengan penanda keterlambatan, panel 3 prioritas tindak lanjut, grafik bulanan) serta halaman Laporan Keuangan (filter periode, grafik bulanan, Top Modul & Merek, Top Bengkel Mitra, Ekspor CSV terproteksi injeksi rumus, dan Cetak Laporan PDF).

### 6.2 Tidak Termasuk / Di Luar Lingkup Rilis Final
- Akun/login pelanggan & bengkel mitra.
- UI CRUD Master Jenis Modul (dikelola melalui `prisma/seed.ts`).
- UI Pengaturan / Manajemen Akun Admin tambahan.
- QR Code pada nota tanda terima dan pemindai QR.
- Unggah berkas video (media dibatasi pada foto JPG/PNG/WebP terkompresi).
- Papan Kanban seret-lepas (*drag-and-drop*) dan polling otomatis antrean publik.
- Persetujuan biaya online, manajemen stok sparepart, notifikasi WhatsApp API otomatis, payment gateway, multi-role, serta printer thermal.

## 7. Asumsi & Batasan
| Jenis | Keterangan |
|---|---|
| Asumsi | Admin memiliki HP/laptop dengan kamera & internet di lokasi servis |
| Asumsi | Pelanggan memberikan No. HP yang valid saat penerimaan |
| Batasan | Server di rumah (Ubuntu): ketersediaan bergantung listrik & internet rumah |
| Batasan | Kode servis 4 digit acak & permanen: kapasitas maksimum 10.000 servis. Tanpa batas percobaan (keputusan desain demi kesederhanaan). Lihat [SRS §5 Risiko](02-SRS.md#5-risiko--mitigasi) |
| Batasan | Media gambar disimpan pada penyimpanan lokal (`./media`), ukuran unggahan server dibatasi maksimal 2 MB setelah kompresi browser |

## 8. Rilis
| Rilis | Isi | Target |
|---|---|---|
| MVP | Penerimaan servis, status per modul, papan publik, cek kode, catatan progres | Akhir Sprint 3 |
| v1.0 | + media, biaya, PDF, pembayaran, garansi, laporan, deploy | Akhir Sprint 7 |
| Pengembangan lanjut | Notifikasi WA otomatis, stok sparepart, multi-role, printer thermal, rate-limit kode | Setelah capstone |
