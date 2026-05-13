from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, users, projects, claims, analytics, ai_config, upload, database, departments

# Create database tables
Base.metadata.create_all(bind=engine)

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


@app.get("/")
def root():
    return {"message": "ProvEx API", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
