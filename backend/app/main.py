import os

# Load .env before importing app modules: several of them read environment
# variables at import time (e.g. auth.SECRET_KEY, database.DATABASE_URL).
# Without this, those modules silently fall back to insecure defaults.
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, users, projects, claims, analytics, ai_config, upload, database, departments, categories

# Create database tables
Base.metadata.create_all(bind=engine)


def apply_lightweight_migrations():
    """Additive-only column migrations for existing databases.

    create_all() does not alter existing tables, so new nullable columns
    must be added explicitly. Safe to run on every startup.
    """
    db_path = os.environ.get('DATABASE_URL', 'sqlite:///./reimburseeasy.db').replace('sqlite:///', '')
    if not os.path.exists(db_path):
        return
    import sqlite3
    conn = sqlite3.connect(db_path)
    try:
        existing = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
        if existing and 'last_dashboard_seen_at' not in existing:
            conn.execute("ALTER TABLE users ADD COLUMN last_dashboard_seen_at DATETIME")
            conn.commit()
            print("Migration: added users.last_dashboard_seen_at")
    finally:
        conn.close()


apply_lightweight_migrations()

# Auto-seed database if empty (skip in Docker volume persistence)
def check_and_seed_db():
    """Check if database needs seeding and run init_db.py"""
    db_path = os.environ.get('DATABASE_URL', 'sqlite:///./reimburseeasy.db').replace('sqlite:///', '')
    if os.path.exists(db_path):
        import sqlite3
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        conn.close()
        if count == 0:
            print("Database is empty, seeding with initial data...")
            import subprocess
            subprocess.run(['python', '/app/init_db.py'], check=False)

# Run database check on startup
check_and_seed_db()

app = FastAPI(
    title="ProvEx API",
    description="Backend API for ProvEx - Project-based Reimbursement Management System",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8080",
    "https://provex.provaliantgroup.com",
    "http://provex.provaliantgroup.com",
    "http://72.62.124.109",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(claims.router)
app.include_router(analytics.router)
app.include_router(ai_config.router)
app.include_router(upload.router)
app.include_router(database.router)
app.include_router(departments.router)
app.include_router(categories.router)


@app.get("/")
def root():
    return {"message": "ProvEx API", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
