from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from app.database import get_db
from app.models import User, Claim, Project, ProjectMember, AuditLog, ProjectCategoryBudget
from app.schemas import (
    ClaimCreate, ClaimUpdate, ClaimResponse, ClaimStatusUpdate
)
from app.auth import get_current_user, require_manager_or_admin
from typing import List, Optional
import os
import uuid

router = APIRouter(prefix="/claims", tags=["Claims"])

# Statuses that count toward category budget consumption
BUDGET_COUNTED_STATUSES = ("submitted", "revision", "approved")


def get_claim_window(project: Project):
    """Return the allowed claim window for a project.

    Claims (receipt date and submission date) are allowed from 1 month
    before start_date until 1 month after end_date.
    """
    window_start = project.start_date - relativedelta(months=1)
    window_end = project.end_date + relativedelta(months=1)
    return window_start, window_end


def check_claim_window(
    project: Project,
    transaction_date: Optional[date] = None,
    today: Optional[date] = None
) -> Optional[str]:
    """Return an error message when the claim is outside the allowed window.

    Both the receipt transaction date and the submission date (today) must fall
    within [start_date - 1 month, end_date + 1 month].
    """
    if not project.start_date or not project.end_date:
        return None  # No defined period => no restriction

    today = today or date.today()
    window_start, window_end = get_claim_window(project)

    # Submission date must be within the window
    if today < window_start:
        return (
            f"Klaim belum dapat diajukan. Pengajuan untuk project '{project.name}' "
            f"dibuka mulai {window_start.strftime('%d %b %Y')} "
            f"(1 bulan sebelum tanggal mulai project)."
        )
    if today > window_end:
        return (
            f"Periode pengajuan klaim untuk project '{project.name}' sudah berakhir "
            f"pada {window_end.strftime('%d %b %Y')} "
            f"(1 bulan setelah tanggal selesai project)."
        )

    # Receipt date must be within the window
    if transaction_date:
        if transaction_date < window_start:
            return (
                f"Tanggal struk ({transaction_date.strftime('%d %b %Y')}) di luar periode klaim "
                f"project '{project.name}'. Bon lama tidak dapat diklaim. "
                f"Periode yang diterima: {window_start.strftime('%d %b %Y')} "
                f"s/d {window_end.strftime('%d %b %Y')}."
            )
        if transaction_date > window_end:
            return (
                f"Tanggal struk ({transaction_date.strftime('%d %b %Y')}) melewati batas periode klaim "
                f"project '{project.name}'. "
                f"Periode yang diterima: {window_start.strftime('%d %b %Y')} "
                f"s/d {window_end.strftime('%d %b %Y')}."
            )

    return None



def check_category_budget(
    project_id: int,
    category: str,
    amount: float,
    db: Session,
    exclude_claim_id: Optional[int] = None
) -> Optional[dict]:
    """Check whether a claim amount fits the project's category budget.

    Returns a warning dict when the claim would exceed the budget, otherwise None.
    Categories without a configured budget are unlimited.
    """
    if not category:
        return None

    budget = db.query(ProjectCategoryBudget).filter(
        ProjectCategoryBudget.project_id == project_id,
        ProjectCategoryBudget.category == category
    ).first()

    if not budget:
        return None  # No budget configured => unlimited

    used_query = db.query(func.coalesce(func.sum(Claim.amount), 0)).filter(
        Claim.project_id == project_id,
        Claim.category == category,
        Claim.status.in_(BUDGET_COUNTED_STATUSES)
    )
    if exclude_claim_id is not None:
        used_query = used_query.filter(Claim.id != exclude_claim_id)
    used = float(used_query.scalar() or 0)

    total_after = used + float(amount)
    if total_after <= budget.budget_amount:
        return None

    over = total_after - budget.budget_amount
    return {
        "category": category,
        "budget_amount": float(budget.budget_amount),
        "used_amount": used,
        "attempted_amount": float(amount),
        "total_after": total_after,
        "over_amount": over,
        "message": (
            f"Budget kategori '{category}' tidak mencukupi. "
            f"Jatah {budget.budget_amount:,.0f}, sudah terpakai {used:,.0f}, "
            f"sisa {budget.budget_amount - used:,.0f}. "
            f"Klaim ini melebihi sebesar {over:,.0f}."
        )
    }


def claim_to_response(claim: Claim, db: Session, budget_warning: Optional[dict] = None) -> dict:
    """Convert Claim model to response dict with computed fields"""
    user = db.query(User).filter(User.id == claim.user_id).first()
    project = db.query(Project).filter(Project.id == claim.project_id).first()
    reviewer = None
    if claim.reviewed_by:
        reviewer = db.query(User).filter(User.id == claim.reviewed_by).first()
    
    return {
        "id": claim.id,
        "user_id": claim.user_id,
        "user_name": user.name if user else None,
        "project_id": claim.project_id,
        "project_name": project.name if project else None,
        "receipt_image_path": claim.receipt_image_path,
        "merchant_name": claim.merchant_name,
        "transaction_date": claim.transaction_date,
        "amount": claim.amount,
        "category": claim.category,
        "description": claim.description,
        "receipt_number": claim.receipt_number,
        "status": claim.status,
        "ai_extracted": claim.ai_extracted,
        "notes": claim.notes,
        "reviewed_by": claim.reviewed_by,
        "reviewer_name": reviewer.name if reviewer else None,
        "reviewed_at": claim.reviewed_at,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
        "budget_warning": budget_warning
    }


@router.get("", response_model=List[ClaimResponse])
def list_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    user_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category: Optional[str] = Query(None)
):
    query = db.query(Claim)
    
    # Filter by project
    if project_id:
        query = query.filter(Claim.project_id == project_id)
    
    # Filter by status
    if status_filter:
        query = query.filter(Claim.status == status_filter)
    
    # Filter by user
    if user_id:
        query = query.filter(Claim.user_id == user_id)
    
    # Filter by date range
    if start_date:
        query = query.filter(Claim.transaction_date >= start_date)
    if end_date:
        query = query.filter(Claim.transaction_date <= end_date)
    
    # Filter by category
    if category:
        query = query.filter(Claim.category == category)
    
    # Role-based filtering
    if current_user.role == "user":
        query = query.filter(Claim.user_id == current_user.id)
    
    claims = query.order_by(Claim.created_at.desc()).all()
    return [claim_to_response(c, db) for c in claims]


@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    claim_data: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify project exists and user is a member
    project = db.query(Project).filter(Project.id == claim_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if current_user.role == "user":
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == claim_data.project_id,
            ProjectMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project"
            )
    
    # Enforce claim window (±1 month around project period)
    window_error = check_claim_window(project, claim_data.transaction_date)
    if window_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=window_error
        )
    
    category = claim_data.category.value if hasattr(claim_data.category, 'value') else claim_data.category

    # Budget check — block when exceeding category budget (unless already confirmed)
    if not claim_data.confirm_over_budget:
        warning = check_category_budget(
            claim_data.project_id, category, claim_data.amount, db
        )
        if warning:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=warning["message"],
                headers={}
            )

    new_claim = Claim(
        user_id=current_user.id,
        project_id=claim_data.project_id,
        receipt_image_path=claim_data.receipt_image_path,
        merchant_name=claim_data.merchant_name,
        transaction_date=claim_data.transaction_date,
        amount=claim_data.amount,
        category=category,
        description=claim_data.description,
        receipt_number=claim_data.receipt_number,
        status="submitted",  # Auto-submit on creation
        ai_extracted=False
    )
    
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)
    
    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="create_claim",
        target_type="claim",
        target_id=new_claim.id,
        details=f"Created claim for {claim_data.merchant_name}"
    )
    db.add(audit)
    db.commit()
    
    return claim_to_response(new_claim, db)


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Check access
    if current_user.role == "user" and claim.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other user's claim"
        )
    
    return claim_to_response(claim, db)


@router.put("/{claim_id}", response_model=ClaimResponse)
def update_claim(
    claim_id: int,
    claim_data: ClaimUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Admin/Manager can update any claim
    # Owner can update their own claims only if not approved/rejected
    is_admin_or_manager = current_user.role in ["admin", "manager"]
    
    if claim.user_id != current_user.id and not is_admin_or_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's claim"
        )
    
    if claim.status in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update claims that are already approved or rejected"
        )
    
    # Determine effective values after update for budget validation
    new_category = claim.category
    if claim_data.category is not None:
        new_category = claim_data.category.value if hasattr(claim_data.category, 'value') else claim_data.category
    new_amount = claim_data.amount if claim_data.amount is not None else claim.amount
    new_transaction_date = (
        claim_data.transaction_date
        if claim_data.transaction_date is not None
        else claim.transaction_date
    )

    # Enforce claim window when the claim is being (re)submitted
    if claim.status in ("draft", "revision"):
        project = db.query(Project).filter(Project.id == claim.project_id).first()
        if project:
            window_error = check_claim_window(project, new_transaction_date)
            if window_error:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=window_error
                )

    # Budget check — block when exceeding category budget (unless already confirmed)
    if not claim_data.confirm_over_budget:
        warning = check_category_budget(
            claim.project_id, new_category, new_amount, db, exclude_claim_id=claim.id
        )
        if warning:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=warning["message"]
            )

    if claim_data.merchant_name is not None:
        claim.merchant_name = claim_data.merchant_name
    if claim_data.transaction_date is not None:
        claim.transaction_date = claim_data.transaction_date
    if claim_data.amount is not None:
        claim.amount = claim_data.amount
    if claim_data.category is not None:
        claim.category = new_category
    if claim_data.description is not None:
        claim.description = claim_data.description
    if claim_data.receipt_number is not None:
        claim.receipt_number = claim_data.receipt_number
    if claim_data.receipt_image_path is not None:
        claim.receipt_image_path = claim_data.receipt_image_path
    
    # If claim was in revision status and user is editing, auto-submit
    if claim.status == "revision":
        claim.status = "submitted"
    
    db.commit()
    db.refresh(claim)
    
    return claim_to_response(claim, db)


@router.patch("/{claim_id}/status", response_model=ClaimResponse)
def update_claim_status(
    claim_id: int,
    status_data: ClaimStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Validate status transition
    valid_transitions = {
        "submitted": ["approved", "rejected", "revision"],
        "revision": ["submitted", "approved", "rejected"]
    }
    
    if claim.status not in valid_transitions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot change status from {claim.status}"
        )
    
    new_status = status_data.status.value
    if new_status not in valid_transitions.get(claim.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {claim.status} to {new_status}"
        )
    
    claim.status = new_status
    claim.notes = status_data.notes
    claim.reviewed_by = current_user.id
    claim.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(claim)
    
    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action=f"{new_status}_claim",
        target_type="claim",
        target_id=claim.id,
        details=f"Changed claim #{claim.id} status to {new_status}: {status_data.notes or ''}"
    )
    db.add(audit)
    db.commit()
    
    return claim_to_response(claim, db)


@router.post("/{claim_id}/submit", response_model=ClaimResponse)
def submit_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    if claim.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot submit other user's claim"
        )
    
    if claim.status != "draft" and claim.status != "revision":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only submit draft or revision claims"
        )
    
    # Enforce claim window on submission
    project = db.query(Project).filter(Project.id == claim.project_id).first()
    if project:
        window_error = check_claim_window(project, claim.transaction_date)
        if window_error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=window_error
            )
    
    claim.status = "submitted"
    db.commit()
    db.refresh(claim)
    
    return claim_to_response(claim, db)


@router.delete("/{claim_id}")
def delete_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a claim - Admin/Manager can delete any, owner can delete draft only"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    is_admin_or_manager = current_user.role in ["admin", "manager"]
    
    # Admin/Manager can delete any claim
    # Owner can only delete draft claims
    if claim.user_id != current_user.id:
        if not is_admin_or_manager:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete other user's claim"
            )
    else:
        # Owner can only delete draft claims
        if claim.status not in ["draft", "revision"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only delete draft or revision claims"
            )
    
    # Delete the claim
    db.delete(claim)
    
    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="delete_claim",
        target_type="claim",
        target_id=claim_id,
        details=f"Deleted claim #{claim_id}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Claim deleted successfully"}
