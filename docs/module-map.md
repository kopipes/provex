# Module Map — ReimburseEasy

## Backend Modules

### Core Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| `main.py` | `backend/app/main.py` | FastAPI app entry, CORS config, router registration |
| `database.py` | `backend/app/database.py` | SQLAlchemy engine, session, Base |
| `models.py` | `backend/app/models.py` | ORM models (User, Project, Claim, etc.) |
| `schemas.py` | `backend/app/schemas.py` | Pydantic schemas for validation |
| `auth.py` | `backend/app/auth.py` | JWT creation, verification, role middleware |

### Router Modules

| Router | Path | Responsibility |
|-------|------|----------------|
| `auth.py` | `backend/app/routers/auth.py` | Login, register, profile |
| `users.py` | `backend/app/routers/users.py` | User CRUD, status/role management |
| `projects.py` | `backend/app/routers/projects.py` | Project CRUD, member management |
| `claims.py` | `backend/app/routers/claims.py` | Claim CRUD, workflow actions |
| `analytics.py` | `backend/app/routers/analytics.py` | Dashboard, reports, exports |
| `upload.py` | `backend/app/routers/upload.py` | Receipt image upload |
| `ai_config.py` | `backend/app/routers/ai_config.py` | AI/OCR configuration |
| `database.py` | `backend/app/routers/database.py` | Backup/restore operations |
| `departments.py` | `backend/app/routers/departments.py` | Department CRUD |

---

## Frontend Modules

### Pages

| Page | Path | Responsibility |
|------|------|----------------|
| Login | `frontend/app/page.tsx` | User login |
| Dashboard | `frontend/app/dashboard/page.tsx` | User dashboard with project cards |
| Projects | `frontend/app/projects/page.tsx` | Project list |
| Project Detail | `frontend/app/projects/[id]/page.tsx` | Single project view with claims |
| New Claim | `frontend/app/claims/new/page.tsx` | Claim creation form |
| History | `frontend/app/history/page.tsx` | User's claim history |
| Admin Claims | `frontend/app/admin/claims/page.tsx` | All claims review |
| Admin Users | `frontend/app/admin/users/page.tsx` | User management |
| Admin Projects | `frontend/app/admin/projects/page.tsx` | Project management |
| Admin Settings | `frontend/app/admin/settings/page.tsx` | AI & system settings |
| Audit Log | `frontend/app/admin/audit-log/page.tsx` | Audit trail view |

### Components

| Component | Path | Responsibility |
|-----------|------|----------------|
| Sidebar | `frontend/components/Sidebar.tsx` | Navigation sidebar |
| Button | `frontend/components/Button.tsx` | Reusable button |
| Input | `frontend/components/Input.tsx` | Form input |
| Badge | `frontend/components/Badge.tsx` | Status badge display |
| Toast | `frontend/components/Toast.tsx` | Notification system |

### Libraries

| Lib | Path | Responsibility |
|-----|------|----------------|
| API Client | `frontend/lib/api.ts` | Axios instance, API methods |
| Auth | `frontend/lib/auth.tsx` | AuthProvider, useAuth hook |
| Types | `frontend/lib/types.ts` | TypeScript interfaces |
| Utils | `frontend/lib/utils.ts` | formatters, helpers |

---

## Entry Points

### Backend Entry
```
backend/app/main.py
  ↓
include_router(auth)
include_router(users)
include_router(projects)
include_router(claims)
include_router(analytics)
include_router(upload)
include_router(ai_config)
include_router(database)
include_router(departments)
```

### Frontend Entry
```
frontend/app/layout.tsx (root layout)
  ↓
AuthProvider wraps children
  ↓
Page components use useAuth()
  ↓
API calls through lib/api.ts
```

---

## Database Tables (Critical)

| Table | Purpose | Important Columns |
|-------|---------|-------------------|
| `users` | User accounts | role, status |
| `projects` | Project container | status, budget_limit |
| `project_members` | User-project link | project_id, user_id |
| `claims` | Claim records | status, amount, receipt_image_path |
| `audit_logs` | Audit trail | action, user_id |
| `ai_config` | AI settings | api_key_encrypted |

---

## Key Dependencies

### Backend Dependencies
```
main.py
  ├── auth.py (JWT, middleware)
  ├── database.py (SQLAlchemy)
  └── routers/
      ├── auth.py
      ├── users.py
      ├── projects.py
      ├── claims.py
      └── analytics.py

models.py
  ├── User
  ├── Project
  ├── Claim
  ├── ProjectMember
  ├── AIConfig
  ├── Department
  └── AuditLog
```

### Frontend Dependencies
```
lib/api.ts
  └── axios (HTTP client)

lib/auth.tsx
  └── AuthProvider
      └── useAuth hook

lib/types.ts
  └── Shared interfaces