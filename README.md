# Multitech Service Tracking System

Sistem manajemen & pelacakan progres servis **modul elektronik mobil** (ECU, BCM, EPS, Speedometer, dll.) untuk **Multitech** (Tasikmalaya). Dibuat untuk mata kuliah **Capstone Project**.

> Status: **Sprint 0 (Analisis & Perancangan)**. Implementasi belum dimulai.

## Latar Belakang Singkat
Dulu Multitech adalah toko penjualan komputer. Sejak pandemi COVID-19, fokusnya bergeser ke **jasa servis**, dan sekarang ke **servis elektronik mobil**. Servis modul elektronik bisa memakan waktu berhari-hari (diagnosa, menunggu komponen, solder, uji). Akibatnya pelanggan sering menanyakan progres secara manual lewat telepon/WhatsApp.

## Dua Web dalam Satu Sistem

| Web | Domain (rencana) | Pengguna | Fungsi |
|---|---|---|---|
| Web Pelanggan | `multitech.<tld>` | Publik, tanpa login | Papan antrean anonim, cek progres via **kode servis + 4 digit akhir HP** |
| Web Internal | `admin.multitech.<tld>` | Admin | Penerimaan unit, progres, biaya, pembayaran, garansi, laporan |

## Dokumentasi Sprint 0

| No | Dokumen | Isi |
|---|---|---|
| 01 | [PRD](docs/01-PRD.md) | Visi produk, masalah, persona, ruang lingkup, metrik keberhasilan |
| 02 | [Spesifikasi Kebutuhan (SRS)](docs/02-SRS.md) | Kebutuhan fungsional & non-fungsional, aturan bisnis |
| 03 | [Use Case](docs/03-use-case.md) | Diagram & skenario use case |
| 04 | [Activity Diagram](docs/04-activity-diagram.md) | Alur aktivitas proses utama |
| 05 | [ERD & Kamus Data](docs/05-erd-kamus-data.md) | Rancangan basis data |
| 06 | [Arsitektur Sistem](docs/06-arsitektur.md) | Arsitektur, deployment, sequence diagram, peta rute |
| 07 | [Design System & Wireframe](docs/07-design-system.md) | Warna brand, tipografi, komponen, wireframe |
| 08 | [Product Backlog & Sprint Plan](docs/08-backlog-sprint.md) | User story, estimasi, rencana sprint |
| 09 | [Rencana Pengujian](docs/09-rencana-pengujian.md) | Black Box, UAT, SUS |
| 10 | [Referensi & Best Practice](docs/10-referensi.md) | Jurnal, standar, referensi industri |
| — | [Panduan Kontribusi](CONTRIBUTING.md) | Alur Git, konvensi commit, Definition of Done |

## Rencana Teknologi
Next.js (App Router, TypeScript) · PostgreSQL · Prisma · Tailwind CSS (tanpa library komponen) · Docker Compose · Ubuntu Server (self-host) · Cloudflare Tunnel

## Tim
| Nama | Peran Scrum | Fokus |
|---|---|---|
| _(isi)_ | Product Owner / Developer | Backend, DB, Deploy |
| _(isi)_ | Scrum Master / Developer | Web Pelanggan, PDF |
| _(isi)_ | Developer | Web Admin, Laporan, Pengujian |
