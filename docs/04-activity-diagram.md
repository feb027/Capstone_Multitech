# 04 — Activity Diagram

Diagram ditulis dalam Mermaid agar langsung tampil di GitHub. *Swimlane* digambarkan dengan `subgraph`.

## AD-01 Penerimaan Servis (UC-14)

```mermaid
flowchart TD
    S((Mulai)) --> A1
    subgraph ADM["Admin"]
        A1["Terima mobil/modul dari pelanggan<br/>atau paket ekspedisi"] --> A2["Cari pelanggan via No. HP"]
        A3["Isi data pelanggan baru"]
        A4{"Mobil utuh atau<br/>data mobil diketahui?"}
        A5["Pilih/tambah kendaraan"]
        A6["Isi jenis penerimaan, cara masuk,<br/>No. resi, estimasi, kondisi"]
        A7["Tambah modul: jenis, detail, keluhan<br/>(boleh lebih dari satu)"]
        A8["Simpan"]
        A9["Unduh/cetak Nota PDF"]
        A10["Klik 'Kirim via WhatsApp'"]
    end
    subgraph SYS["Sistem"]
        S1{"Pelanggan<br/>ditemukan?"}
        S2{"Data valid &<br/>≥ 1 modul?"}
        S3["Generate kode 4 digit acak"]
        S4{"Kode sudah<br/>dipakai?"}
        S5["Simpan servis, modul = DITERIMA,<br/>entri timeline pertama"]
        S6["Buat PDF nota + QR /cek/kode"]
        S7["Buka wa.me dengan template pesan"]
    end
    A2 --> S1
    S1 -- Ya --> A4
    S1 -- Tidak --> A3 --> A4
    A4 -- Ya --> A5 --> A6
    A4 -- "Tidak (modul saja)" --> A6
    A6 --> A7 --> A8 --> S2
    S2 -- Tidak --> A7
    S2 -- Ya --> S3 --> S4
    S4 -- Ya --> S3
    S4 -- Tidak --> S5 --> A9 --> S6 --> A10 --> S7 --> E((Selesai))
```

## AD-02 Pengerjaan & Update Progres (UC-15, UC-16, UC-17)

```mermaid
flowchart TD
    S((Mulai)) --> A1
    subgraph ADM["Admin"]
        A1["Buka dashboard kanban / detail servis"] --> A2["Pilih modul"]
        A3["Pilih status baru"]
        A4["Tulis catatan progres<br/>(opsional)"]
        A5["Ambil/unggah foto/video<br/>(opsional)"]
        A6["Atur toggle publik/privat"]
        A7{"Ada biaya<br/>baru?"}
        A8["Tambah item biaya<br/>(jasa/sparepart/diagnosa)"]
        A9{"Perlu konfirmasi<br/>pelanggan?"}
        A10["Hubungi pelanggan via WA/telepon"]
    end
    subgraph SYS["Sistem"]
        S1["Tampilkan hanya status<br/>tujuan yang valid"]
        S2["Kompres & simpan media"]
        S3["Simpan status + entri timeline publik"]
        S4["Hitung ulang total & status bayar"]
    end
    A2 --> S1 --> A3 --> A4 --> A5 --> S2 --> A6 --> S3 --> A7
    A7 -- Ya --> A8 --> S4 --> A9
    A7 -- Tidak --> A9
    A9 -- Ya --> A10 --> E((Selesai))
    A9 -- Tidak --> E
```

## AD-03 Pelanggan Memantau Progres (UC-01 s.d. UC-06)

```mermaid
flowchart TD
    S((Mulai)) --> P0{"Masuk dari?"}
    subgraph PLG["Pengunjung / Pelanggan"]
        P0
        P1["Buka papan antrean"]
        P2["Cari/filter merek atau modul"]
        P3["Klik kartu mobilnya"]
        P4["Scan QR nota / klik link WA"]
        P5["Isi kode servis + 4 digit akhir HP"]
        P6["Lihat status, timeline, foto,<br/>biaya, estimasi, garansi"]
        P7{"Unduh<br/>dokumen?"}
        P8["Unduh nota/invoice PDF"]
    end
    subgraph SYS["Sistem"]
        S1["Tampilkan kartu anonim<br/>servis aktif & siap diambil"]
        S2["Tampilkan form<br/>(kode terisi bila dari link)"]
        S3{"Kode + HP<br/>cocok?"}
        S4["Pesan: 'Kode atau nomor tidak cocok'"]
        S5["Simpan sesi verifikasi (cookie)"]
        S6["Render detail (hanya data publik)"]
    end
    P0 -- Web --> P1 --> S1 --> P2 --> P3 --> S2
    P0 -- "QR/WA" --> P4 --> S2
    S2 --> P5 --> S3
    S3 -- Tidak --> S4 --> P5
    S3 -- Ya --> S5 --> S6 --> P6 --> P7
    P7 -- Ya --> P8 --> E((Selesai))
    P7 -- Tidak --> E
```

## AD-04 Penyelesaian, Pembayaran & Garansi (UC-18, UC-19, UC-22, UC-23)

```mermaid
flowchart TD
    S((Mulai)) --> A1
    subgraph ADM["Admin"]
        A1["Modul lulus Uji/QC"] --> A2["Ubah status ke SIAP_DIAMBIL"]
        A3["Isi masa garansi (bulan)"]
        A4["Kirim WA 'Unit siap diambil'"]
        A5["Pelanggan datang / minta kirim"]
        A6["Catat pembayaran"]
        A7["Ubah status ke SELESAI"]
        A8["Isi alasan override<br/>(misal: mitra tempo)"]
        A9["Unduh/kirim invoice PDF"]
    end
    subgraph SYS["Sistem"]
        S1["Simpan garansi sementara"]
        S2["Hitung status bayar"]
        S3{"LUNAS?"}
        S4["Set tanggal serah terima,<br/>warranty_until = serah terima + n bulan"]
        S5{"Semua modul<br/>final?"}
        S6["Kunci item biaya,<br/>hapus dari papan publik"]
    end
    A2 --> A3 --> S1 --> A4 --> A5 --> A6 --> S2 --> A7 --> S3
    S3 -- Ya --> S4
    S3 -- Tidak --> A8 --> S4
    S4 --> S5
    S5 -- Ya --> S6 --> A9 --> E((Selesai))
    S5 -- Tidak --> A9
```

## AD-05 Klaim Garansi (UC-20)

```mermaid
flowchart TD
    S((Mulai)) --> A1
    subgraph ADM["Admin"]
        A1["Pelanggan datang dengan keluhan ulang"] --> A2["Cari servis lama via kode / No. HP"]
        A3["Pilih modul → Klaim Garansi"]
        A4["Buat servis biasa (berbayar)"]
        A5["Lengkapi keluhan & estimasi"]
    end
    subgraph SYS["Sistem"]
        S1{"warranty_until<br/>≥ hari ini?"}
        S2["Buat servis baru (kode baru),<br/>is_warranty_claim = true,<br/>tautan ke servis asal"]
        S3["Salin pelanggan, kendaraan, jenis modul"]
    end
    A2 --> S1
    S1 -- Ya --> A3 --> S2 --> S3 --> A5 --> E(("Lanjut AD-02"))
    S1 -- Tidak --> A4 --> E
```

## AD-06 Pembatalan / Tidak Bisa Diperbaiki (UC-21)

```mermaid
flowchart TD
    S((Mulai)) --> A1["Admin: hasil diagnosa tidak bisa diperbaiki<br/>atau pelanggan menolak biaya"]
    A1 --> A2["Pilih status BATAL"]
    A2 --> S1{"Alasan diisi?"}
    S1 -- Tidak --> A2
    S1 -- Ya --> A3{"Tagih biaya<br/>diagnosa?"}
    A3 -- Ya --> A4["Tambah item DIAGNOSA"] --> S2
    A3 -- Tidak --> S2["Sistem: simpan BATAL + timeline publik"]
    S2 --> A5["Kirim WA: unit dapat diambil kembali"] --> E((Selesai))
```
