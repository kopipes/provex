# ReimburseEasy

Aplikasi Manajemen Reimbursement Berbasis Project

## Tech Stack

- **Backend**: Python + FastAPI + SQLite + SQLAlchemy ORM + JWT Auth
- **Frontend**: React + Next.js + TailwindCSS + React Query + Recharts

## Quick Start

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database with seed data
python init_db.py

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reimburseeasy.com | admin123 |
| Manager | manager@reimburseeasy.com | manager123 |
| User | user@reimburseeasy.com | user123 |

## API Documentation

After running the backend, visit:
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Features

- [x] User registration with pending activation
- [x] JWT-based authentication
- [x] Role-based access control (User, Manager, Admin)
- [x] Project management with member assignment
- [x] Claim submission with AI receipt scanning
- [x] Claim review workflow (approve/reject/revision)
- [x] Dashboard analytics for managers/admins
- [x] CSV export functionality
- [x] Audit logging
- [x] AI configuration panel

## Project Structure

```
pvreim/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT authentication
│   │   └── routers/         # API routes
│   ├── uploads/             # Uploaded files
│   ├── requirements.txt
│   └── init_db.py           # DB initialization
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # Reusable components
│   ├── lib/                 # Utilities & API
│   ├── package.json
│   └── tailwind.config.js
├── SPEC.md
├── PRD_ReimburseEasy_v2.md
└── DESIGN_ReimburseEasy.md
```

## Environment Variables

### Backend
```
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./reimburseeasy.db
ENCRYPTION_KEY=your-encryption-key
```

### Frontend
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api