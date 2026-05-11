# PRD — ReimburseEasy v2
**Aplikasi Manajemen Reimbursement Berbasis Project**

> Versi: 2.0 | Status: Draft | Terakhir diperbarui: Mei 2025

---

## Daftar Isi

1. [Latar Belakang & Tujuan](#1-latar-belakang--tujuan)
2. [Target Pengguna](#2-target-pengguna)
3. [Peran & Hak Akses](#3-peran--hak-akses)
4. [Sistem Project](#4-sistem-project)
5. [Fitur Utama](#5-fitur-utama)
6. [Dashboard Analytics](#6-dashboard-analytics)
7. [Alur Pengguna](#7-alur-pengguna)
8. [Skema Database](#8-skema-database)
9. [Integrasi AI — Pembacaan Struk](#9-integrasi-ai--pembacaan-struk)
10. [Stack Teknologi](#10-stack-teknologi)
11. [Roadmap Pengembangan](#11-roadmap-pengembangan)
12. [Keputusan Desain Terbuka](#12-keputusan-desain-terbuka)

---

## 1. Latar Belakang & Tujuan

ReimburseEasy adalah aplikasi web internal untuk memproses klaim reimbursement karyawan secara terstruktur per project. Setiap klaim terikat ke satu project tertentu, sehingga pengeluaran bisa dilacak per konteks pekerjaan.

**Masalah yang diselesaikan:**
- Proses reimbursement manual yang lambat dan tidak terlacak
- Tidak ada pemisahan pengeluaran per project
- Pembacaan struk manual yang rawan kesalahan
- Tidak ada visibilitas total pengeluaran untuk manajemen

**Tujuan produk:**
- Mempercepat proses pengajuan dan approval klaim
- Memberikan visibilitas pengeluaran per project secara real-time
- Menggunakan AI untuk membaca struk secara otomatis
- Menyediakan dashboard analytics untuk manajemen

---

## 2. Target Pengguna

| Peran | Deskripsi |
|-------|-----------|
| **User** | Karyawan yang mengajukan klaim reimbursement |
| **Manager** | Mengelola user dan mereview klaim dalam project |
| **Admin** | Akses penuh ke seluruh sistem, termasuk konfigurasi |

---

## 3. Peran & Hak Akses

### 3.1 Matriks Hak Akses

| Fitur | User | Manager | Admin |
|-------|------|---------|-------|
| Registrasi mandiri | ✅ | ✅ | ✅ |
| Login ke sistem | ✅ (jika aktif) | ✅ | ✅ |
| Lihat project sendiri | ✅ | ✅ | ✅ |
| Submit klaim di project | ✅ | ✅ | ✅ |
| Lihat klaim sendiri | ✅ | ✅ | ✅ |
| Lihat semua klaim di project | ❌ | ✅ | ✅ |
| Approve / tolak klaim | ❌ | ✅ | ✅ |
| Tambah / edit / hapus user | ❌ | ✅ | ✅ |
| Set status user (aktif/nonaktif) | ❌ | ✅ | ✅ |
| Assign user ke project | ❌ | ✅ | ✅ |
| **Buat / edit / hapus project** | ❌ | ❌ | ✅ |
| Set role pengguna | ❌ | ❌ | ✅ |
| Konfigurasi AI model | ❌ | ❌ | ✅ |
| Dashboard analytics | ❌ | ✅ | ✅ |
| Export data CSV | ❌ | ✅ | ✅ |
| Audit log sistem | ❌ | ❌ | ✅ |

### 3.2 Alur Registrasi & Aktivasi

```
User daftar mandiri (form publik)
        ↓
  Status: Pending
        ↓
  Admin atau Manager review
        ↓
  Aktif → bisa login | Nonaktif → tidak bisa login
```

- Pendaftaran dilakukan di halaman publik tanpa login
- Setelah daftar, akun berstatus **Pending** dan tidak bisa login
- Admin atau Manager mengubah status menjadi **Aktif** atau **Nonaktif**
- Hanya akun berstatus Aktif yang bisa menggunakan sistem

---

## 4. Sistem Project

### 4.1 Konsep

Project adalah wadah pengelompokan klaim reimbursement. Setiap klaim wajib terikat ke satu project. Contoh project: "Proyek Gedung A", "Business Trip Singapore", "Operasional Q2 2025".

**Aturan penting:**
- Hanya **Admin** yang bisa membuat, mengedit, dan menghapus project
- Admin atau Manager dapat assign dan unassign user ke project
- User hanya melihat project yang ia ikuti
- Satu user bisa menjadi anggota di banyak project sekaligus
- Satu project bisa memiliki banyak anggota

### 4.2 Data Project

| Field | Tipe | Keterangan |
|-------|------|-----------|
| Nama project | Teks | Wajib diisi |
| Deskripsi | Teks panjang | Opsional |
| Tanggal mulai | Tanggal | Wajib diisi |
| Tanggal akhir | Tanggal | Opsional |
| Batas anggaran | Angka | Opsional; jika diisi, ada notifikasi mendekati batas |
| Status | Aktif / Arsip | Default: Aktif |
| Dibuat oleh | Referensi user | Otomatis diisi |

### 4.3 Tampilan User Setelah Login

Setelah login, user langsung melihat daftar project yang ia ikuti. Setiap kartu project menampilkan:
- Nama project dan status (Aktif / Arsip)
- Periode project
- Jumlah klaim yang ia ajukan
- Total nilai klaim miliknya di project tersebut
- Tombol untuk masuk ke project dan submit klaim baru

### 4.4 Riwayat Klaim per Project

Di dalam setiap project terdapat tab **Riwayat Klaim** yang menampilkan:
- **User biasa**: hanya klaim milik sendiri dalam project tersebut
- **Manager / Admin**: semua klaim dari semua anggota project

Tersedia filter berdasarkan: status klaim, nama user, rentang tanggal, dan kategori.

---

## 5. Fitur Utama

### 5.1 Upload & Pembacaan Struk

User dapat mengajukan klaim dengan dua cara:

**A. Upload foto struk**
- Format yang diterima: JPG dan PNG
- Setelah upload, sistem mengirim gambar ke AI model kustom
- AI mengekstrak data dan mengisi form secara otomatis (prefill)
- User mengecek dan mengoreksi data sebelum submit

**B. Isi manual**
- Jika struk tidak tersedia atau tidak bisa dibaca
- User mengisi semua field form secara manual
- Juga digunakan sebagai fallback jika AI gagal membaca

**Field yang diekstrak / diisi:**

| Field | Keterangan |
|-------|-----------|
| Nama merchant / toko | Nama tempat transaksi |
| Tanggal transaksi | Tanggal pada struk |
| Total amount | Jumlah yang dibayarkan |
| Kategori | Makanan, Transport, Akomodasi, dll |
| Deskripsi item | Uraian singkat barang/jasa |
| Nomor struk | Nomor referensi transaksi (jika ada) |
| Project | Dipilih user dari daftar project yang ia ikuti |

### 5.2 Status Klaim

```
Draft → Diajukan → Perlu Revisi → Disetujui
                              ↘ Ditolak
```

| Status | Keterangan |
|--------|-----------|
| Draft | Belum disubmit, hanya tersimpan di user |
| Diajukan | Sudah disubmit, menunggu review |
| Perlu Revisi | Manager/Admin meminta perbaikan |
| Disetujui | Klaim disetujui untuk dibayarkan |
| Ditolak | Klaim ditolak dengan catatan alasan |

### 5.3 Manajemen Pengguna (Manager & Admin)

- Melihat daftar semua user beserta status dan role
- Mengaktifkan akun user yang baru mendaftar (status Pending)
- Mengedit informasi user (nama, departemen)
- Menonaktifkan user yang sudah tidak aktif
- Menghapus user (soft delete; data klaim tetap tersimpan)
- Admin dapat mengubah role user (User ↔ Manager)

### 5.4 Konfigurasi AI Model (Admin Only)

Admin mengatur koneksi ke model AI kustom untuk pembacaan struk:

| Setting | Keterangan |
|---------|-----------|
| Base URL | Endpoint API, contoh: `https://api.mymodel.com/v1` |
| Model name | Nama model yang digunakan |
| API Key | Disimpan terenkripsi AES-256, tidak pernah dikirim ke frontend |

Tersedia tombol **Test Koneksi** untuk memvalidasi konfigurasi sebelum disimpan. Jika koneksi gagal, sistem jatuh ke mode isi manual.

---

## 6. Dashboard Analytics

Dashboard hanya dapat diakses oleh **Manager** dan **Admin**.

### 6.1 Filter Periode

Semua data di dashboard dapat difilter berdasarkan:
- **Harian** — data hari ini
- **Mingguan** — 7 hari terakhir
- **Bulanan** — bulan berjalan atau bulan tertentu

### 6.2 Metrik Ringkasan (Kartu KPI)

| Metrik | Keterangan |
|--------|-----------|
| Total klaim | Jumlah klaim dalam periode terpilih |
| Total nilai | Jumlah rupiah semua klaim |
| Klaim disetujui | Jumlah dan persentase dari total |
| Klaim pending | Jumlah yang belum diproses |

### 6.3 Breakdown per Project

Grafik batang horizontal menampilkan:
- Nilai total klaim per project
- Jumlah klaim per project
- Perbandingan antar project dalam satu periode

### 6.4 Top User Submitter

Tabel yang menampilkan user dengan jumlah klaim terbanyak dalam periode terpilih, beserta total nilainya.

### 6.5 Fitur Tambahan Dashboard

- **Filter kombinasi**: project + periode + status klaim
- **Drill-down**: klik project untuk melihat daftar klaim detailnya
- **Export CSV**: ekspor data sesuai filter yang aktif
- **Notifikasi budget**: indikator visual jika pengeluaran project mendekati batas anggaran

---

## 7. Alur Pengguna

### 7.1 Alur User — Submit Klaim

```
1. Login ke sistem
2. Melihat daftar project yang diikuti
3. Pilih project → masuk ke halaman project
4. Klik "Ajukan Klaim Baru"
5. Upload foto struk (JPG/PNG) ATAU pilih "Isi Manual"
   - Jika upload: AI membaca dan mengisi form otomatis
   - User cek dan koreksi data hasil AI (atau isi manual)
6. Pilih project (sudah terpilih dari konteks)
7. Submit klaim
8. Klaim masuk ke status "Diajukan"
9. User bisa memantau status di tab Riwayat Klaim
```

### 7.2 Alur Manager / Admin — Review Klaim

```
1. Login → melihat notifikasi klaim pending
2. Masuk ke halaman Klaim atau Dashboard
3. Filter klaim by status "Diajukan"
4. Buka detail klaim → cek struk dan data
5. Pilih aksi:
   a. Setujui → status berubah ke "Disetujui"
   b. Minta revisi → status "Perlu Revisi" + catatan
   c. Tolak → status "Ditolak" + alasan wajib diisi
6. User menerima notifikasi in-app
```

### 7.3 Alur Admin — Kelola Project

```
1. Login → menu Projects
2. Buat project baru:
   - Isi nama, deskripsi, tanggal, batas anggaran
   - Simpan → project aktif
3. Assign anggota:
   - Buka project → tab Anggota
   - Cari dan pilih user → tambahkan
4. Monitor project via Dashboard
5. Arsipkan project saat selesai
```

---

## 8. Skema Database

Sistem menggunakan **SQLite** sebagai database.

### 8.1 Tabel `users`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | Auto increment |
| name | TEXT | Nama lengkap |
| email | TEXT UNIQUE | Email untuk login |
| password_hash | TEXT | Hash bcrypt |
| role | TEXT | `user` / `manager` / `admin` |
| status | TEXT | `pending` / `active` / `inactive` |
| department | TEXT | Departemen / divisi |
| created_at | DATETIME | Waktu registrasi |
| updated_at | DATETIME | Waktu update terakhir |

### 8.2 Tabel `projects` *(baru)*

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | Auto increment |
| name | TEXT | Nama project |
| description | TEXT | Deskripsi opsional |
| start_date | DATE | Tanggal mulai |
| end_date | DATE | Tanggal akhir (nullable) |
| budget_limit | REAL | Batas anggaran (nullable) |
| status | TEXT | `active` / `archived` |
| created_by | INTEGER FK→users | Admin yang membuat |
| created_at | DATETIME | Waktu pembuatan |
| updated_at | DATETIME | Waktu update terakhir |

### 8.3 Tabel `project_members` *(baru)*

Tabel many-to-many antara `users` dan `projects`.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | Auto increment |
| project_id | INTEGER FK→projects | Project |
| user_id | INTEGER FK→users | Anggota |
| assigned_by | INTEGER FK→users | Admin/Manager yang assign |
| assigned_at | DATETIME | Waktu di-assign |

### 8.4 Tabel `claims`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | Auto increment |
| user_id | INTEGER FK→users | Pengaju klaim |
| project_id | INTEGER FK→projects | Project terkait *(baru)* |
| receipt_image_path | TEXT | Path file foto struk (nullable) |
| merchant_name | TEXT | Nama toko / merchant |
| transaction_date | DATE | Tanggal transaksi |
| amount | REAL | Total nilai klaim |
| category | TEXT | Kategori pengeluaran |
| description | TEXT | Deskripsi singkat |
| receipt_number | TEXT | Nomor struk (nullable) |
| status | TEXT | `draft` / `submitted` / `revision` / `approved` / `rejected` |
| ai_extracted | BOOLEAN | True jika data dari AI |
| notes | TEXT | Catatan dari reviewer |
| reviewed_by | INTEGER FK→users | Admin/Manager reviewer |
| reviewed_at | DATETIME | Waktu review |
| created_at | DATETIME | Waktu pengajuan |
| updated_at | DATETIME | Waktu update terakhir |

### 8.5 Tabel `ai_config`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | |
| base_url | TEXT | Endpoint API |
| model_name | TEXT | Nama model |
| api_key_encrypted | TEXT | API key terenkripsi AES-256 |
| updated_by | INTEGER FK→users | Admin yang mengubah |
| updated_at | DATETIME | Waktu update |

### 8.6 Tabel `audit_logs`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | |
| user_id | INTEGER FK→users | Pelaku aksi |
| action | TEXT | Jenis aksi (create_project, assign_member, dll) |
| target_type | TEXT | Tipe objek yang diaksi |
| target_id | INTEGER | ID objek yang diaksi |
| details | TEXT (JSON) | Data tambahan aksi |
| created_at | DATETIME | Waktu aksi |

### 8.7 Contoh Query Dashboard

```sql
-- Total klaim per project bulan ini
SELECT
  p.name AS project_name,
  COUNT(c.id) AS total_claims,
  SUM(c.amount) AS total_amount,
  SUM(CASE WHEN c.status = 'approved' THEN 1 ELSE 0 END) AS approved_count
FROM claims c
JOIN projects p ON c.project_id = p.id
WHERE c.created_at >= date('now', 'start of month')
GROUP BY p.id
ORDER BY total_amount DESC;

-- Breakdown harian dalam seminggu
SELECT
  date(c.created_at) AS day,
  COUNT(c.id) AS total_claims,
  SUM(c.amount) AS total_amount
FROM claims c
WHERE c.created_at >= date('now', '-7 days')
GROUP BY date(c.created_at)
ORDER BY day;
```

---

## 9. Integrasi AI — Pembacaan Struk

### 9.1 Alur Pembacaan

```
User upload foto (JPG/PNG)
        ↓
Backend encode gambar ke Base64
        ↓
Kirim POST request ke custom AI API
  Headers: Authorization: Bearer {api_key}
  Body: { model, image_base64, prompt }
        ↓
Terima response JSON
        ↓
Parse dan prefill form klaim
        ↓
User review dan submit
```

### 9.2 Format Response AI yang Diharapkan

```json
{
  "merchant_name": "Indomaret Sudirman",
  "transaction_date": "2025-05-10",
  "total_amount": 87500,
  "category": "Makanan & Minuman",
  "items": ["Aqua 600ml", "Indomie goreng x2"],
  "receipt_number": "TRX-20250510-0042",
  "confidence": 0.94
}
```

### 9.3 Penanganan Error & Fallback

| Kondisi | Penanganan |
|---------|-----------|
| AI timeout (>10 detik) | Tampilkan notifikasi, buka form manual |
| Confidence < 0.7 | Beri peringatan "Data mungkin tidak akurat", user tetap bisa edit |
| API error (4xx/5xx) | Log error, fallback ke form manual |
| Gambar tidak terbaca | Notifikasi "Struk tidak terbaca", sarankan foto ulang atau isi manual |
| AI config belum diset | Langsung tampilkan form manual, tampilkan info ke admin |

### 9.4 Keamanan API Key

- API key disimpan di database dalam bentuk terenkripsi (AES-256)
- API key tidak pernah dikirim ke frontend / client
- Semua request ke AI API dilakukan dari sisi backend
- API key ditampilkan sebagai `••••••••` di UI, bisa di-update tapi tidak bisa dilihat

---

## 10. Stack Teknologi

### Backend

| Komponen | Pilihan |
|----------|---------|
| Framework | Python + FastAPI |
| Database | SQLite + SQLAlchemy ORM |
| Autentikasi | JWT (JSON Web Token) |
| Password hashing | bcrypt |
| HTTP client (AI call) | httpx (async) |
| Enkripsi API key | cryptography (Fernet / AES-256) |

### Frontend

| Komponen | Pilihan |
|----------|---------|
| Framework | React + Next.js |
| Styling | TailwindCSS |
| State / data fetching | React Query (TanStack Query) |
| Form | React Hook Form + Zod validation |
| Chart dashboard | Recharts atau Chart.js |

### Penyimpanan & Keamanan

| Komponen | Pilihan |
|----------|---------|
| Database file | SQLite (lokal, satu file) |
| Penyimpanan foto | Lokal (`/uploads/`) atau S3-compatible |
| Transport | HTTPS wajib di production |
| CORS | Dibatasi ke origin frontend saja |

---

## 11. Roadmap Pengembangan

### Fase 1 — Fondasi (4–6 minggu)

Deliverables:
- Registrasi user + sistem aktivasi (Pending → Aktif)
- Login / logout dengan JWT
- Tiga role: User, Manager, Admin
- CRUD project oleh Admin
- Assign / unassign anggota project oleh Admin & Manager
- Manajemen user oleh Manager & Admin
- Form klaim manual (tanpa AI), terikat ke project
- Riwayat klaim per project

### Fase 2 — AI & Upload (3–4 minggu)

Deliverables:
- Upload foto struk (JPG, PNG)
- Integrasi custom AI model (konfigurasi dari panel admin)
- Prefill form otomatis dari hasil AI
- Penanganan error dan fallback ke manual
- Panel konfigurasi AI di settings admin (base URL, model, API key)
- Tombol test koneksi AI

### Fase 3 — Approval Flow + Dashboard (3–4 minggu)

Deliverables:
- Alur approve / tolak / minta revisi klaim
- Notifikasi in-app (badge, alert)
- Dashboard admin & manager dengan filter harian/mingguan/bulanan
- Breakdown per project dan per user
- Export data CSV
- Audit log aksi sistem

### Fase 4 — Polish (2 minggu)

Deliverables:
- Drill-down dashboard (klik project → detail klaim)
- Notifikasi mendekati batas anggaran project
- Filter kombinasi (project + periode + status)
- Optimasi query SQLite (index pada project_id, user_id, created_at)
- UX polish dan responsive mobile

---

## 12. Keputusan Desain Terbuka

Hal-hal berikut perlu dikonfirmasi sebelum development dimulai:

| # | Pertanyaan | Default saat ini |
|---|------------|-----------------|
| 1 | Apakah Manager bisa approve klaim di semua project, atau hanya project yang ia assign? | Semua project |
| 2 | Apakah chain approval diperlukan (Manager → Admin)? | Tidak; keduanya bisa approve sendiri |
| 3 | Kategori klaim: tetap (hardcoded) atau bisa dikonfigurasi admin? | Tetap (Makanan, Transport, Akomodasi, Lain-lain) |
| 4 | Apakah satu klaim bisa punya beberapa struk / attachment? | Tidak; satu klaim = satu foto |
| 5 | Notifikasi lewat email, atau in-app saja? | In-app saja di fase awal |
| 6 | Apakah perlu fitur multi-currency? | Tidak; hanya Rupiah |

---

*Dokumen ini adalah living document. Perubahan dicatat di bagian atas dengan update versi.*
