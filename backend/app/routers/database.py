from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models import User
from app.auth import require_admin
from datetime import datetime
import os
import shutil
import sqlite3

router = APIRouter(prefix="/database", tags=["Database"])


@router.get("/backup")
def create_backup(
    current_user: User = Depends(require_admin)
):
    """Create a database backup"""
    try:
        db_path = None
        if "sqlite" in str(engine.url):
            db_path = str(engine.url).replace("sqlite:///", "")
        
        if not db_path or not os.path.exists(db_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Database file not found"
            )
        
        # Create backup directory if not exists
        backup_dir = os.path.join(os.path.dirname(db_path), "backups")
        os.makedirs(backup_dir, exist_ok=True)
        
        # Create backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"backup_{timestamp}.db"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Copy database to backup
        shutil.copy2(db_path, backup_path)
        
        return {
            "success": True,
            "message": "Backup created successfully",
            "backup_path": backup_path,
            "filename": backup_filename
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create backup: {str(e)}"
        )


@router.get("/backups")
def list_backups(
    current_user: User = Depends(require_admin)
):
    """List all available backups"""
    try:
        db_path = None
        if "sqlite" in str(engine.url):
            db_path = str(engine.url).replace("sqlite:///", "")
        
        if not db_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only SQLite databases are supported"
            )
        
        backup_dir = os.path.join(os.path.dirname(db_path), "backups")
        
        if not os.path.exists(backup_dir):
            return {"backups": []}
        
        backups = []
        for filename in os.listdir(backup_dir):
            if filename.endswith(".db"):
                filepath = os.path.join(backup_dir, filename)
                stat = os.stat(filepath)
                backups.append({
                    "filename": filename,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Sort by newest first
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {"backups": backups}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list backups: {str(e)}"
        )


@router.get("/backups/{filename}")
def download_backup(
    filename: str,
    current_user: User = Depends(require_admin)
):
    """Download a backup file"""
    try:
        db_path = None
        if "sqlite" in str(engine.url):
            db_path = str(engine.url).replace("sqlite:///", "")
        
        if not db_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only SQLite databases are supported"
            )
        
        backup_dir = os.path.join(os.path.dirname(db_path), "backups")
        backup_path = os.path.join(backup_dir, filename)
        
        if not os.path.exists(backup_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup file not found"
            )
        
        return FileResponse(
            backup_path,
            media_type="application/octet-stream",
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download backup: {str(e)}"
        )


@router.post("/restore/{filename}")
def restore_backup(
    filename: str,
    current_user: User = Depends(require_admin)
):
    """Restore database from a backup"""
    try:
        db_path = None
        if "sqlite" in str(engine.url):
            db_path = str(engine.url).replace("sqlite:///", "")
        
        if not db_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only SQLite databases are supported"
            )
        
        backup_dir = os.path.join(os.path.dirname(db_path), "backups")
        backup_path = os.path.join(backup_dir, filename)
        
        if not os.path.exists(backup_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup file not found"
            )
        
        # Create a backup of current database before restoring
        current_backup_dir = os.path.join(os.path.dirname(db_path), "backups")
        os.makedirs(current_backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        auto_backup_path = os.path.join(current_backup_dir, f"auto_backup_before_restore_{timestamp}.db")
        shutil.copy2(db_path, auto_backup_path)
        
        # Close all connections to the database
        engine.dispose()
        
        # Restore the backup
        shutil.copy2(backup_path, db_path)
        
        return {
            "success": True,
            "message": "Database restored successfully",
            "auto_backup": f"auto_backup_before_restore_{timestamp}.db"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore backup: {str(e)}"
        )


@router.delete("/backups/{filename}")
def delete_backup(
    filename: str,
    current_user: User = Depends(require_admin)
):
    """Delete a backup file"""
    try:
        db_path = None
        if "sqlite" in str(engine.url):
            db_path = str(engine.url).replace("sqlite:///", "")
        
        if not db_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only SQLite databases are supported"
            )
        
        backup_dir = os.path.join(os.path.dirname(db_path), "backups")
        backup_path = os.path.join(backup_dir, filename)
        
        if not os.path.exists(backup_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Backup file not found"
            )
        
        os.remove(backup_path)
        
        return {
            "success": True,
            "message": "Backup deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete backup: {str(e)}"
        )