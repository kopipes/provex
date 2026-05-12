# Dependency Flow — ReimburseEasy

## Internal Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐ │
│  │   Pages     │────▶│  Components   │     │      lib/       │ │
│  │             │     │              │     │                 │ │
│  │ page.tsx    │────▶│ Sidebar      │     │ api.ts         │ │
│  │ dashboard   │     │ Button       │     │ types.ts       │ │
│  │ admin/*    │     │ Input        │     │ utils.ts       │ │
│  │ projects/*  │     │ Badge        │     │ auth.tsx       │ │
│  │ claims/*    │     │ Toast        │     │                 │ │
│  │ history     │     └──────────────┘     └────────┬────────┘ │
│  │             │              │                    │           │
│  └─────────────┘              │                    │           │
│         │                     │                    │           │
│         └─────────────────────┼────────────────────┘           │
│                               │                                │
│                    ┌──────────▼──────────┐                      │
│                    │   HTTP Requests    │                      │
│                    │   (axios/axios)   │                      │
│                    └──────────┬──────────┘                      │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                │ REST API (JWT Bearer)
                                ▼
┌───────────────────────────────┼─────────────────────────────────┐
│                         Backend                                  │
├───────────────────────────────┼─────────────────────────────────┤
│                    ┌────────▼────────┐                         │
│                    │   Auth Layer   │                         │
│                    │   (JWT verify) │                         │
│                    └───────┬────────┘                         │
│                            │                                   │
│              ┌─────────────┼─────────────┐                     │
│              │             │             │                     │
│    ┌─────────▼─────────┐   │   ┌─────────▼─────────┐         │
│    │  require_admin   │   │   │ require_manager  │         │
│    └─────────┬─────────┘   │   │     _or_admin     │         │
│              │             │   └─────────┬─────────┘         │
│              │             │             │                   │
│    ┌─────────▼─────────────────▼─────────▼─────────┐             │
│    │               Routers                          │             │
│    │                                                  │             │
│    ├──────────┬──────────┬──────────┬──────────────┤             │
│    │          │          │          │              │             │
│    │ auth     │  users   │ projects │   claims     │             │
│    │ users    │  claims  │ analytics│   upload     │             │
│    │          │          │          │   ai_config │             │
│    └──────────┴──────────┴──────────┴──────────────┘             │
│                              │                                   │
│                    ┌─────────▼─────────┐                       │
│                    │     Schemas       │                       │
│                    │ (Pydantic models) │                       │
│                    └─────────┬─────────┘                       │
│                              │                                 │
│                    ┌─────────▼─────────┐                       │
│                    │     Models        │                       │
│                    │ (SQLAlchemy ORM) │                       │
│                    └─────────┬─────────┘                       │
│                              │                                 │
│                    ┌─────────▼─────────┐                       │
│                    │    Database      │                       │
│                    │    (SQLite)      │                       │
│                    └──────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

## Core Services Flow

### Authentication Flow
```
Frontend                    Backend
   │                           │
   │──POST /auth/login───────▶│
   │                           │──Verify credentials
   │                           │──Check user.status
   │                           │──Generate JWT
   │◀──{ access_token }───────│
   │                           │
   │──Store in localStorage────│
   │                           │
   │──GET /claims────────────▶│
   │ (Authorization header)    │──Verify JWT
   │                           │──Get user from token
   │◀──{ claims }─────────────│──Query database
```

### Claim Submission Flow
```
Frontend           Backend              Database
   │                 │                    │
   │──Upload file───▶│                    │
   │                 │──Save to uploads/──▶│
   │◀──{ path }─────│                    │
   │                 │                    │
   │──POST /claims─▶│                    │
   │                 │──Create record─────▶│
   │◀──{ claim }───│                    │
   │                 │                    │
   │──Submit claim──▶│                    │
   │                 │──Update status─────▶│
```

### Analytics Flow
```
Frontend                    Backend
   │                           │
   │──GET /analytics/dashboard▶│
   │                           │──Get current user
   │                           │──Query user's projects
   │                           │──Query user's claims
   │                           │──Aggregate data
   │◀──{ projects, claims }──│
```

## Shared Utilities

### Frontend Shared
```typescript
// api.ts - centralized API client
axios.create() → all API calls

// types.ts - shared TypeScript types
User, Claim, Project interfaces

// utils.ts - formatters
formatCurrency(), formatDate()
```

### Backend Shared
```python
# auth.py - authentication
get_current_user()
require_manager_or_admin()
require_admin()

# database.py - database session
get_db()
engine
Base.metadata.create_all()
```

## Circular Dependency Risks

### Backend
```
main.py
  ├── routers/auth.py
  ├── routers/users.py
  ├── routers/projects.py
  └── routers/claims.py
        │
        └── All import from app.models, app.schemas, app.auth
```

**Risk Level**: LOW - No circular dependencies detected

### Frontend
```
lib/api.ts
  └── imports types

lib/auth.tsx
  └── uses api.ts

pages/
  └── use lib/api.ts, lib/auth.tsx, components/*
```

**Risk Level**: LOW - No circular dependencies detected

## Module Interaction Summary

| From | To | Interaction |
|------|-----|-------------|
| Pages | lib/api | API calls |
| Pages | lib/auth | Auth context |
| Pages | Components | UI rendering |
| Components | lib/types | Type imports |
| lib/api | Backend | HTTP requests |