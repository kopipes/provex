# DESIGN.md — ReimburseEasy
**Panduan Desain & Antarmuka Pengguna**

> Versi: 1.0 | Status: Draft | Terakhir diperbarui: Mei 2025

---

## Daftar Isi

1. [Prinsip Desain](#1-prinsip-desain)
2. [Identitas Visual](#2-identitas-visual)
3. [Tipografi](#3-tipografi)
4. [Warna](#4-warna)
5. [Komponen UI](#5-komponen-ui)
6. [Tata Letak & Grid](#6-tata-letak--grid)
7. [Ikon](#7-ikon)
8. [Motion & Animasi](#8-motion--animasi)
9. [Peta Halaman](#9-peta-halaman)
10. [Wireframe Per Halaman](#10-wireframe-per-halaman)
11. [Responsivitas](#11-responsivitas)
12. [Aksesibilitas](#12-aksesibilitas)

---

## 1. Prinsip Desain

ReimburseEasy adalah alat kerja harian — bukan marketing site. Desainnya mengutamakan **kejelasan** dan **efisiensi**, bukan kecanggihan visual. Setiap elemen ada karena fungsinya, bukan hiasannya.

### Empat prinsip utama

**Cepat dibaca, cepat dikerjakan.**
Pengguna membuka aplikasi ini di sela pekerjaan lain. Status klaim, tombol aksi, dan angka penting harus langsung terlihat tanpa scrolla.

**Hierarki yang jelas.**
Informasi paling penting selalu paling menonjol. Aksi primer selalu satu — tidak ada dua tombol biru di satu layar.

**Tidak ada ambiguitas.**
Label jelas, status berwarna, dan pesan error menjelaskan apa yang salah dan cara memperbaikinya. Pengguna tidak perlu menebak.

**Konsisten di seluruh peran.**
User, Manager, dan Admin melihat antarmuka yang sama strukturnya — hanya elemen yang relevan yang ditampilkan, bukan antarmuka berbeda per peran.

---

## 2. Identitas Visual

### Karakter

Utilitarian yang hangat. Bukan korporat yang dingin, bukan startup yang terlalu playful. Seperti spreadsheet yang dipoles — fungsional, tapi menyenangkan untuk dipakai setiap hari.

### Referensi estetika

- **Linear, Notion**: kepadatan informasi yang terkontrol, banyak whitespace, tipografi sebagai hierarki
- **Vercel Dashboard**: warna netral dengan aksen tajam, tabel data yang bersih
- **Figma**: sidebar navigasi yang padat, panel kanan untuk detail

### Tone of voice (label, pesan, microcopy)

- Langsung ke inti, tidak basa-basi
- Kalimat aktif: "Ajukan Klaim" bukan "Pengajuan Klaim Baru"
- Error message: jelaskan masalah + solusi dalam satu kalimat
- Hindari jargon teknis di antarmuka user biasa

---

## 3. Tipografi

### Font

| Peran | Font | Sumber |
|-------|------|--------|
| Heading / display | **Plus Jakarta Sans** | Google Fonts |
| Body / UI | **DM Sans** | Google Fonts |
| Monospace (kode, ID, nominal) | **JetBrains Mono** | Google Fonts |

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

### Skala Tipografi

| Token | Font | Size | Weight | Line-height | Penggunaan |
|-------|------|------|--------|-------------|-----------|
| `text-page-title` | Display | 24px | 700 | 1.3 | Judul halaman |
| `text-section-title` | Display | 18px | 600 | 1.4 | Judul section, modal |
| `text-card-title` | Display | 15px | 600 | 1.4 | Judul kartu, sidebar item aktif |
| `text-body` | Body | 14px | 400 | 1.6 | Teks paragraf, label form |
| `text-body-medium` | Body | 14px | 500 | 1.6 | Label penting, kolom tabel |
| `text-small` | Body | 12px | 400 | 1.5 | Metadata, timestamp, hint |
| `text-small-medium` | Body | 12px | 500 | 1.5 | Badge label, tag |
| `text-mono` | Mono | 13px | 400 | 1.5 | Nominal Rupiah, ID klaim, kode |

### Aturan Tipografi

- Nominal Rupiah **selalu** menggunakan `font-mono` dan rata kanan di tabel
- Jangan melebihi dua ukuran font dalam satu kartu
- `text-small` untuk semua timestamp dan metadata — bukan untuk informasi primer
- Heading halaman maksimal satu per halaman

---

## 4. Warna

### Filosofi Warna

Palet netral dominan dengan satu aksen biru yang konsisten. Status dan kondisi menggunakan warna semantik standar (hijau/kuning/merah). Tidak ada warna dekoratif.

### Token Warna

```css
:root {
  /* --- Background --- */
  --color-bg-base:      #F7F7F6;  /* Background halaman */
  --color-bg-surface:   #FFFFFF;  /* Kartu, panel, modal */
  --color-bg-subtle:    #F0EFED;  /* Input, badge, hover state */
  --color-bg-inverse:   #18181B;  /* Sidebar dark, tooltip */

  /* --- Border --- */
  --color-border-default: #E4E4E1; /* Border kartu, divider */
  --color-border-strong:  #CDCDC9; /* Border input, tabel */
  --color-border-focus:   #3B6EF8; /* Focus ring */

  /* --- Text --- */
  --color-text-primary:   #18181B; /* Teks utama */
  --color-text-secondary: #6B6B6B; /* Label, metadata */
  --color-text-muted:     #A3A3A0; /* Placeholder, disabled */
  --color-text-inverse:   #FFFFFF; /* Teks di atas background gelap */
  --color-text-link:      #3B6EF8; /* Link, aksi sekunder */

  /* --- Aksen (Brand) --- */
  --color-accent:         #3B6EF8; /* Tombol primer, highlight */
  --color-accent-hover:   #2D5DE8; /* Hover tombol primer */
  --color-accent-subtle:  #EEF2FF; /* Background badge info, highlight ringan */
  --color-accent-text:    #2040C0; /* Teks di atas accent-subtle */

  /* --- Semantik: Status --- */
  --color-success:        #16A34A;
  --color-success-subtle: #F0FDF4;
  --color-success-text:   #14532D;

  --color-warning:        #CA8A04;
  --color-warning-subtle: #FEFCE8;
  --color-warning-text:   #713F12;

  --color-danger:         #DC2626;
  --color-danger-subtle:  #FEF2F2;
  --color-danger-text:    #7F1D1D;

  --color-neutral:        #71717A;
  --color-neutral-subtle: #F4F4F5;
  --color-neutral-text:   #3F3F46;
}
```

### Penggunaan Status Warna

| Status Klaim | Background | Text | Border |
|--------------|------------|------|--------|
| Draft | `--color-neutral-subtle` | `--color-neutral-text` | — |
| Diajukan | `--color-accent-subtle` | `--color-accent-text` | — |
| Perlu Revisi | `--color-warning-subtle` | `--color-warning-text` | — |
| Disetujui | `--color-success-subtle` | `--color-success-text` | — |
| Ditolak | `--color-danger-subtle` | `--color-danger-text` | — |

| Status User | Warna |
|-------------|-------|
| Pending | Warning |
| Aktif | Success |
| Nonaktif | Neutral |

---

## 5. Komponen UI

### 5.1 Tombol (Button)

Tiga varian, satu ukuran default (height 36px), satu ukuran kecil (height 30px).

```
Primer   [  Ajukan Klaim  ]   — bg: accent, text: white
Sekunder [     Batal      ]   — bg: subtle, text: primary, border: default
Destructive [ Hapus       ]   — bg: danger-subtle, text: danger-text
```

**Aturan:**
- Tombol primer maksimal satu per halaman / per modal
- Tombol destructive selalu didahului dialog konfirmasi
- Loading state: teks diganti spinner inline, tombol di-disable
- Jangan gunakan icon-only button tanpa tooltip

```css
.btn-primary {
  height: 36px;
  padding: 0 16px;
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 150ms ease;
}
.btn-primary:hover  { background: var(--color-accent-hover); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
```

### 5.2 Badge Status

Badge digunakan untuk status klaim dan status user. Selalu teks pendek, tidak pernah lebih dari 2 kata.

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.badge-submitted { background: var(--color-accent-subtle);  color: var(--color-accent-text); }
.badge-approved  { background: var(--color-success-subtle); color: var(--color-success-text); }
.badge-revision  { background: var(--color-warning-subtle); color: var(--color-warning-text); }
.badge-rejected  { background: var(--color-danger-subtle);  color: var(--color-danger-text); }
.badge-draft     { background: var(--color-neutral-subtle); color: var(--color-neutral-text); }
```

### 5.3 Form Input

```css
.input {
  height: 36px;
  padding: 0 12px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-primary);
  width: 100%;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input:hover  { border-color: var(--color-text-secondary); }
.input:focus  {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(59, 110, 248, 0.15);
}
.input::placeholder { color: var(--color-text-muted); }
.input.error  { border-color: var(--color-danger); }
```

**Label form:**
```
Label          ← 12px, font-weight 500, color: text-secondary
[  Input   ]   ← height 36px
Pesan hint     ← 12px, color: text-muted
⚠ Pesan error  ← 12px, color: danger (muncul di bawah input, menggantikan hint)
```

Gap antara label dan input: 6px. Gap antar field: 20px.

### 5.4 Kartu (Card)

```css
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  padding: 20px 24px;
}
.card-compact {
  padding: 14px 16px;
}
```

Kartu tidak punya shadow default. Shadow hanya untuk modal/overlay.

### 5.5 Tabel Data

Digunakan untuk: daftar klaim, daftar user, daftar anggota project.

```
┌────────────────────────────────────────────────────────────┐
│ Header baris   ← bg: bg-subtle, border-bottom: border-strong│
├────────────────────────────────────────────────────────────┤
│ Baris data     ← bg: surface, border-bottom: border-default │
│ Baris data (hover) ← bg: bg-subtle                         │
└────────────────────────────────────────────────────────────┘
```

**Aturan tabel:**
- Kolom nominal Rupiah: rata kanan, font-mono
- Kolom tanggal: format `DD MMM YYYY` (contoh: `10 Mei 2025`)
- Kolom status: badge, jangan teks polos
- Kolom aksi: rata kanan, icon button dengan tooltip
- Tidak ada horizontal scroll di desktop — batasi kolom yang ditampilkan
- Empty state: ilustrasi minimal + teks panduan aksi pertama

### 5.6 Sidebar Navigasi

Sidebar kiri dengan lebar tetap 240px di desktop.

```
┌─────────────────────┐
│  Logo  ReimburseEasy│  ← 56px tinggi header
├─────────────────────┤
│ ▪ Dashboard         │  ← item aktif: bg accent-subtle, text accent
│   Project           │  ← item biasa: text secondary
│   Klaim Saya        │
│   Riwayat           │
├─────────────────────┤
│ [hanya Manager/Admin]│
│   Semua Klaim       │
│   Pengguna          │
├─────────────────────┤
│ [hanya Admin]       │
│   Manajemen Project │
│   Pengaturan AI     │
│   Audit Log         │
├─────────────────────┤
│  [avatar]  Nama     │  ← 56px tinggi footer, user info + logout
└─────────────────────┘
```

**Aturan sidebar:**
- Section separator: garis tipis 1px + label section 11px uppercase letter-spacing
- Item yang tidak tersedia untuk peran user tidak ditampilkan (bukan disabled)
- Di mobile: sidebar menjadi bottom tab bar (maks 4 item), item lain ke menu hamburger

### 5.7 Modal & Dialog

```
┌──────────────────────────────────┐
│ Judul Modal                 [✕] │  ← padding 20px, border-bottom
│                                  │
│  Konten modal                    │  ← padding 24px
│                                  │
│ [Batal]      [Aksi Primer]       │  ← padding 16px 24px, border-top
└──────────────────────────────────┘
```

- Lebar maksimal: 480px (small), 640px (medium), 800px (large)
- Overlay: `rgba(0,0,0,0.4)` di belakang modal
- Menutup modal: klik overlay, tombol ✕, atau Escape
- Animasi masuk: fade + slide up 8px, 200ms ease-out
- Dialog konfirmasi (hapus, dll): selalu modal small dengan teks konfirmasi eksplisit

### 5.8 Notifikasi / Toast

Muncul di pojok kanan bawah. Auto-dismiss setelah 4 detik.

```
✓ Klaim berhasil diajukan          ← success, bg: success-subtle
⚠ Struk tidak terbaca oleh AI     ← warning, bg: warning-subtle
✕ Gagal menyimpan. Coba lagi.     ← error, bg: danger-subtle
```

Tinggi toast: 48px. Maks 3 toast sekaligus, sisanya antre.

### 5.9 Kartu Project (di halaman user)

```
┌─────────────────────────────────────────┐
│ 📁 Nama Project              [Aktif]    │
│                                          │
│ Jan 2025 – Jun 2025                      │
│ 23 klaim · 8 anggota · Rp 14.250.000   │
│                                          │
│                        [Lihat Project →] │
└─────────────────────────────────────────┘
```

Kartu project di-render dalam grid 2 kolom di desktop, 1 kolom di mobile.

### 5.10 Upload Struk

```
┌───────────────────────────────────┐
│                                   │
│     ↑  Seret foto ke sini         │
│     atau klik untuk pilih         │
│                                   │
│     JPG atau PNG, maks 5 MB       │
│                                   │
└───────────────────────────────────┘
```

State setelah upload:
```
┌───────────────────────────────────┐
│ [thumbnail foto]  struk.jpg       │
│                   1.2 MB   [✕]   │
│ ⟳ Membaca struk...                │
└───────────────────────────────────┘
```

State setelah AI selesai:
```
┌───────────────────────────────────┐
│ [thumbnail foto]  struk.jpg       │
│                   ✓ Terbaca       │
│ Isi form di bawah sudah diisi     │
│ otomatis. Silakan cek kembali.    │
└───────────────────────────────────┘
```

State jika AI gagal:
```
┌───────────────────────────────────┐
│ ⚠ Struk tidak dapat dibaca       │
│ Silakan isi form secara manual    │
│ atau [foto ulang struk]           │
└───────────────────────────────────┘
```

### 5.11 Empty State

Setiap tabel dan daftar memiliki empty state yang informatif.

**Pola:**
```
        [ ikon minimal ]

    Belum ada klaim di project ini

    Ajukan klaim pertama Anda untuk
    memulai pencatatan pengeluaran.

        [ Ajukan Klaim ]
```

Ikon: outline SVG sederhana, 48×48px, warna `--color-text-muted`.

---

## 6. Tata Letak & Grid

### 6.1 Layout Utama (Desktop)

```
┌─────────┬───────────────────────────────────────┐
│         │  [Breadcrumb]  Judul Halaman           │ ← Header 56px
│         ├───────────────────────────────────────┤
│ Sidebar │                                        │
│  240px  │          Area Konten Utama             │
│         │          max-width: 1100px             │
│         │          padding: 24px 32px            │
│         │                                        │
└─────────┴───────────────────────────────────────┘
```

### 6.2 Grid Konten

```css
.content-grid {
  display: grid;
  gap: 24px;
}

/* Halaman daftar (full width) */
.layout-full { grid-template-columns: 1fr; }

/* Halaman detail dengan panel samping */
.layout-detail {
  grid-template-columns: 1fr 320px;
}

/* Kartu project / KPI */
.layout-cards {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
```

### 6.3 Spacing System

Semua spacing menggunakan kelipatan 4px.

| Token | Nilai | Penggunaan |
|-------|-------|-----------|
| `space-1` | 4px | Gap antar elemen sangat rapat |
| `space-2` | 8px | Padding badge, gap inline |
| `space-3` | 12px | Gap antar field dalam grup |
| `space-4` | 16px | Padding kartu compact, gap list |
| `space-5` | 20px | Gap antar field form |
| `space-6` | 24px | Padding kartu, gap section |
| `space-8` | 32px | Padding halaman, gap besar |
| `space-10` | 40px | Jarak antar section |

### 6.4 Border Radius

| Token | Nilai | Penggunaan |
|-------|-------|-----------|
| `radius-sm` | 6px | Badge, chip, input |
| `radius-md` | 8px | Tombol, dropdown |
| `radius-lg` | 12px | Kartu, modal |
| `radius-xl` | 16px | Panel besar |
| `radius-full` | 9999px | Avatar, toggle |

---

## 7. Ikon

Menggunakan **Lucide Icons** (outline style). Ukuran standar:

| Konteks | Ukuran |
|---------|--------|
| Inline dengan teks | 16×16px |
| Tombol dengan teks | 16×16px |
| Navigation sidebar | 18×18px |
| Empty state | 48×48px |

**Ikon yang digunakan:**

| Elemen | Ikon Lucide |
|--------|------------|
| Project | `FolderOpen` |
| Klaim | `Receipt` |
| Upload | `Upload` |
| Struk / foto | `Image` |
| User | `User` |
| Tim / anggota | `Users` |
| Dashboard | `LayoutDashboard` |
| Pengaturan | `Settings` |
| Filter | `Filter` |
| Export | `Download` |
| Setujui | `CheckCircle` |
| Tolak | `XCircle` |
| Revisi | `RotateCcw` |
| Edit | `Pencil` |
| Hapus | `Trash2` |
| Notifikasi | `Bell` |
| Logout | `LogOut` |
| Mata (lihat) | `Eye` |
| Kalender | `Calendar` |
| Uang | `Banknote` |
| AI / scan | `ScanLine` |

---

## 8. Motion & Animasi

### 8.1 Prinsip

- Animasi untuk fungsi, bukan dekorasi
- Durasi pendek: 150–300ms
- Easing default: `ease-out` untuk masuk, `ease-in` untuk keluar
- Semua animasi harus dihormati oleh `prefers-reduced-motion`

### 8.2 Token Durasi

```css
:root {
  --duration-fast:   150ms;  /* Hover, toggle, badge */
  --duration-normal: 200ms;  /* Modal open, dropdown */
  --duration-slow:   300ms;  /* Page transition, skeleton */
}
```

### 8.3 Animasi Standar

```css
/* Modal masuk */
@keyframes modal-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Toast masuk */
@keyframes toast-in {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Skeleton loading */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    var(--color-bg-subtle) 25%,
    var(--color-border-default) 50%,
    var(--color-bg-subtle) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.4 Loading State

- Tabel loading: skeleton row (3–5 baris) dengan lebar kolom sesuai konten
- Tombol loading: spinner 14px inline + teks "Menyimpan..."
- Upload progress: progress bar linear di bawah area upload
- AI reading: animated dots "Membaca struk..."

---

## 9. Peta Halaman

### 9.1 Halaman Publik (tanpa login)

```
/login              → Halaman login
/register           → Form registrasi mandiri
/register/success   → Konfirmasi registrasi berhasil (menunggu aktivasi)
```

### 9.2 Halaman User

```
/dashboard                        → Daftar project + ringkasan klaim
/projects/:id                     → Halaman project (riwayat klaim user sendiri)
/projects/:id/claims/new          → Form ajukan klaim baru
/claims/:id                       → Detail klaim (view only jika sudah submit)
/profile                          → Edit profil user
```

### 9.3 Halaman Manager / Admin

```
/admin/claims                     → Semua klaim (filter by project, status, user)
/admin/claims/:id                 → Detail klaim + panel review (approve/tolak)
/admin/users                      → Daftar user + manajemen aktivasi
/admin/users/:id                  → Detail & edit user
/admin/dashboard                  → Dashboard analytics (filter waktu & project)
```

### 9.4 Halaman Admin Only

```
/admin/projects                   → Daftar semua project
/admin/projects/new               → Form buat project baru
/admin/projects/:id               → Detail project + kelola anggota
/admin/settings/ai                → Konfigurasi AI model
/admin/audit-log                  → Log semua aktivitas sistem
```

---

## 10. Wireframe Per Halaman

### 10.1 Login

```
┌─────────────────────────────────────────┐
│                                         │
│         ReimburseEasy                   │
│         Masuk ke akun Anda              │
│                                         │
│  Email                                  │
│  [                              ]       │
│                                         │
│  Password                               │
│  [                              ] [👁]  │
│                                         │
│  [      Masuk     ]                     │
│                                         │
│  Belum punya akun? Daftar di sini       │
│                                         │
└─────────────────────────────────────────┘
```

- Centered card, max-width 400px
- Tidak ada gambar / ilustrasi — fokus ke form
- Error login: pesan merah di bawah tombol, bukan di atas form

---

### 10.2 Dashboard User (setelah login)

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Dashboard          Selamat pagi, Andi           │
│ Sidebar  ├──────────────────────────────────────────────────┤
│          │                                                    │
│ Dashboard│  Project Anda (3)                                  │
│ Project  │  ┌───────────────┐ ┌───────────────┐             │
│ Klaim    │  │ 📁 Gedung A   │ │ 📁 Biz Trip SG│             │
│ Riwayat  │  │ Aktif         │ │ Aktif          │             │
│          │  │ 23 klaim      │ │ 5 klaim        │             │
│          │  │ Rp 14.250.000 │ │ Rp 4.800.000   │             │
│          │  │ [Lihat →]     │ │ [Lihat →]      │             │
│          │  └───────────────┘ └───────────────┘             │
│          │                                                    │
│          │  Klaim Terbaru                                     │
│  [avatar]│  ┌──────────────────────────────────────────────┐ │
│  Nama    │  │ Tgl    │ Merchant     │ Nilai    │ Status    │ │
│  Logout  │  │ 10 Mei │ Indomaret    │ Rp 87.500│ [Diajukan]│ │
└──────────┴──┴──────────────────────────────────────────────┴─┘
```

---

### 10.3 Form Ajukan Klaim Baru

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  ← Gedung A    Ajukan Klaim Baru                 │
│ Sidebar  ├──────────────────────────────────────────────────┤
│          │                                                    │
│          │  Upload Struk                                      │
│          │  ┌──────────────────────────────────────┐        │
│          │  │  ↑  Seret foto atau klik untuk pilih │        │
│          │  │     JPG atau PNG, maks 5 MB           │        │
│          │  └──────────────────────────────────────┘        │
│          │  atau  [Lewati, isi manual]                        │
│          │                                                    │
│          │  Detail Klaim                                      │
│          │  ┌──────────────┐  ┌──────────────────────┐      │
│          │  │ Nama Merchant│  │ Tanggal Transaksi     │      │
│          │  │ [          ] │  │ [    DD/MM/YYYY     ] │      │
│          │  └──────────────┘  └──────────────────────┘      │
│          │  ┌──────────────┐  ┌──────────────────────┐      │
│          │  │ Total (Rp)   │  │ Kategori              │      │
│          │  │ [          ] │  │ [▾ Pilih kategori   ] │      │
│          │  └──────────────┘  └──────────────────────┘      │
│          │  Deskripsi                                         │
│          │  [                                        ]       │
│          │                                                    │
│          │  Project: Gedung A  (otomatis dari konteks)        │
│          │                                                    │
│          │  [Simpan Draft]              [Ajukan Klaim →]     │
│          │                                                    │
└──────────┴──────────────────────────────────────────────────┘
```

---

### 10.4 Halaman Review Klaim (Manager/Admin)

```
┌──────────┬───────────────────────────┬──────────────────────┐
│          │  ← Semua Klaim   Klaim #142│  Panel Review        │
│ Sidebar  ├───────────────────────────┤                      │
│          │                           │  Status              │
│          │  [thumbnail struk foto]   │  [Diajukan]          │
│          │                           │                      │
│          │  Detail Klaim             │  Diajukan oleh       │
│          │  Merchant  Indomaret      │  Andi Budiman        │
│          │  Tanggal   10 Mei 2025    │  10 Mei 2025, 14:23  │
│          │  Total     Rp 87.500      │                      │
│          │  Kategori  Makanan        │  Project             │
│          │  Project   Gedung A       │  Gedung A            │
│          │  Deskripsi Makan siang    │                      │
│          │            tim survey     │  Catatan (opsional)  │
│          │                           │  [                 ] │
│          │                           │                      │
│          │                           │  [Minta Revisi]      │
│          │                           │  [Tolak]             │
│          │                           │  [Setujui ✓]         │
└──────────┴───────────────────────────┴──────────────────────┘
```

---

### 10.5 Dashboard Analytics (Manager/Admin)

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Dashboard Analytics                              │
│ Sidebar  ├──────────────────────────────────────────────────┤
│          │  [Harian] [Mingguan] [Bulanan]   Filter: [Semua ▾]│
│          │                                                    │
│          │  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌─────────┐ │
│          │  │ 47       │ │ Rp 12,4jt│ │ 31   │ │ 12      │ │
│          │  │ Total    │ │ Nilai    │ │ Setuj│ │ Pending │ │
│          │  └──────────┘ └──────────┘ └──────┘ └─────────┘ │
│          │                                                    │
│          │  Pengeluaran per Project         Export CSV ↓     │
│          │  Gedung A      ████████████████ Rp 14,2jt  23✓   │
│          │  Biz Trip SG   ██████████       Rp 8,8jt   15✓   │
│          │  Operasional   ██████           Rp 6,1jt    9✓   │
│          │                                                    │
│          │  Top Submitter                                     │
│          │  [AB] Andi B.    12 klaim  Rp 4,1jt              │
│          │  [SR] Siti R.     9 klaim  Rp 3,2jt              │
└──────────┴──────────────────────────────────────────────────┘
```

---

### 10.6 Manajemen Project (Admin)

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Manajemen Project          [+ Buat Project]      │
│ Sidebar  ├──────────────────────────────────────────────────┤
│          │  Cari project... [🔍]    Filter: [Aktif ▾]       │
│          │                                                    │
│          │  Nama              Periode       Anggota  Status  │
│          │  Gedung A          Jan–Jun 2025   8       [Aktif] │
│          │  Biz Trip SG       Mei 2025       3       [Aktif] │
│          │  Operasional Q1    Jan–Mar 2025   12     [Arsip]  │
│          │                                                    │
└──────────┴──────────────────────────────────────────────────┘
```

---

### 10.7 Konfigurasi AI (Admin)

```
┌──────────┬──────────────────────────────────────────────────┐
│          │  Pengaturan AI — Pembacaan Struk                  │
│ Sidebar  ├──────────────────────────────────────────────────┤
│          │                                                    │
│          │  ┌────────────────────────────────────────────┐  │
│          │  │ Konfigurasi API Model                       │  │
│          │  │                                             │  │
│          │  │  Base URL                                   │  │
│          │  │  [ https://api.mymodel.com/v1           ]  │  │
│          │  │                                             │  │
│          │  │  Nama Model                                 │  │
│          │  │  [ receipt-reader-v2                    ]  │  │
│          │  │                                             │  │
│          │  │  API Key                                    │  │
│          │  │  [ ••••••••••••••••••••••       ] [Ubah]  │  │
│          │  │                                             │  │
│          │  │  [  Test Koneksi  ]    [Simpan Pengaturan] │  │
│          │  │                                             │  │
│          │  │  ✓ Koneksi berhasil — 10 Mei 2025, 11:42  │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                    │
└──────────┴──────────────────────────────────────────────────┘
```

---

## 11. Responsivitas

### Breakpoint

| Nama | Lebar | Deskripsi |
|------|-------|-----------|
| Mobile | < 640px | Satu kolom, bottom navigation |
| Tablet | 640px – 1024px | Sidebar tersembunyi (drawer), konten full |
| Desktop | > 1024px | Sidebar permanen 240px |

### Adaptasi Mobile

- Sidebar menjadi **bottom tab bar** dengan 4 item utama
- Kartu project menjadi 1 kolom
- Tabel daftar klaim: kolom dikurangi menjadi 3 (tanggal, merchant, status) — kolom lain di halaman detail
- Form upload: area drop zone tetap, tombol "Pilih File" lebih besar (touch-friendly: min 44×44px)
- Modal: full-screen di mobile (bukan overlay di tengah)
- Dashboard chart: scrollable horizontal jika data banyak

---

## 12. Aksesibilitas

Target: **WCAG 2.1 Level AA**.

### Warna & Kontras

- Semua teks pada background putih memenuhi rasio kontras 4.5:1 minimum
- Teks `text-secondary` (#6B6B6B) pada putih: rasio 5.9:1 ✓
- Teks badge pada background subtle: pastikan menggunakan token `-text` yang sesuai
- Jangan gunakan warna sebagai satu-satunya pembeda informasi — badge status selalu punya label teks

### Keyboard Navigation

- Semua aksi bisa dilakukan hanya dengan keyboard
- Focus visible: `box-shadow: 0 0 0 3px rgba(59,110,248,0.4)` pada semua elemen interaktif
- Urutan tab logis mengikuti urutan visual
- Modal: focus trap aktif saat modal terbuka, kembali ke trigger saat ditutup
- Skip link "Langsung ke konten utama" sebagai elemen pertama di `<body>`

### Teks & Label

- Semua input form memiliki `<label>` yang terhubung via `for` / `id`
- Icon-only button selalu memiliki `aria-label`
- Gambar struk: `alt="Struk klaim [nama merchant] [tanggal]"`
- Status badge: tambahkan `aria-label` yang deskriptif, contoh: `aria-label="Status: Disetujui"`

### Struktur Halaman

- Satu `<h1>` per halaman, sesuai judul halaman
- Heading hierarkis: `h1 → h2 → h3`, tidak melompat
- Tabel data: gunakan `<th scope="col">` untuk header kolom
- Form error: dihubungkan ke input via `aria-describedby`

### Loading & State

- Operasi async yang membutuhkan waktu > 1 detik: tampilkan `aria-busy="true"` dan loading indicator visual
- Skeleton loading: tambahkan `aria-label="Memuat data..."` pada container
- Toast notifikasi: gunakan `role="status"` (success/info) atau `role="alert"` (error)

---

*Dokumen ini adalah panduan hidup — diperbarui seiring dengan keputusan desain yang berkembang selama development.*
