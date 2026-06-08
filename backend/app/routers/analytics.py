from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from app.database import get_db
from app.models import User, Claim, Project, AuditLog
from app.schemas import (
    AnalyticsOverview, ProjectBreakdown, TopSubmitter, AuditLogResponse
)
from app.auth import require_manager_or_admin, require_admin, get_current_user
from typing import List, Optional
import csv
import io

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_date_range(period: str):
    """Get start and end dates based on period filter"""
    now = datetime.utcnow()
    
    if period == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "weekly":
        start = now - timedelta(days=7)
        end = now
    elif period == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    else:  # all
        start = datetime(2000, 1, 1)
        end = now
    
    return start, end


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    period: str = Query("monthly"),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    start, end = get_date_range(period)
    
    query = db.query(Claim).filter(
        Claim.transaction_date >= start_date,
        Claim.transaction_date <= end_date
    ) if start_date and end_date else db.query(Claim).filter(
        Claim.created_at >= start,
        Claim.created_at <= end
    )
    
    if project_id:
        query = query.filter(Claim.project_id == project_id)
    
    claims = query.all()
    
    total_claims = len(claims)
    total_amount = sum(c.amount for c in claims)
    
    approved_claims = [c for c in claims if c.status == "approved"]
    pending_claims = [c for c in claims if c.status in ["submitted", "revision"]]
    
    return AnalyticsOverview(
        total_claims=total_claims,
        total_amount=total_amount,
        approved_count=len(approved_claims),
        approved_amount=sum(c.amount for c in approved_claims),
        pending_count=len(pending_claims),
        pending_amount=sum(c.amount for c in pending_claims)
    )


@router.get("/by-project", response_model=List[ProjectBreakdown])
def get_project_breakdown(
    period: str = Query("monthly"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    start, end = get_date_range(period)
    
    # Get claims grouped by project
    projects = db.query(Project).filter(Project.status == "active").all()
    
    result = []
    for project in projects:
        claims = db.query(Claim).filter(
            Claim.project_id == project.id,
            Claim.created_at >= start,
            Claim.created_at <= end
        ).all()
        
        approved_claims = [c for c in claims if c.status == "approved"]
        
        if claims:
            result.append(ProjectBreakdown(
                project_id=project.id,
                project_name=project.name,
                total_claims=len(claims),
                total_amount=sum(c.amount for c in claims),
                approved_count=len(approved_claims),
                approved_amount=sum(c.amount for c in approved_claims)
            ))
    
    # Sort by total amount descending
    result.sort(key=lambda x: x.total_amount, reverse=True)
    
    return result


@router.get("/top-submitters", response_model=List[TopSubmitter])
def get_top_submitters(
    period: str = Query("monthly"),
    limit: int = Query(10),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    start, end = get_date_range(period)
    
    # Group claims by user
    from sqlalchemy import distinct
    
    users_with_claims = db.query(
        Claim.user_id,
        func.count(Claim.id).label("claim_count"),
        func.sum(Claim.amount).label("total_amount")
    ).filter(
        Claim.created_at >= start,
        Claim.created_at <= end
    ).group_by(Claim.user_id).order_by(
        func.sum(Claim.amount).desc()
    ).limit(limit).all()
    
    result = []
    for user_id, claim_count, total_amount in users_with_claims:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            result.append(TopSubmitter(
                user_id=user_id,
                user_name=user.name,
                total_claims=claim_count,
                total_amount=float(total_amount or 0)
            ))
    
    return result


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    logs = db.query(AuditLog).order_by(
        AuditLog.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append(AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=user.name if user else None,
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            details=log.details,
            created_at=log.created_at
        ))
    
    return result


@router.get("/export/csv")
def export_csv(
    period: str = Query("monthly"),
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    # Use custom date range if provided, otherwise use period filter
    if start_date and end_date:
        from datetime import date as date_type
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    else:
        start, end = get_date_range(period)
    
    # Use transaction_date for filtering when custom date range provided
    if start_date and end_date:
        query = db.query(Claim).filter(
            Claim.transaction_date >= start,
            Claim.transaction_date <= end
        )
    else:
        query = db.query(Claim).filter(
            Claim.created_at >= start,
            Claim.created_at <= end
        )
    
    if project_id:
        query = query.filter(Claim.project_id == project_id)
    if status:
        query = query.filter(Claim.status == status)
    
    claims = query.order_by(Claim.created_at.desc()).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "User", "Project", "Merchant", "Category", 
        "Amount", "Transaction Date", "Status", 
        "Created At", "Reviewed By", "Reviewed At", "Notes"
    ])
    
    for claim in claims:
        user = db.query(User).filter(User.id == claim.user_id).first()
        project = db.query(Project).filter(Project.id == claim.project_id).first()
        reviewer = None
        if claim.reviewed_by:
            reviewer = db.query(User).filter(User.id == claim.reviewed_by).first()
        
        writer.writerow([
            claim.id,
            user.name if user else "",
            project.name if project else "",
            claim.merchant_name,
            claim.category,
            claim.amount,
            claim.transaction_date,
            claim.status,
            claim.created_at.strftime("%Y-%m-%d %H:%M"),
            reviewer.name if reviewer else "",
            claim.reviewed_at.strftime("%Y-%m-%d %H:%M") if claim.reviewed_at else "",
            claim.notes or ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=claims_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )


@router.get("/dashboard")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard summary for current user"""
    
    if current_user.role == "user":
        # User sees their own projects and claims
        from app.models import ProjectMember
        
        project_ids = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id
        ).all()
        project_id_list = [p[0] for p in project_ids]
        
        projects = db.query(Project).filter(
            Project.id.in_(project_id_list),
            Project.status == "active"
        ).all()
        
        my_claims = db.query(Claim).filter(
            Claim.user_id == current_user.id
        ).order_by(Claim.created_at.desc()).limit(5).all()
        
        return {
            "projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": p.status,
                    "claim_count": db.query(Claim).filter(
                        Claim.project_id == p.id,
                        Claim.user_id == current_user.id
                    ).count(),
                    "total_amount": db.query(func.coalesce(func.sum(Claim.amount), 0)).filter(
                        Claim.project_id == p.id,
                        Claim.user_id == current_user.id
                    ).scalar()
                }
                for p in projects
            ],
            "recent_claims": [
                {
                    "id": c.id,
                    "merchant_name": c.merchant_name,
                    "amount": c.amount,
                    "status": c.status,
                    "created_at": c.created_at
                }
                for c in my_claims
            ]
        }
    else:
        # Manager/Admin sees all data
        # Get all active projects
        projects = db.query(Project).filter(Project.status == "active").all()
        
        # Get recent claims (last 10)
        recent_claims = db.query(Claim).order_by(Claim.created_at.desc()).limit(10).all()
        
        return {
            "projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": p.status,
                    "claim_count": db.query(Claim).filter(Claim.project_id == p.id).count(),
                    "total_amount": db.query(func.coalesce(func.sum(Claim.amount), 0)).filter(
                        Claim.project_id == p.id
                    ).scalar()
                }
                for p in projects
            ],
            "recent_claims": [
                {
                    "id": c.id,
                    "merchant_name": c.merchant_name,
                    "amount": c.amount,
                    "status": c.status,
                    "created_at": c.created_at,
                    "project_name": db.query(Project).filter(Project.id == c.project_id).first().name if db.query(Project).filter(Project.id == c.project_id).first() else None
                }
                for c in recent_claims
            ]
        }
