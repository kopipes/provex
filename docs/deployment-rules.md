# Deployment Rules - GOLDEN RULES

## Source of Truth

| Component | Source of Truth | Location |
|-----------|-----------------|----------|
| **Code** | GitHub Repository | `https://github.com/kopipes/provex` |
| **Database** | VPS Production | `provex.provaliantgroup.com` (Docker container) |

## NEVER DO

⚠️ **NEVER delete or reset the database on the VPS during deployment**

The docker-compose.yml should NOT rebuild from scratch that destroys the DB. The DB is persistent on the VPS and must survive deployments.

## Correct Deployment Flow

1. **Code changes** → Push to GitHub
2. **VPS deployment** → `git pull` on VPS, then `docker compose up --build -d`
3. **DB persistence** → DB file is mounted from host, survives container rebuilds

## Database Rules

- Local development: `backend/reimburseeasy.db` (gitignored, don't commit)
- Production VPS: Mounted via volume in docker-compose.yml
- Backups: Keep local backups, copy to VPS when needed

## What Gets Deployed

- ✅ Code from GitHub
- ✅ Environment config (.env)
- ✅ Uploads folder
- ❌ Database (DO NOT reset - it's on VPS!)