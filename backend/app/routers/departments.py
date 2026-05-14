from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Department
from app.schemas import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.auth import require_admin
from typing import List

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/public", response_model=List[DepartmentResponse])
def list_departments_public(db: Session = Depends(get_db)):
    """List all departments for public access (registration)"""
    departments = db.query(Department).order_by(Department.name).all()
    return departments


@router.get("", response_model=List[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all departments (admin only)"""
    departments = db.query(Department).order_by(Department.name).all()
    return departments


@router.post("", response_model=DepartmentResponse)
def create_department(
    dept_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new department (admin only)"""
    # Check if department name already exists
    existing = db.query(Department).filter(Department.name == dept_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists"
        )
    
    department = Department(
        name=dept_data.name,
        description=dept_data.description
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a department by ID (admin only)"""
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    return department


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    dept_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a department (admin only)"""
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    # Check if new name already exists (if name is being changed)
    if dept_data.name and dept_data.name != department.name:
        existing = db.query(Department).filter(Department.name == dept_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department with this name already exists"
            )
        department.name = dept_data.name
    
    if dept_data.description is not None:
        department.description = dept_data.description
    
    db.commit()
    db.refresh(department)
    return department


@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a department (admin only)"""
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    db.delete(department)
    db.commit()
    return {"message": "Department deleted successfully"}