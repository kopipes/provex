# Disaster Recovery Runbook — ProvEx / ReimburseEasy

Panduan pemulihan jika VPS hilang, rusak, atau database korup.

---

## 1. Apa yang di-backup dan di mana

| Item | Lokasi sumber | Backup | Frekuensi | Retensi |
|---|---|---|---|---|
| Database SQLite | `/var/www/provex/backend/reimburseeasy.db` | `s3://provex/backups/provex-YYYYMMDD_HHMMSS.db.gz` | 2×/hari (12:10 & 19:10 WIB) | 365 hari |
| File struk (JPG/PNG/PDF) | `/var/www/provex/backend/uploads/` | `s3://provex/uploads/<hash>.<ext>` | 2×/hari (mirror, tidak pernah dihapus) | selamanya |
| Kode aplikasi | GitHub `kopipes/provex` | branch `master` | setiap push | — |
| Konfigurasi nginx | repo `nginx-provex.conf` | GitHub | setiap push | — |

**Provider**: Cloudflare R2, bucket `provex`, endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.

**RPO** (data yang mungkin hilang): maksimal ~12 jam.
**RTO** (perkiraan waktu pulih): ~30–45 menit.

---

## 2. Prasyarat — simpan di tempat aman (BUKAN di VPS)

Tanpa item ini pemulihan tidak bisa sempurna. Simpan di password manager.

| Item | Kenapa penting |
|---|---|
| `SECRET_KEY` (JWT) | Tanpa ini user harus login ulang (boleh diganti baru, hanya memaksa re-login). |
| `ENCRYPTION_KEY` (Fernet) | **WAJIB sama persis.** Kalau berbeda, API key AI di database tidak bisa didekripsi. Tidak bisa diregenerasi. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` | Untuk mengunduh backup. |
| `NOTIV_API_KEY` (integrasi "Provex") | Mengirim kode reset password lewat Notiv. Kalau hilang, buat integrasi baru di Notiv (sekali) dan simpan key `nv_...` di `.env`. |
| Kredensial admin aplikasi | Untuk verifikasi setelah restore. |
| Akses SSH ke VPS (`~/.ssh/id_ed25519`) | Untuk deployment. |

> **PERINGATAN:** `ENCRYPTION_KEY` hanya ada di `/var/www/provex/backend/.env`. Kalau VPS hilang dan key ini tidak disimpan, konfigurasi AI harus diisi ulang manual (bukan kehilangan data klaim).

---

## 3. Skenario A — VPS hilang total (rebuild dari nol)

### Langkah 1 — Siapkan server baru

```bash
# Install Docker + dependencies
apt update && apt install -y docker.io docker-compose-plugin git nginx sqlite3 awscli
systemctl enable --now docker nginx
```

### Langkah 2 — Clone kode

```bash
cd /var/www
git clone https://github.com/kopipes/provex.git
cd provex
```

### Langkah 3 — Buat `backend/.env`

```bash
cat > /var/www/provex/backend/.env <<'EOF'
SECRET_KEY=<SECRET_KEY_ANDA>
ENCRYPTION_KEY=<ENCRYPTION_KEY_ANDA>
DATABASE_URL=sqlite:///./reimburseeasy.db
NOTIV_API_KEY=<NOTIV_API_KEY_ANDA>
NOTIV_URL=https://notiv.provaliantgroup.com
APP_BASE_URL=https://provex.provaliantgroup.com
EOF
chmod 600 /var/www/provex/backend/.env
```

> `ENCRYPTION_KEY` **harus** nilai lama. `SECRET_KEY` boleh baru (semua user re-login).

### Langkah 4 — Siapkan folder uploads

```bash
mkdir -p /var/www/provex/backend/uploads
```

### Langkah 5 — Siapkan kredensial R2

```bash
cp /var/www/provex/scripts/backup-provex.env.example /etc/backup-provex.env
nano /etc/backup-provex.env      # isi R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY
chmod 600 /etc/backup-provex.env
```

### Langkah 6 — Restore database + file struk

```bash
chmod +x /var/www/provex/scripts/*.sh

# Lihat backup yang tersedia
/var/www/provex/scripts/restore-provex-from-r2.sh

# Restore backup terbaru + semua file struk
/var/www/provex/scripts/restore-provex-from-r2.sh --latest --uploads --yes
```

Script akan: mengunduh → verifikasi gzip → `PRAGMA integrity_check` → menampilkan jumlah user/claim/project → menyimpan DB lama ke `/var/backups/` → mengganti DB → sinkron file struk.

### Langkah 7 — Jalankan aplikasi

```bash
cd /var/www/provex
docker compose up -d --build
docker compose ps
curl -s http://127.0.0.1:8010/api/health
```

### Langkah 8 — Nginx + SSL

```bash
cp /var/www/provex/nginx-provex.conf /etc/nginx/sites-available/nginx-provex.conf
ln -sf /etc/nginx/sites-available/nginx-provex.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL (pastikan DNS A record sudah mengarah ke IP baru)
certbot --nginx -d provex.provaliantgroup.com
```

### Langkah 9 — Aktifkan kembali backup otomatis

```bash
install -m 700 /var/www/provex/scripts/backup-provex-to-r2.sh /usr/local/bin/
install -m 644 /var/www/provex/scripts/systemd/backup-provex.service /etc/systemd/system/
install -m 644 /var/www/provex/scripts/systemd/backup-provex.timer   /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now backup-provex.timer
systemctl list-timers backup-provex.timer
```

### Langkah 10 — Verifikasi

- [ ] `https://provex.provaliantgroup.com` bisa dibuka
- [ ] Login admin berhasil
- [ ] Jumlah project/klaim/user sesuai backup
- [ ] Buka salah satu klaim → gambar struk tampil
- [ ] `systemctl start backup-provex.service` → sukses
- [ ] `aws s3 ls s3://provex/backups/` menampilkan backup baru

---

## 4. Skenario B — Database korup, server masih hidup

```bash
cd /var/www/provex

# 1. Restore backup terbaru (DB lama otomatis disimpan ke /var/backups/)
/var/www/provex/scripts/restore-provex-from-r2.sh --latest --yes

# 2. Cek log backend
docker compose logs --tail=50 backend
```

Kalau restore terbaru juga bermasalah, pakai backup sebelumnya:

```bash
/var/www/provex/scripts/restore-provex-from-r2.sh \
  --db-key provex-20261026_191010.db.gz --yes
```

---

## 5. Skenario C — Mengembalikan satu file struk yang terhapus

File struk di R2 bersifat *append-only*, jadi file yang sudah dihapus dari server masih ada di R2.

```bash
source /etc/backup-provex.env
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY"

aws --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  s3 ls s3://provex/uploads/ | grep <awalan-hash>

aws --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  s3 cp s3://provex/uploads/<nama-file> /var/www/provex/backend/uploads/<nama-file>
```

Nama file yang dirujuk klaim ada di kolom `claims.receipt_image_path` (contoh `/upload/abc123.jpg`).

---

## 6. Restore database lokal (untuk inspeksi, tanpa menyentuh produksi)

```bash
source /etc/backup-provex.env
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY"

aws --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  s3 cp s3://provex/backups/provex-20261027_091835.db.gz /tmp/

gzip -dc /tmp/provex-20261027_091835.db.gz > /tmp/inspect.db
sqlite3 /tmp/inspect.db "SELECT COUNT(*) FROM claims;"
sqlite3 /tmp/inspect.db ".tables"
```

---

## 7. Catatan operasional

- **Backup tidak dienkripsi** saat ini. Isi `.db.gz`: nama, email, nominal klaim. Untuk mengaktifkan enkripsi, isi `GPG_PASSPHRASE` di `/etc/backup-provex.env`; saat restore, variabel yang sama harus tersedia.
- **Restore bersifat replace**, bukan merge. DB yang sedang berjalan selalu disalin ke `/var/backups/provex-db-before-restore-<timestamp>.db` lebih dulu.
- **Bind-mount**: compose me-mount file DB secara langsung. Script restore memakai `cp` (bukan `mv`) agar inode mount tetap valid.
- **Migrasi otomatis**: saat backend start, `create_all()` + lightweight migration menambahkan kolom/tabel baru tanpa menghapus data.
- **Uji restore berkala**: minimal 1× per kuartal, restore ke folder sementara dan jalankan `PRAGMA integrity_check`.
