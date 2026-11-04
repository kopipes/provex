from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Claim, Project, ProjectCategoryBudget
from datetime import datetime, timezone
from typing import Optional
import os
import secrets

router = APIRouter(prefix="/integration", tags=["Integration"])


def require_integration_key(
    x_internal_api_key: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None)
):
    """Service-to-service auth for the 2ndBrain warehouse, separate from user logins"""
    expected = os.getenv("INTERNAL_API_KEY", "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Integration disabled (no key configured)"
        )

    bearer = (authorization or "")
    bearer = bearer[7:] if bearer.lower().startswith("bearer ") else ""
    for candidate in (x_internal_api_key, bearer):
        if candidate and secrets.compare_digest(candidate.strip().encode(), expected.encode()):
            return

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def _rows(query):
    return [row._asdict() for row in query.all()]


@router.get("/export", dependencies=[Depends(require_integration_key)])
def export_for_warehouse(db: Session = Depends(get_db)):
    """Read-only export for 2ndBrain.

    Columns are listed explicitly: users, merchants, receipts, notes and
    secrets stay out because the warehouse only reports totals per project.
    """
    return {
        "app": "provex",
        "exportDate": datetime.now(timezone.utc).isoformat(),
        "projects": _rows(db.query(
            Project.id, Project.project_number, Project.name,
            Project.status, Project.start_date, Project.end_date
        )),
        "category_budgets": _rows(db.query(
            ProjectCategoryBudget.id, ProjectCategoryBudget.project_id,
            ProjectCategoryBudget.category, ProjectCategoryBudget.budget_amount
        )),
        "claims": _rows(db.query(
            Claim.id, Claim.project_id, Claim.category,
            Claim.amount, Claim.status, Claim.transaction_date
        )),
    }
