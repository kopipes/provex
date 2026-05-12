# AGENTS.md — ReimburseEasy

> **Universal context file for AI coding agents.** Read this before making ANY changes.

---

## PROJECT PURPOSE

ReimburseEasy is a project-based reimbursement management system where:
- **Every claim belongs to exactly one project**
- **Every user must be a project member to submit claims**
- **Claims have a defined workflow lifecycle**

---

## ARCHITECTURE STYLE

**Monolithic full-stack with REST API**

```
Frontend (Next.js 14) ──REST──▶ Backend (FastAPI) ──SQLAlchemy──▶ SQLite
```

- **Frontend Port**: 3000
- **Backend Port**: 8000
- **API Prefix**: /api
- **Auth Method**: JWT Bearer tokens

---

## STACK

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS |
| Backend | FastAPI, Python, SQLAlchemy, Pydantic |
| Database | SQLite |
| Auth | JWT + bcrypt |

---

## CRITICAL RULES FOR AI AGENTS

### 1. DATABASE RULES
- **DO NOT hard delete** claims or projects
- **Always use SQLAlchemy ORM** for database operations
- **All timestamps** must be in Asia/Jakarta timezone (UTC+7)
- **Email must be unique** across users table

### 2. AUTH RULES
- **All routes except `/auth/*`** require Bearer token
- **Password must be hashed** with bcrypt before storing
- **JWT expiry**: 24 hours
- **Role hierarchy**: user < manager < admin

### 3. CLAIM WORKFLOW RULES
```
draft → submitted → approved/rejected/revision
              ↘ revision → submitted
```
- **User** can: create claims, submit drafts
- **Manager/Admin** can: approve, reject, request revision
- **No backtracking** from approved/rejected to other states

### 4. PROJECT MEMBERSHIP RULES
- User can ONLY submit claims for projects they are members of
- Only Admin can add/remove project members
- Project creator is auto-added as member

### 5. FILE UPLOAD RULES
- **Max size**: 5MB
- **Allowed formats**: .jpg, .jpeg, .png only
- **Storage**: `backend/uploads/` (local filesystem)
- **Path stored**: `claims.receipt_image_path`

---

## NAMING CONVENTIONS

### Backend (Python)
| Type | Convention | Example |
|------|------------|---------|
| Variables | snake_case | `user_id`, `project_name` |
| Functions | snake_case | `get_user_by_id` |
| Routes | snake_case | `/claims`, `/project-members` |
| Tables | snake_case (plural) | `project_members` |
| Columns | snake_case | `receipt_image_path` |

### Frontend (TypeScript)
| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `isLoading`, `userName` |
| Components | PascalCase | `StatusBadge`, `Sidebar` |
| Interfaces | PascalCase | `User`, `Claim` |
| Type aliases | PascalCase | `ClaimStatus = 'draft' \| ...` |
| CSS classes | kebab-case | `text-center`, `bg-bg-surface` |

---

## FORBIDDEN PRACTICES

1. **NEVER hard delete** users, claims, or projects
2. **NEVER commit** actual API keys or secrets
3. **NEVER use** `SELECT *` in raw SQL (use SQLAlchemy)
4. **NEVER skip validation** - always use Pydantic schemas
5. **NEVER bypass auth** middleware
6. **NEVER store files** in database (store path only)
7. **NEVER expose** password_hash to frontend

---

## COMMON WORKFLOWS

### Add a New Endpoint
1. Create/update Pydantic schema in `backend/app/schemas.py`
2. Create/update route in appropriate `backend/app/routers/*.py`
3. Add role check using `require_admin()` or `require_manager_or_admin()`
4. Test with curl or Swagger at `/docs`
5. Update frontend API client in `frontend/lib/api.ts`
6. Update types in `frontend/lib/types.ts`
7. Create/update component in `frontend/components/`
8. Create/update page in `frontend/app/`

### Add a New Database Model
1. Add SQLAlchemy model in `backend/app/models.py`
2. Add Pydantic schema in `backend/app/schemas.py`
3. Create migration or re-run `init_db.py`
4. Update TypeScript interface in `frontend/lib/types.ts`

### Add a New Page
1. Create route file in `frontend/app/[section]/`
2. Use `'use client'` directive
3. Import and use `Sidebar` component
4. Use `useAuth()` hook for authentication
5. Use API methods from `frontend/lib/api.ts`
6. Use types from `frontend/lib/types.ts`

---

## SERVICE BOUNDARIES

### Backend
```
app/main.py
  ├── app/auth.py (JWT, middleware)
  ├── app/database.py (SQLAlchemy)
  └── app/routers/
      ├── auth.py (auth only)
      ├── users.py (user management)
      ├── projects.py (project management)
      ├── claims.py (claim workflow)
      ├── analytics.py (reports)
      ├── upload.py (file upload)
      ├── ai_config.py (AI settings)
      ├── database.py (backup/restore)
      └── departments.py (departments)
```

### Frontend
```
app/
  ├── page.tsx (login)
  ├── dashboard/ (user dashboard)
  ├── projects/ (project list + detail)
  ├── claims/ (new claim form)
  ├── history/ (claim history)
  └── admin/
      ├── claims/ (admin review)
      ├── users/ (user management)
      ├── projects/ (project management)
      ├── settings/ (AI config)
      └── audit-log/ (audit trail)
```

---

## CRITICAL FILES

### DO NOT MODIFY UNLESS NECESSARY
- `backend/app/models.py` - Database schema
- `backend/app/auth.py` - Auth middleware
- `backend/app/main.py` - App entry point

### FREQUENTLY MODIFIED
- `backend/app/routers/claims.py` - Claim logic
- `frontend/lib/api.ts` - API client
- `frontend/lib/types.ts` - TypeScript types
- `frontend/components/` - UI components

---

## REUSABLE COMPONENTS

| Component | Purpose |
|-----------|---------|
| `Button` | Primary UI action |
| `Input` | Form input field |
| `Badge` | Status display |
| `Sidebar` | Navigation |
| `Toast` | Notifications |

---

## EXPECTED OUTPUT STYLE

### Backend (Python)
```python
@router.get("/{claim_id}")
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim
```

### Frontend (TypeScript)
```typescript
'use client';

import { useState } from 'react';
import { claimsAPI } from '@/lib/api';

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  
  useEffect(() => {
    claimsAPI.list().then(res => setClaims(res.data));
  }, []);
  
  return <div>{claims.map(c => <ClaimCard key={c.id} claim={c} />)}</div>;
}
```

---

## TESTING CONVENTIONS

### Backend
- Manual testing via `/docs` (Swagger UI)
- Check `backend/init_db.py` for test data

### Frontend
- Manual browser testing
- Check Network tab for API responses
- Check Console for errors

---

## ENVIRONMENT

```bash
# Backend .env
SECRET_KEY=<jwt-secret>
DATABASE_URL=sqlite:///./reimburseeasy.db
ENCRYPTION_KEY=<fernet-key>

# Frontend .env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## DEFAULT TEST USERS

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reimburseeasy.com | admin123 |
| Manager | manager@reimburseeasy.com | manager123 |
| User | user@reimburseeasy.com | user123 |

---

## QUICK START COMMANDS

```bash
# Backend
cd backend && pip install -r requirements.txt && python init_db.py && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

---

## MIGRATION RISKS

- **Database migrations**: Use `init_db.py` for schema changes
- **JWT token changes**: Requires logout for all users
- **Role changes**: May break existing permissions

---

## PERFORMANCE-SENSITIVE AREAS

- `GET /claims` with large datasets (add pagination)
- File upload to `backend/uploads/`
- Analytics aggregations

---

## SECURITY-SENSITIVE AREAS

- JWT token validation (never skip)
- Password hashing (always use bcrypt)
- API key encryption (Fernet)
- File upload validation (size, type)
- Role-based access control

---

## DOCUMENTATION

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `SPEC.md` | Full specification |
| `docs/architecture.md` | Architecture diagrams |
| `docs/business-rules.md` | Domain rules |
| `docs/coding-standards.md` | Code conventions |
| `docs/api-overview.md` | API reference |
| `docs/module-map.md` | Module responsibilities |
| `docs/dependency-flow.md` | Data flow |
| `docs/project-summary.md` | Quick reference |

---

**END OF AGENTS.md**