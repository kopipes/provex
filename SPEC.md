# SPEC.md — ReimburseEasy
**Aplikasi Manajemen Reimbursement Berbasis Project**

> Versi: 1.0 | Status: Implementation Ready | Dibuat: Mei 2025

---

## 1. Overview

ReimburseEasy adalah aplikasi web internal untuk memproses klaim reimbursement karyawan secara terstruktur per project. Setiap klaim terikat ke satu project tertentu, sehingga pengeluaran bisa dilacak per konteks pekerjaan.

### Tech Stack
- **Backend**: Python + FastAPI + SQLite + SQLAlchemy ORM + JWT Auth
- **Frontend**: React + Next.js + TailwindCSS + React Query + Recharts

---

## 2. User Roles & Access

| Peran | Deskripsi |
|-------|-----------|
| **User** | Karyawan yang mengajukan klaim reimbursement |
| **Manager** | Mengelola user dan mereview klaim dalam project |
| **Admin** | Akses penuh ke seluruh sistem |

### Role Matrix

| Fitur | User | Manager | Admin |
|-------|------|---------|-------|
| Registrasi mandiri | ✅ | ✅ | ✅ |
| Login ke sistem | ✅ | ✅ | ✅ |
| Lihat project sendiri | ✅ | ✅ | ✅ |
| Submit klaim | ✅ | ✅ | ✅ |
| Approve/tolak klaim | ❌ | ✅ | ✅ |
| Kelola user | ❌ | ✅ | ✅ |
| Buat/edit/hapus project | ❌ | ❌ | ✅ |
| Dashboard analytics | ❌ | ✅ | ✅ |
| Audit log | ❌ | ❌ | ✅ |

---

## 3. Database Schema

### Tables

**users**
- id (PK, INTEGER, AUTO)
- name (TEXT)
- email (TEXT, UNIQUE)
- password_hash (TEXT)
- role (TEXT: user/manager/admin)
- status (TEXT: pending/active/inactive)
- department (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

**projects**
- id (PK, INTEGER, AUTO)
- name (TEXT)
- description (TEXT)
- start_date (DATE)
- end_date (DATE, nullable)
- budget_limit (REAL, nullable)
- status (TEXT: active/archived)
- created_by (FK→users)
- created_at (DATETIME)
- updated_at (DATETIME)

**project_members**
- id (PK, INTEGER, AUTO)
- project_id (FK→projects)
- user_id (FK→users)
- assigned_by (FK→users)
- assigned_at (DATETIME)

**claims**
- id (PK, INTEGER, AUTO)
- user_id (FK→users)
- project_id (FK→projects)
- receipt_image_path (TEXT, nullable)
- merchant_name (TEXT)
- transaction_date (DATE)
- amount (REAL)
- category (TEXT)
- description (TEXT)
- receipt_number (TEXT, nullable)
- status (TEXT: draft/submitted/revision/approved/rejected)
- ai_extracted (BOOLEAN)
- notes (TEXT)
- reviewed_by (FK→users, nullable)
- reviewed_at (DATETIME, nullable)
- created_at (DATETIME)
- updated_at (DATETIME)

**ai_config**
- id (PK, INTEGER)
- base_url (TEXT)
- model_name (TEXT)
- api_key_encrypted (TEXT)
- updated_by (FK→users)
- updated_at (DATETIME)

**audit_logs**
- id (PK, INTEGER)
- user_id (FK→users)
- action (TEXT)
- target_type (TEXT)
- target_id (INTEGER)
- details (TEXT JSON)
- created_at (DATETIME)

---

## 4. API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Users (Admin/Manager)
- GET /api/users
- GET /api/users/{id}
- PUT /api/users/{id}
- PATCH /api/users/{id}/status
- DELETE /api/users/{id}

### Projects (Admin)
- GET /api/projects
- POST /api/projects
- GET /api/projects/{id}
- PUT /api/projects/{id}
- DELETE /api/projects/{id}
- GET /api/projects/{id}/members
- POST /api/projects/{id}/members
- DELETE /api/projects/{id}/members/{user_id}

### Claims
- GET /api/claims (with filters: project_id, status, user_id, date range)
- POST /api/claims
- GET /api/claims/{id}
- PUT /api/claims/{id}
- PATCH /api/claims/{id}/status (approve/reject/revision)

### AI Config (Admin)
- GET /api/ai-config
- PUT /api/ai-config
- POST /api/ai-config/test

### Analytics (Manager/Admin)
- GET /api/analytics/overview (with period filter)
- GET /api/analytics/by-project
- GET /api/analytics/top-submitters
- GET /api/export/csv (with filters)

### Upload
- POST /api/upload/receipt
- GET /api/uploads/{filename}

### Dashboard
- GET /api/dashboard/summary

---

## 5. Design System

### Colors (CSS Variables)
```css
--color-bg-base: #F7F7F6
--color-bg-surface: #FFFFFF
--color-bg-subtle: #F0EFED
--color-text-primary: #18181B
--color-text-secondary: #6B6B6B
--color-accent: #3B6EF8
--color-accent-hover: #2D5DE8
--color-success: #16A34A
--color-warning: #CA8A04
--color-danger: #DC2626
```

### Typography
- Display: Plus Jakarta Sans (500, 600, 700)
- Body: DM Sans (400, 500)
- Mono: JetBrains Mono (400, 500)

### Spacing (4px base)
- space-1: 4px, space-2: 8px, space-3: 12px, space-4: 16px, space-5: 20px, space-6: 24px, space-8: 32px, space-10: 40px

### Border Radius
- radius-sm: 6px, radius-md: 8px, radius-lg: 12px, radius-xl: 16px

### Claim Status Badge Colors
- draft: gray
- submitted: blue
- revision: yellow
- approved: green
- rejected: red

---

## 6. Pages & Routes

### Public
- /login → Login page
- /register → Registration form
- /register/success → Success confirmation

### User
- /dashboard → Project list + recent claims
- /projects/:id → Project detail with claim history
- /projects/:id/claims/new → New claim form with AI upload
- /claims/:id → Claim detail
- /profile → User profile edit

### Admin/Manager
- /admin/claims → All claims with filters
- /admin/claims/:id → Claim review with approve/reject
- /admin/users → User management
- /admin/dashboard → Analytics dashboard

### Admin Only
- /admin/projects → Project CRUD
- /admin/settings/ai → AI configuration
- /admin/audit-log → System audit logs

---

## 7. Features

### Authentication
- JWT-based auth with refresh tokens
- Password hashing with bcrypt
- Role-based access control

### Project Management
- CRUD operations for projects
- Member assignment to projects
- Budget tracking with alerts

### Claim Submission
- Manual form fill
- AI-powered receipt scanning (optional)
- Draft saving
- Category selection (Makanan, Transport, Akomodasi, Lain-lain)

### Claim Review
- Manager/Admin can approve, reject, or request revision
- Notes can be added to review decisions
- Status workflow: Draft → Submitted → Approved/Rejected/Revision

### Dashboard Analytics
- KPI cards (total claims, total value, approved, pending)
- Bar chart for project breakdown
- Top submitters table
- Period filters (daily, weekly, monthly)
- CSV export functionality

### AI Integration
- Custom API endpoint configuration
- Base64 image encoding for receipt upload
- Response parsing and form prefill
- Fallback to manual input on error

---

## 8. Implementation Notes

- SQLite database file: `backend/reimburseeasy.db`
- File uploads stored in: `backend/uploads/`
- API key encryption using cryptography Fernet
- JWT secret stored in environment variable
- CORS configured for frontend origin
- All timestamps in UTC+7 (Asia/Jakarta)

---

*Specification extracted from PRD_ReimburseEasy_v2.md and DESIGN_ReimburseEasy.md*