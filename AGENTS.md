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

## DEFAULT TEST USERS (LOCAL DEV ONLY)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reimburseeasy.com | admin123 |
| Manager | manager@reimburseeasy.com | manager123 |
| User | user@reimburseeasy.com | user123 |

**⚠️ PRODUCTION USERS (VPS DB) - NEVER OVERWRITE THESE:**
| Role | Email | Password |
|------|-------|----------|
| Admin | kristine@provaliangroup.com | admin123 |
| Admin | bob@provaliantgroup.com | admin123 |

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

## DOCKER DEPLOYMENT TROUBLESHOOTING

### ⚠️ CRITICAL: Next.js ENV Variable Precedence Issue

**Problem**: When deploying Next.js with Docker, `ENV` variables in Dockerfile can be OVERRIDDEN by `ARG` defaults during build time. This causes:
- Hardcoded API URLs that ignore docker-compose environment variables
- Deployments that work locally but fail in production
- Debugging nightmare (took ~2 hours to diagnose)

**Symptom**: 
```bash
# In docker-compose.yml you set:
environment:
  - NEXT_PUBLIC_API_URL=/api

# But the app still uses the hardcoded value from Dockerfile ARG
NEXT_PUBLIC_API_URL=https://provex.provaliantgroup.com
```

**Root Cause**: Docker ARG default values are baked into the image at build time. If your Dockerfile has:
```dockerfile
ARG NEXT_PUBLIC_API_URL=https://hardcoded.url.com  # ❌ NEVER put default URLs here
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

The ENV only gets the value if ARG is passed during build. If not passed, it uses the hardcoded default.

**Solution**: For Next.js frontend Dockerfile:
```dockerfile
# ✅ CORRECT: No default value for API URL ARG
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Use docker-compose environment variable directly
ENV NEXT_PUBLIC_API_URL=/api

RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
```

**Key Rules**:
1. **NEVER put default URLs in Dockerfile ARG for environment variables**
2. **ARG should be used only for truly optional build-time values**
3. **For required runtime values, use ENV directly**
4. **Test deployment locally with docker-compose before pushing**

**Debugging Checklist**:
- [ ] Check `docker-compose.yml` environment section
- [ ] Check `frontend/Dockerfile` for hardcoded ARG defaults
- [ ] Verify the built image: `docker run --rm <image> env | grep NEXT_PUBLIC_API_URL`
- [ ] Check browser Network tab for actual API calls being made
- [ ] Check Next.js build output for baked-in values

---

## DEPLOYMENT RULES

### ⚠️ CRITICAL: Source of Truth

- **Application code source of truth**: GitHub repository
- **Database source of truth**: VPS (server's SQLite file)
- **NEVER commit database files to Git**

### ⚠️ FORBIDDEN: Using rsync/scp for Database Files

**NEVER use rsync or scp to copy local database files to VPS!**

If you must use rsync for file deployment, ALWAYS exclude database files:
```bash
# ✅ CORRECT: Exclude all .db files
rsync -avz --exclude '*.db' --exclude 'reimburseeasy*.db' ... root@vps:/var/www/provex/

# ❌ WRONG: Will overwrite VPS database with local version
rsync -avz ... root@vps:/var/www/provex/  # NO!
```

### Safe Deployment Procedure

When deploying to VPS, follow this sequence to ensure rollback capability:

```bash
# 1. SSH to server
ssh -i ~/.ssh/id_ed25519 root@72.62.124.109
cd /var/www/provex

# 2. Check for differences (app or db structure)
git fetch origin
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/master)

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "App changes detected - checking db backup needed..."
    
    # Check if backend/models.py or db schema changed
    if git diff $LOCAL_COMMIT $REMOTE_COMMIT -- backend/app/models.py | grep -q "^diff"; then
        echo "⚠️ Database schema change detected!"
        echo "Creating backup before proceeding..."
        
        # Create timestamped backup BEFORE any DB changes
        BACKUP_DIR="./backups"
        mkdir -p $BACKUP_DIR
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        cp ./backend/reimburseeasy.db "$BACKUP_DIR/db_$TIMESTAMP.sqlite"
        gzip "$BACKUP_DIR/db_$TIMESTAMP.sqlite"
        echo "✅ Database backed up to $BACKUP_DIR/db_$TIMESTAMP.sqlite.gz"
        
        # Keep only last 5 backups
        ls -t $BACKUP_DIR/*.gz | tail -n +6 | xargs -r rm
        
        # Run DB migration (init_db.py will add new columns/tables without losing data)
        echo "Running database migration..."
        docker exec provex-backend-1 python init_db.py
    fi
fi

# 3. Pull latest code from GitHub (NOT rsync!)
git stash
git pull origin master

# 4. Rebuild and restart containers
docker compose down
docker compose up -d --build

# 5. Reload nginx
nginx -t && systemctl reload nginx

# 6. Verify deployment
curl -s https://provex.provaliantgroup.com/api/auth/login -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"kristine@provaliangroup.com","password":"admin123"}' | grep -q access_token \
    && echo "✅ Deployment successful!" \
    || echo "❌ Deployment failed - check logs"
```

### ⚠️ DB Schema Change Rules

When making changes to `backend/app/models.py`:
1. **ALWAYS backup VPS DB first** before deployment
2. **Use init_db.py** - it uses SQLAlchemy `create_all()` which only adds new tables/columns, NEVER deletes existing data
3. **Test locally first** with local DB that has sample data
4. **Never drop tables** - only add columns/tables
5. **If rollback needed**: restore backup and revert git commit

**Current DB state on VPS (DO NOT LOSE):**
- 5 users (kristine, bob, admin@reimburseeasy.com, manager@reimburseeasy.com, user@reimburseeasy.com)
- 3 projects (Proyek Gedung A, Business Trip Singapore, AI Projects)
- 7 claims with various statuses
- 3 categories

### Rollback Procedure

If deployment fails or database is corrupted:

```bash
# 1. Stop current containers
docker compose down

# 2. Restore database from backup
LATEST_BACKUP=$(ls -t backups/db_*.gz | head -1)
gunzip -k $LATEST_BACKUP
RESTORED_DB=$(basename $LATEST_BACKUP .gz)
cp ./backups/$RESTORED_DB ./backend/reimburseeasy.db

# 3. Revert to previous commit
git reset --hard HEAD~1

# 4. Restart containers
docker compose up -d
```

### Database Backup Schedule

- **Automatic**: On every schema change (detected via git diff on models.py)
- **Manual**: Run `POST /database/backup` via admin panel
- **Retention**: Keep last 5 backups, auto-delete older ones

---

**END OF AGENTS.md**
