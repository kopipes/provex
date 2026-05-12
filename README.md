# ReimburseEasy

> Project-based Reimbursement Management System

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python)

## Overview

ReimburseEasy is a web application for managing employee reimbursement claims in a project-based context. Each claim is tied to a specific project, enabling better tracking and reporting of expenses per project.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS |
| Backend | FastAPI, Python, SQLAlchemy ORM, Pydantic |
| Database | SQLite |
| Authentication | JWT Bearer tokens + bcrypt |

## Project Structure

```
pvreim/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT authentication
│   │   └── routers/         # API route modules
│   │       ├── auth.py      # Login, register
│   │       ├── claims.py    # Claims CRUD
│   │       ├── projects.py  # Projects CRUD
│   │       ├── users.py     # Users management
│   │       ├── analytics.py # Dashboard, reports
│   │       ├── upload.py    # File uploads
│   │       ├── ai_config.py # AI settings
│   │       └── database.py  # Backup/restore
│   ├── uploads/             # Uploaded files (receipts)
│   ├── requirements.txt
│   └── init_db.py          # Database initialization
├── frontend/
│   ├── app/               # Next.js pages
│   │   ├── page.tsx       # Login page
│   │   ├── dashboard/      # User dashboard
│   │   ├── projects/       # Project pages
│   │   ├── claims/         # Claim form
│   │   ├── history/        # Claim history
│   │   └── admin/          # Admin pages
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utilities & API client
│   │   ├── api.ts         # Axios API methods
│   │   ├── auth.tsx       # Auth context
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── utils.ts       # Helper functions
│   ├── public/             # Static assets
│   │   ├── logo.png       # App logo
│   │   └── icon.png        # Favicon
│   ├── package.json
│   └── tailwind.config.js
├── docs/                   # Documentation
│   ├── architecture.md
│   ├── business-rules.md
│   ├── coding-standards.md
│   ├── api-overview.md
│   ├── module-map.md
│   └── dependency-flow.md
├── SPEC.md                # Full specification
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database with seed data
python init_db.py

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reimburseeasy.com | admin123 |
| Manager | manager@reimburseeasy.com | manager123 |
| User | user@reimburseeasy.com | user123 |

## Features

### Core Features

- [x] JWT-based authentication
- [x] Role-based access control (User, Manager, Admin)
- [x] Project management with member assignment
- [x] Claim submission with receipt upload
- [x] Claim review workflow (approve/reject/revision)
- [x] Dashboard with project cards and recent claims
- [x] Search and filter functionality
- [x] CSV export for reports
- [x] Audit logging
- [x] AI/OCR configuration panel
- [x] Database backup/restore

### User Roles

| Feature | User | Manager | Admin |
|---------|------|---------|-------|
| Submit claims | ✅ | ✅ | ✅ |
| Review claims | ❌ | ✅ | ✅ |
| Manage users | ❌ | ✅ | ✅ |
| Create projects | ❌ | ❌ | ✅ |
| View analytics | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | ✅ |

### Claim Workflow

```
draft → submitted → approved
                   ↘ rejected
                   ↘ revision → submitted
```

## Environment Variables

### Backend

Create a `.env` file in `backend/`:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./reimburseeasy.db
ENCRYPTION_KEY=your-fernet-key-here
```

### Frontend

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Documentation

- [SPEC.md](./SPEC.md) - Full specification
- [docs/](./docs/) - Detailed documentation
- [AGENTS.md](./AGENTS.md) - AI agent instructions

## API Documentation

FastAPI provides auto-generated API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Backend

```bash
# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# Run tests (if any)
pytest
```

### Frontend

```bash
# Development
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

## License

MIT License

---

Built with FastAPI + Next.js