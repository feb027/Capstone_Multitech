# 01 — Product Requirements Document (PRD)

| Atribut | Nilai |
|---|---|
| Produk | Multitech Service Tracking System |
| Versi dokumen | 0.1 (Sprint 0) |
| Tanggal | 7 Oktober 2026 |
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

### 6.1 Termasuk (In Scope)
**Web Pelanggan (publik, tanpa login)**
1. Papan antrean berisi unit aktif & *Siap Diambil*, ditampilkan anonim (merek/tipe/tahun mobil, jenis modul, status, tanggal masuk), dengan pencarian/filter.
2. Cek progres: klik kartu atau buka link/QR, lalu masukkan **kode servis 4 digit + 4 digit akhir No. HP**.
3. Halaman detail: status per modul, timeline catatan + foto/video publik, rincian biaya terkini, status bayar, estimasi selesai, garansi, unduh nota/invoice PDF.

**Web Internal (Admin)**
1. Login admin.
2. Master data: pelanggan (perorangan/mitra), kendaraan, jenis modul (bisa ditambah admin).
3. Penerimaan servis (1 kode = 1 kunjungan, berisi ≥ 1 modul), generate kode acak 4 digit permanen.
4. Update status per modul, catatan progres, upload foto/video dengan toggle publik/privat.
5. Item biaya (jasa/sparepart/diagnosa) yang bisa ditambah sepanjang servis.
6. Pembayaran (DP/pelunasan; tunai/transfer/QRIS) dengan status bayar otomatis.
7. Garansi per modul & klaim garansi (servis baru yang tertaut ke servis asal).
8. Pembatalan / tidak bisa diperbaiki, dengan alasan & biaya diagnosa.
9. Nota tanda terima & invoice **PDF** dengan QR code, tombol **"Kirim via WhatsApp"** (link `wa.me`).
10. Dashboard (kanban status) & laporan.

### 6.2 Tidak Termasuk (Out of Scope v1)
- Akun/login pelanggan & bengkel mitra.
- Persetujuan biaya online (persetujuan via telepon/WA, admin mengubah status).
- Manajemen stok sparepart.
- Notifikasi otomatis WhatsApp API / SMS / email.
- Pembayaran online (payment gateway).
- Multi-role (teknisi/kasir terpisah).
- Cetak printer thermal (v1 cukup PDF).

## 7. Asumsi & Batasan
| Jenis | Keterangan |
|---|---|
| Asumsi | Admin memiliki HP/laptop dengan kamera & internet di lokasi servis |
| Asumsi | Pelanggan memberikan No. HP yang valid saat penerimaan |
| Batasan | Server di rumah (Ubuntu): ketersediaan bergantung listrik & internet rumah |
| Batasan | Kode servis 4 digit acak & permanen: kapasitas maksimum 10.000 servis. Tanpa batas percobaan (keputusan desain demi kesederhanaan). Lihat [SRS §5 Risiko](02-SRS.md#5-risiko--mitigasi) |
| Batasan | Media disimpan di disk server, sehingga ukuran video dibatasi |

## 8. Rilis
| Rilis | Isi | Target |
|---|---|---|
| MVP | Penerimaan servis, status per modul, papan publik, cek kode, catatan progres | Akhir Sprint 3 |
| v1.0 | + media, biaya, PDF, pembayaran, garansi, laporan, deploy | Akhir Sprint 7 |
| Pengembangan lanjut | Notifikasi WA otomatis, stok sparepart, multi-role, printer thermal, rate-limit kode | Setelah capstone |
