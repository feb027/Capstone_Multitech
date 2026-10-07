# Panduan Kontribusi & Alur Kerja Git (Multitech Capstone)

## 1. Strategi Pencabangan Git (Branching Strategy)

Repositori menggunakan model alur kerja berbasis fitur (*Feature-Branch Workflow*):
- `main` / `master`: Cabang produksi yang selalu dalam kondisi stabil (*deployable*).
- `develop` (opsional): Cabang integrasi mingguan selama sprint berlangsung.
- `feat/<nama-fitur>`: Cabang pengembangan fitur baru (contoh: `feat/public-board`, `feat/auth-admin`).
- `fix/<nama-bug>`: Cabang perbaikan bug (contoh: `fix/qr-code-rendering`).
- `docs/<nama-dokumen>`: Cabang pembaruan dokumentasi sprint.

---

## 2. Konvensi Pesan Komit (Conventional Commits)

Format judul komit:
```text
<tipe>(<lingkup>): <deskripsi singkat dalam bahasa indonesia atau inggris>
```

Tipe komit yang diperbolehkan:
- `feat`: Penambahan fitur baru untuk pengguna.
- `fix`: Perbaikan bug atau galat pada sistem.
- `docs`: Perubahan atau penambahan dokumentasi (PRD, diagram, markdown).
- `style`: Penyesuaian tampilan CSS / format kode tanpa mengubah logika bisnis.
- `refactor`: Perubahan struktur kode tanpa mengubah fungsionalitas.
- `test`: Penambahan atau penyesuaian skenario pengujian.
- `chore`: Konfigurasi tooling, dependensi npm, atau skrip Docker/CI.

Contoh yang benar:
- `docs(sprint-0): complete PRD, SRS, ERD, and architecture diagrams`
- `feat(public): implement anonymous queue board card component`
- `fix(auth): resolve verification session cookie expiration bug`

---

## 3. Standar Kualitas Kode

1. Semua kode aplikasi wajib menggunakan **TypeScript** (*no `any` without explicit justification*).
2. Jalankan `npm run lint` dan pastikan tidak ada peringatan atau galat sebelum membuat Pull Request.
3. Hindari menyimpan kredensial atau *secret* di dalam kode. Selalu gunakan berkas konfigurasi `.env`.
