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
| FR-P01 | Sistem menampilkan papan antrean berisi servis yang **minimal satu modulnya** belum berstatus `SELESAI`/`BATAL` | M |
| FR-P02 | Kartu papan menampilkan: merek, tipe, tahun mobil (atau "Modul saja" jika tanpa data mobil), daftar jenis modul + status, tanggal masuk. **Tidak** menampilkan nama, No. HP, plat nomor, atau kode servis | M |
| FR-P03 | Pengunjung dapat mencari/memfilter papan berdasarkan merek mobil, jenis modul, dan status | S |
| FR-P04 | Papan diperbarui berkala (polling ≤ 60 detik) tanpa reload manual | C |
| FR-P05 | Klik kartu membuka form verifikasi: kode servis (4 digit) + 4 digit akhir No. HP. Kartu hanya membawa ID publik acak; verifikasi harus cocok dengan servis kartu tersebut | M |
| FR-P06 | Link langsung `/cek/{kode}` (dari QR/WA) membuka form verifikasi dengan kode terisi otomatis. Pengunjung cukup memasukkan 4 digit HP | M |
| FR-P07 | Halaman detail menampilkan per modul: status terkini, progress bar, timeline catatan & media **publik** urut waktu | M |
| FR-P08 | Halaman detail menampilkan rincian biaya terkini, total, total dibayar, sisa, dan status bayar | M |
| FR-P09 | Halaman detail menampilkan estimasi tanggal selesai | M |
| FR-P10 | Halaman detail menampilkan masa garansi per modul (tanggal berakhir & status berlaku/habis) | M |
| FR-P11 | Pelanggan dapat mengunduh nota tanda terima & invoice (PDF) | M |
| FR-P12 | Riwayat & garansi tetap dapat diakses dengan kode yang sama setelah servis selesai | M |
| FR-P13 | Sesi verifikasi diingat di perangkat (cookie, ±24 jam) agar tidak perlu input ulang | S |

### 2.2 Web Internal — Autentikasi & Master
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-A01 | Admin login dengan email & password, lalu logout | M |
| FR-A02 | Admin dapat mengelola akun admin lain & ganti password | S |
| FR-A03 | CRUD Pelanggan: nama, No. HP (unik), tipe (Perorangan/Mitra), nama bengkel (untuk Mitra), alamat, catatan | M |
| FR-A04 | Pencarian pelanggan berdasarkan No. HP/nama, lalu tampilkan kendaraan & riwayat servisnya | M |
| FR-A05 | CRUD Kendaraan milik pelanggan: merek, tipe, tahun, plat (privat), nomor rangka (opsional) | M |
| FR-A06 | CRUD Jenis Modul (ECU, BCM, EPS, Speedometer, dll.), bisa ditambah/dinonaktifkan admin | M |

### 2.3 Web Internal — Servis
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-S01 | Admin membuat servis: pilih/buat pelanggan, pilih/buat kendaraan (opsional bila modul saja), jenis penerimaan (Mobil Utuh/Modul Saja), cara masuk (Datang/Ekspedisi + No. resi), estimasi selesai, catatan kondisi | M |
| FR-S02 | Satu servis memuat ≥ 1 modul. Tiap modul memiliki jenis, detail/part number, dan keluhan | M |
| FR-S03 | Sistem membuat **kode servis 4 digit acak unik** saat servis dibuat (lihat BR-01) | M |
| FR-S04 | Admin mengubah status tiap modul sesuai alur status (BR-03). Setiap perubahan otomatis tercatat di timeline | M |
| FR-S05 | Admin menambah catatan progres per modul dengan toggle publik/privat | M |
| FR-S06 | Admin mengunggah foto/video ke catatan (dari kamera HP), tiap media punya toggle publik/privat | M |
| FR-S07 | Admin menambah/mengubah/menghapus item biaya (Jasa/Sparepart/Diagnosa) kapan saja selama servis belum ditutup | M |
| FR-S08 | Admin mencatat pembayaran (nominal, metode, tanggal, catatan). Status bayar dihitung otomatis (BR-05) | M |
| FR-S09 | Admin menetapkan masa garansi (bulan) per modul saat modul ditandai `SIAP_DIAMBIL`/`SELESAI`. Tanggal akhir dihitung dari tanggal serah terima | M |
| FR-S10 | Admin menandai modul `BATAL` dengan alasan wajib. Biaya diagnosa tetap dapat ditagihkan | M |
| FR-S11 | Admin membuat **Klaim Garansi** dari servis lama yang garansinya masih berlaku. Servis baru tertaut ke servis asal | M |
| FR-S12 | Admin mengubah estimasi selesai. Perubahan tercatat di timeline | S |
| FR-S13 | Sistem menghasilkan nota tanda terima PDF (data servis, modul, kode, QR ke `/cek/{kode}`) | M |
| FR-S14 | Sistem menghasilkan invoice PDF (rincian biaya, pembayaran, garansi) | M |
| FR-S15 | Tombol "Kirim via WhatsApp" membuka `wa.me/<no>` dengan template pesan (penerimaan, siap diambil, dll.) | M |

### 2.4 Web Internal — Dashboard & Laporan
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-D01 | Dashboard kanban: modul aktif dikelompokkan per status | M |
| FR-D02 | Penanda servis yang melewati estimasi selesai | S |
| FR-D03 | Laporan per periode: jumlah servis, pendapatan (dari pembayaran), piutang | M |
| FR-D04 | Laporan jenis modul & merek mobil terbanyak | S |
| FR-D05 | Laporan bengkel mitra teraktif | S |
| FR-D06 | Rata-rata lama pengerjaan & tingkat klaim garansi per jenis modul | C |
| FR-D07 | Ekspor laporan ke CSV/PDF | C |

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
| NFR-02 | Efisiensi kinerja | Halaman publik ≤ 3 detik pada 4G (LCP). Foto dikompres ke ≤ 300 KB (WebP), video ≤ 50 MB / 60 detik |
| NFR-03 | Kompatibilitas | Chrome/Edge/Firefox/Safari 2 versi terakhir; Android & iOS |
| NFR-04 | Usabilitas | Mobile-first (lebar ≥ 360 px). Skor SUS ≥ 68. Bahasa Indonesia |
| NFR-05 | Aksesibilitas | Kontras warna minimal WCAG 2.2 AA (4.5:1 untuk teks), label pada semua input |
| NFR-06 | Keandalan | Backup DB harian (`pg_dump`, simpan 14 hari) + backup media mingguan ke penyimpanan terpisah |
| NFR-07 | Keamanan | HTTPS (Cloudflare). Password di-hash (bcrypt/argon2). Cookie sesi `HttpOnly`, `Secure`, `SameSite=Lax`. Validasi input di server (Zod). Proteksi CSRF bawaan Server Actions. Mitigasi OWASP Top 10 |
| NFR-08 | Privasi | Data pribadi (nama, HP, plat) tidak pernah dikirim ke halaman publik. Media publik diperiksa admin. Mengacu UU No. 27/2022 (PDP) |
| NFR-09 | Pemeliharaan | TypeScript strict, ESLint + Prettier, migrasi DB terversi (Prisma Migrate), konvensi commit |
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
