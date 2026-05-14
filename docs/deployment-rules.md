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

### ⚠️ BEFORE Changing DB/App Structure

**ALWAYS backup first!** Before any deployment that modifies database schema, models, or app structure:

1. **Backup VPS DB**: `docker exec provex-backend-1 cp /app/reimburseeasy.db /app/reimburseeasy.db.backup.$(date +%Y%m%d_%H%M%S)`
2. **Backup local DB**: `cp backend/reimburseeasy.db backend/backups/backup_$(date +%Y%m%d_%H%M%S).db`
3. **Test rollback**: Keep backup files for reverse/rollback if deployment fails

This ensures you can always restore to previous state if something breaks.

## What Gets Deployed

- ✅ Code from GitHub
- ✅ Environment config (.env)
- ✅ Uploads folder
- ❌ Database (DO NOT reset - it's on VPS!)