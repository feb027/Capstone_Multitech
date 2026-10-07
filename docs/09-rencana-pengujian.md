# 09 — Rencana Pengujian (Black Box & UAT)

Pengujian sistem Multitech dirancang untuk memverifikasi fungsionalitas, keamanan data, dan penerimaan pengguna akhir sesuai standar akademik dan industri.

---

## 1. Metode Pengujian Black Box

Pengujian fungsionalitas dilakukan tanpa melihat struktur kode internal, menggunakan teknik:
- **Equivalence Partitioning (EP):** Mengelompokkan input valid dan tidak valid (misal: panjang digit kode, format nomor HP).
- **Boundary Value Analysis (BVA):** Menguji nilai batas (misal: nominal pembayaran sama dengan total biaya vs kurang Rp 1 vs lebih).
- **State Transition Testing:** Menguji transisi status tahapan modul sesuai alur kerja baku.

### Matriks Uji Black Box (Kritis)

| Kode Uji | Skenario Pengujian | Masukan (Input) | Hasil yang Diharapkan | Kategori |
|---|---|---|---|---|
| **TC-01** | Pembuatan kode servis unik 4-digit | Simpan penerimaan servis baru | Terbentuk 4-digit numerik acak (misal `4821`), unik dalam basis data | Positif |
| **TC-02** | Verifikasi pelanggan berhasil | Kode servis: `4821`, 4 Digit HP: `5678` (sesuai data order) | Berhasil login sesi, diarahkan ke detail progres `/track/[id]` | Positif |
| **TC-03** | Verifikasi gagal (kode salah) | Kode servis: `9999`, 4 Digit HP: `5678` | Menampilkan pesan generik "Kode atau nomor handphone tidak cocok" | Negatif |
| **TC-04** | Verifikasi gagal (HP salah) | Kode servis: `4821`, 4 Digit HP: `1234` | Menampilkan pesan generik "Kode atau nomor handphone tidak cocok" | Negatif |
| **TC-05** | Privasi data papan antrean | Buka halaman publik papan antrean | Data mobil, jenis modul, status tampil. **Nomor plat polisi dan nama pelanggan TIDAK ADA di DOM / JSON** | Keamanan |
| **TC-06** | Update status modul independen | Servis memuat 2 modul (ECU & Speedometer). Modul 1 diubah `PERBAIKAN`, Modul 2 tetap `DITERIMA` | Status modul 1 berubah, status modul 2 tidak terpengaruh | Positif |
| **TC-07** | Alur status tidak valid | Modul status `DITERIMA` langsung diubah ke `SELESAI` | Sistem menolak aksi, opsi transisi dibatasi hanya ke `DIAGNOSA` | Negatif |
| **TC-08** | Unggah foto dengan toggle privat | Upload foto jalur rusak, toggle publik = `false` | Foto tersimpan di server, muncul di admin, **TIDAK muncul di web pelanggan** | Positif |
| **TC-09** | Toggle foto menjadi publik | Admin menyalakan toggle publik = `true` | Foto seketika dapat dilihat oleh pelanggan di timeline progres | Positif |
| **TC-10** | Kalkulasi status pembayaran bertahap | Total biaya: Rp 1.000.000. Input pembayaran: Rp 300.000 | Status otomatis menjadi `DP`, sisa tagihan tercatat Rp 700.000 | Positif |
| **TC-11** | Pelunasan tagihan | Input pembayaran kedua: Rp 700.000 | Status otomatis menjadi `LUNAS`, sisa tagihan Rp 0 | Positif |
| **TC-12** | Validasi status selesai sebelum lunas | Modul diubah ke `SELESAI` saat status bayar masih `DP` tanpa override | Sistem mencegah penutupan servis dan meminta pelunasan terlebih dahulu | Negatif |
| **TC-13** | Pembuatan klaim garansi valid | Klik modul lama yang masih dalam masa garansi (`warranty_until >= hari ini`) | Terbentuk servis baru dengan flag `is_warranty_claim = true` dan tertaut ke ID modul lama | Positif |
| **TC-14** | Generate PDF Nota Tanda Terima | Klik "Cetak Nota PDF" pada servis baru | Dokumen PDF terunduh, memuat logo Multitech, tabel modul, dan QR code yang mengarah ke link cek | Positif |
| **TC-15** | Integrasi tautan WhatsApp | Klik "Kirim WA" pada servis | Membuka tab baru `https://wa.me/62...` dengan teks URL-encoded yang memuat nama, mobil, dan link cek | Positif |

---

## 2. Pengujian Penerimaan Pengguna (User Acceptance Testing - UAT)

UAT dilakukan pada Sprint 7 dengan melibatkan pemangku kepentingan langsung:
- **Partisipan Internal:** 1 Pemilik / Admin Multitech Tasikmalaya.
- **Partisipan Eksternal:** 2 Pelanggan perorangan dan 1 Pemilik bengkel mitra di Tasikmalaya.

### Skenario Tugas UAT:
1. **Admin:** Menginput servis 2 modul (ECU & BCM) dari pelanggan baru, mengunggah foto PCB, menambahkan rincian biaya komponen, mencatat DP, dan mencetak nota PDF.
2. **Pelanggan:** Membuka web publik via smartphone, mencari mobilnya di papan antrean, memasukkan kode verifikasi, melihat bukti foto solder teknisi, dan memeriksa sisa tagihan.
3. **Admin:** Mengubah status menjadi `SIAP_DIAMBIL`, mengisi garansi 3 bulan, melunasi sisa tagihan, dan mengakhiri servis.

---

## 3. Kuesioner System Usability Scale (SUS)

Pengukuran tingkat kebergunaan (*usability*) mengadopsi instrumen standar **System Usability Scale (Brooke, 1996)** dengan skala Likert 1 (Sangat Tidak Setuju) hingga 5 (Sangat Setuju).

| No | Pernyataan Instrumen SUS |
|---|---|
| Q1 | Saya merasa ingin sering menggunakan sistem pelacakan servis ini. |
| Q2 | Saya merasa sistem ini terlalu rumit untuk digunakan. *(Reverse score)* |
| Q3 | Saya merasa sistem ini mudah digunakan. |
| Q4 | Saya merasa membutuhkan bantuan teknis untuk dapat menggunakan sistem ini. *(Reverse score)* |
| Q5 | Saya merasa berbagai fitur dalam sistem ini terintegrasi dengan sangat baik. |
| Q6 | Saya merasa ada terlalu banyak hal yang tidak konsisten pada sistem ini. *(Reverse score)* |
| Q7 | Saya yakin sebagian besar orang akan cepat memahami cara kerja sistem ini. |
| Q8 | Saya merasa sistem ini sangat membingungkan saat digunakan. *(Reverse score)* |
| Q9 | Saya merasa sangat percaya diri saat menggunakan sistem ini. |
| Q10 | Saya harus mempelajari banyak hal terlebih dahulu sebelum dapat menggunakan sistem ini. *(Reverse score)* |

### Target Capaian Usability:
- **Skor Rata-rata SUS:** Target $\ge 68$ (kategori *Above Average / Grade B*, menunjukkan sistem layak diterima pengguna tanpa hambatan antarmuka berarti).
