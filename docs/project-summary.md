# Project Summary — ReimburseEasy

## Quick Facts

| Property | Value |
|-----------|-------|
| **Name** | ReimburseEasy |
| **Type** | Project-based Reimbursement Management System |
| **Language** | TypeScript (frontend), Python (backend) |
| **Frontend** | Next.js 14, React 18, TailwindCSS, React Query |
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Database** | SQLite |
| **Auth** | JWT Bearer tokens |
| **Status** | Production-ready |

---

## Architecture Summary

```
Frontend (Next.js) ──REST API──▶ Backend (FastAPI) ──ORM──▶ SQLite
```

- **Frontend Port**: 3000
- **Backend Port**: 8000
- **API Prefix**: /api

---

## Major Modules

### Backend Modules (Python)
| Module | Purpose |
|--------|---------|
| `app/main.py` | FastAPI entry, CORS, routing |
| `app/auth.py` | JWT auth, role middleware |
| `app/models.py` | 7 SQLAlchemy models |
| `app/schemas.py` | Pydantic validation |
| `app/routers/` | 9 route modules |

### Frontend Modules (TypeScript)
| Module | Purpose |
|--------|---------|
| `app/page.tsx` | Login page |
| `app/dashboard/` | User dashboard |
| `app/admin/` | Admin/manager pages |
| `app/projects/` | Project views |
| `app/claims/` | Claim form |
| `components/` | 5 reusable components |
| `lib/` | API client, auth, types |

---

## Important Rules

### Claim Workflow
```
draft → submitted → approved/rejected/revision
```

### User Roles
```
user (1) < manager (2) < admin (3)
```

### Claim Status
```
Categories: makanan, transport, akomodasi, lain-lain
Receipt: max 5MB, jpg/jpeg/png only
```

---

## Coding Style

### Backend (Python)
- **Naming**: snake_case
- **Validation**: Pydantic schemas
- **Auth**: JWT with bcrypt

### Frontend (TypeScript)
- **Naming**: camelCase (vars), PascalCase (components)
- **Styling**: TailwindCSS
- **State**: React hooks (useState, useEffect)

---

## Critical Constraints

1. **Every claim belongs to exactly one project**
2. **Users must be project members to submit claims**
3. **No hard deletes for claims/projects**
4. **All timestamps in UTC+7 (Asia/Jakarta)**
5. **File uploads stored locally in backend/uploads/**

---

## Key Files to Know

### Backend
- `backend/app/main.py` - App setup
- `backend/app/auth.py` - Authentication
- `backend/app/models.py` - Database schema
- `backend/app/routers/claims.py` - Claim workflow

### Frontend
- `frontend/lib/api.ts` - API client
- `frontend/lib/auth.tsx` - Auth provider
- `frontend/components/Sidebar.tsx` - Navigation
- `frontend/app/dashboard/page.tsx` - Main dashboard

---

## Environment

```bash
# Backend
SECRET_KEY=<jwt-secret>
DATABASE_URL=sqlite:///./reimburseeasy.db
ENCRYPTION_KEY=<fernet-key>

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reimburseeasy.com | admin123 |
| Manager | manager@reimburseeasy.com | manager123 |
| User | user@reimburseeasy.com | user123 |