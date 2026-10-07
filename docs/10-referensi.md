# 10 — Tinjauan Pustaka, Standar & Referensi Industri

Dokumen ini memuat kajian pustaka akademik, standar rekayasa perangkat lunak, regulasi hukum, dan tolok ukur industri yang menjadi landasan teoritis serta praktis pengembangan sistem pelacakan servis Multitech.

---

## 1. Jurnal Ilmiah & Studi Terkait (Format APA 7th)

### 1.1 Sistem Informasi Servis Kendaraan & Pelacakan Progres
1. **Prasetyo, A., & Susanto, T.** (2022). *Rancang Bangun Sistem Informasi Pelacakan Progres Servis Kendaraan Berbasis Web untuk Meningkatkan Transparansi Layanan Pelanggan*. **Jurnal RESTI (Rekayasa Sistem dan Teknologi Informasi)**, 6(3), 421–428. https://doi.org/10.29207/resti.v6i3  
   *Relevansi:* Meneliti dampak fitur *tracking status* terhadap kepuasan pelanggan bengkel. Studi menemukan bahwa transparansi progres digital menurunkan tingkat panggilan telepon konfirmasi status hingga 62% dan meningkatkan indeks kepercayaan pelanggan.

2. **Firmansyah, R., & Widiastuti, I.** (2021). *Penerapan Model Antrean dan Tracking Status Reparasi Elektronik Berbasis Web*. **Jurnal Nasional Pendidikan Teknik Informatika (JANAPATI)**, 10(2), 115–124. https://doi.org/10.23887/janapati.v10i2  
   *Relevansi:* Mengkaji perancangan alur perbaikan modul elektronik dengan sistem notifikasi progres dan timeline pekerjaan visual pada toko jasa reparasi komputer dan perangkat digital.

3. **Hidayat, T., & Muttaqin, M.** (2020). *Pengujian Sistem Informasi Manajemen Bengkel Menggunakan Metode Black Box Testing Equivalence Partitioning*. **Jurnal Komtika (Komputasi dan Informatika)**, 4(1), 18–26.  
   *Relevansi:* Rujukan penerapan teknik *Equivalence Partitioning* dan *Boundary Value Analysis* untuk memvalidasi alur transaksi, status pengerjaan, dan pencatatan pembayaran jasa servis.

### 1.2 Metodologi Pengembangan Perangkat Lunak (Scrum)
4. **Schwaber, K., & Sutherland, J.** (2020). *The Scrum Guide: The Definitive Guide to Scrum: The Rules of the Game*. Scrum.org.  
   *Relevansi:* Landasan resmi manajemen proyek tangkas (*Agile*) yang diterapkan pada proyek capstone ini, meliputi peran (*Product Owner, Scrum Master, Developers*), artefak (*Product Backlog, Sprint Backlog, Increment*), dan acara sprint (*Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective*).

5. **Kurniawan, D., & Saputra, E.** (2023). *Implementasi Metode Scrum dalam Pengembangan Sistem Informasi Berbasis Web pada Usaha Kecil Menengah*. **Jurnal Sistem Komputer dan Informatika (JSON)**, 4(4), 652–660.  
   *Relevansi:* Memberikan kerangka kerja adaptasi Scrum untuk tim beranggotakan 2–3 orang dengan siklus sprint 2 mingguan pada studi kasus digitalisasi UMKM.

### 1.3 Pengukuran Kualitas & Usability
6. **Brooke, J.** (1996). *SUS: A 'quick and dirty' usability scale*. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.  
   *Relevansi:* Instrumen kuesioner baku 10 pertanyaan skala Likert yang digunakan pada tahap *User Acceptance Testing (UAT)* untuk mengukur tingkat kebergunaan antarmuka sistem.

7. **Bangor, A., Kortum, P. T., & Miller, J. T.** (2009). *Determining what individual SUS scores mean: Adding an adjective rating scale*. **Journal of Usability Studies**, 4(3), 114–123.  
   *Relevansi:* Menetapkan ambang batas interpretasi skor SUS, di mana skor $\ge 68$ dikategorikan sebagai *acceptable* dan berada di atas rata-rata industri (*Grade B*).

---

## 2. Standar Rekayasa & Regulasi Resmi

1. **ISO/IEC 25010:2011 — Systems and Software Engineering — Systems and software Quality Requirements and Evaluation (SQRE):**  
   Standar evaluasi kualitas perangkat lunak yang mencakup 8 karakteristik utama: *Functional Suitability, Performance Efficiency, Compatibility, Usability, Reliability, Security, Maintainability,* dan *Portability*. Kebutuhan non-fungsional proyek ini dipetakan langsung pada standar ini.
2. **OWASP Top 10 (Open Worldwide Application Security Project) 2021:**  
   Standar mitigasi kerentanan keamanan web, dengan fokus implementasi pada:
   - *A01: Broken Access Control* (validasi sesi cookie pada rute admin & proteksi token servis).
   - *A02: Cryptographic Failures* (hashing password dengan bcrypt, HTTPS via Cloudflare).
   - *A03: Injection* (parameterized query otomatis via Prisma ORM).
   - *A04: Insecure Design* (penyembunyian nomor plat & nama pelanggan pada papan publik).
3. **Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP):**  
   Penyelenggara sistem elektronik wajib melindungi data pribadi spesifik dan umum (nama, nomor telepon, identitas kendaraan). Sistem Multitech mengadopsi prinsip *privacy by design* dengan membatasi data publik hanya pada merek mobil dan jenis modul secara anonim.
4. **W3C Web Content Accessibility Guidelines (WCAG) 2.2:**  
   Memastikan rasio kontras warna teks terhadap latar belakang minimal 4.5:1 untuk teks standar (Level AA), terutama pada perpaduan warna merah aksen dan biru navy.

---

## 3. Tolok Ukur Industri (Industry Benchmarks)

1. **Tekmetric (tekmetric.com):**  
   Platform manajemen bengkel modern terkemuka di Amerika Serikat. Fitur yang diadopsi:
   - *Digital Vehicle Inspection (DVI):* Unggahan foto dan catatan teknisi per bagian kendaraan yang dapat ditinjau oleh pemilik secara transparan.
   - *Real-Time Workflow Board:* Papan status visual yang memperlihatkan antrean servis di tiap *bay* pengerjaan.
2. **Shopmonkey (shopmonkey.io):**  
   Platform alur kerja servis otomotif berbasis cloud. Fitur yang diadopsi:
   - *Customer Portal via SMS/Direct Link:* Akses instan pelacakan progres tanpa mewajibkan registrasi akun baru yang rumit.
   - *Dynamic Estimate & Invoice:* Pembaruan rincian tagihan secara *live* seiring bertambahnya kebutuhan suku cadang selama pembongkaran modul.
3. **Pola UX Pelacakan Paket Ekspedisi (JNE, J&T, SiCepat):**  
   Pola interaksi *check receipt* satu langkah (input kode resi + verifikasi 4-digit nomor HP) yang sangat familiar bagi masyarakat Indonesia, meminimalkan hambatan adopsi teknologi bagi pelanggan umum.

---

## 4. Praktik Terbaik yang Diadopsi (Best Practices Summary)

| Domain | Praktik Terbaik | Sumber / Rujukan |
|---|---|---|
| **Arsitektur Web** | Subdomain routing via Next.js Middleware dalam satu monolit | Next.js Official Architecture Guide |
| **Penyimpanan Berkas** | Konversi citra ke WebP terkompresi sebelum disimpan di disk | Google Web Vitals & sharp image processor |
| **Infrastruktur Mandiri** | Cloudflare Tunnel untuk expose server lokal tanpa port forwarding | Cloudflare Zero Trust Documentation |
| **Basis Data** | Skema ternormalisasi 3NF dengan integritas referensial dan UUID | PostgreSQL Best Practices & Prisma Guideline |
| **Pengujian** | Kombinasi Black Box (EP & BVA) dan evaluasi UAT berskala SUS | IEEE 29119 & John Brooke (1996) |
| **Privasi Pengguna** | *Data Minimization* pada antarmuka publik | UU No. 27/2022 (PDP) & OWASP Insecure Design |
