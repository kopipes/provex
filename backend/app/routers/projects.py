from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.database import get_db
from app.models import User, Project, ProjectMember, Claim
from app.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectMemberAdd, ProjectMemberResponse
)
from app.auth import get_current_user, require_admin, require_manager_or_admin
from typing import List, Optional

router = APIRouter(prefix="/projects", tags=["Projects"])


def project_to_response(project: Project, db: Session) -> dict:
    """Convert Project model to response dict with computed fields"""
    member_count = db.query(ProjectMember).filter(ProjectMember.project_id == project.id).count()
    total_amount = db.query(func.coalesce(func.sum(Claim.amount), 0)).filter(
        Claim.project_id == project.id
    ).scalar()
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "budget_limit": project.budget_limit,
        "status": project.status,
        "created_by": project.created_by,
        "created_at": project.created_at,
        "member_count": member_count,
        "total_claims": float(total_amount)
    }


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None
):
    query = db.query(Project)
    
    if status_filter:
        query = query.filter(Project.status == status_filter)
    
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
    
    projects = query.all()
    
    # Filter based on role
    if current_user.role == "user":
        # Users only see projects they are members of
        user_project_ids = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id
        ).all()
        project_ids = [p[0] for p in user_project_ids]
        projects = [p for p in projects if p.id in project_ids]
    
    return [project_to_response(p, db) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        start_date=project_data.start_date,
        end_date=project_data.end_date,
        budget_limit=project_data.budget_limit,
        created_by=current_user.id
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return project_to_response(new_project, db)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access for users
    if current_user.role == "user":
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this project"
            )
    
    return project_to_response(project, db)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.start_date is not None:
        project.start_date = project_data.start_date
    if project_data.end_date is not None:
        project.end_date = project_data.end_date
    # Handle budget_limit - check if attribute exists, even if None
    if hasattr(project_data, 'budget_limit'):
        project.budget_limit = project_data.budget_limit
    if project_data.status is not None:
        project.status = project_data.status.value if hasattr(project_data.status, 'value') else project_data.status
    
    db.commit()
    db.refresh(project)
    
    return project_to_response(project, db)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    return None


@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
def list_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    members = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    
    result = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        if user:
            result.append(ProjectMemberResponse(
                id=member.id,
                user_id=user.id,
                user_name=user.name,
                user_email=user.email,
                department=user.department,
                assigned_at=member.assigned_at
            ))
    
    return result


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: int,
    member_data: ProjectMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already a member
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member_data.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project"
        )
    
    new_member = ProjectMember(
        project_id=project_id,
        user_id=member_data.user_id,
        assigned_by=current_user.id
    )
    
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    return ProjectMemberResponse(
        id=new_member.id,
        user_id=user.id,
        user_name=user.name,
        user_email=user.email,
        department=user.department,
        assigned_at=new_member.assigned_at
    )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    db.delete(member)
    db.commit()
    return None


@router.get("/{project_id}/my-claims")
def get_my_claims_in_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.routers.claims import claim_to_response
    claims = db.query(Claim).filter(
        Claim.project_id == project_id,
        Claim.user_id == current_user.id
    ).all()
    
    return [claim_to_response(c, db) for c in claims]