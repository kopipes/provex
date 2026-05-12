from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    MANAGER = "manager"
    ADMIN = "admin"


class UserStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"


class ClaimStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    REVISION = "revision"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class ClaimCategory(str, Enum):
    MAKANAN = "Makanan"
    TRANSPORT = "Transport"
    AKOMODASI = "Akomodasi"
    LAIN_LAIN = "Lain-lain"


# ============ User Schemas ============
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = UserRole.USER


class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None


class UserStatusUpdate(BaseModel):
    status: UserStatus


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserResponse(UserBase):
    id: int
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# ============ Project Schemas ============
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    budget_limit: Optional[float] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_limit: Optional[float] = None
    status: Optional[ProjectStatus] = None


class ProjectMemberAdd(BaseModel):
    user_id: int


class ProjectResponse(ProjectBase):
    id: int
    status: str
    created_by: Optional[int]
    created_at: datetime
    member_count: Optional[int] = 0
    total_claims: Optional[float] = 0

    class Config:
        from_attributes = True


class ProjectMemberResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    department: Optional[str]
    assigned_at: datetime

    class Config:
        from_attributes = True


# ============ Claim Schemas ============
class ClaimBase(BaseModel):
    merchant_name: str = Field(..., min_length=1, max_length=255)
    transaction_date: date
    amount: float = Field(..., gt=0)
    category: ClaimCategory
    description: Optional[str] = None
    receipt_number: Optional[str] = None


class ClaimCreate(ClaimBase):
    project_id: int
    receipt_image_path: Optional[str] = None


class ClaimUpdate(BaseModel):
    merchant_name: Optional[str] = None
    transaction_date: Optional[date] = None
    amount: Optional[float] = None
    category: Optional[ClaimCategory] = None
    description: Optional[str] = None
    receipt_number: Optional[str] = None


class ClaimStatusUpdate(BaseModel):
    status: ClaimStatus
    notes: Optional[str] = None


class ClaimResponse(ClaimBase):
    id: int
    user_id: int
    user_name: Optional[str] = None
    project_id: int
    project_name: Optional[str] = None
    receipt_image_path: Optional[str]
    status: str
    ai_extracted: bool
    notes: Optional[str]
    reviewed_by: Optional[int]
    reviewer_name: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============ AI Config Schemas ============
class AIConfigBase(BaseModel):
    base_url: Optional[str] = None
    model_name: Optional[str] = None
    api_key: Optional[str] = None
    ocr_enabled: bool = True


class AIConfigResponse(BaseModel):
    base_url: Optional[str]
    model_name: Optional[str]
    has_api_key: bool
    ocr_enabled: bool

    class Config:
        from_attributes = True


class AIConfigUpdate(BaseModel):
    base_url: Optional[str] = None
    model_name: Optional[str] = None
    api_key: Optional[str] = None
    ocr_enabled: Optional[bool] = None


class AIConnectionTest(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[int] = None


# ============ Analytics Schemas ============
class AnalyticsOverview(BaseModel):
    total_claims: int
    total_amount: float
    approved_count: int
    approved_amount: float
    pending_count: int
    pending_amount: float


class ProjectBreakdown(BaseModel):
    project_id: int
    project_name: str
    total_claims: int
    total_amount: float
    approved_count: int
    approved_amount: float


class TopSubmitter(BaseModel):
    user_id: int
    user_name: str
    total_claims: int
    total_amount: float


# ============ Audit Log Schemas ============
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str]
    action: str
    target_type: Optional[str]
    target_id: Optional[int]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Upload Schemas ============
class UploadResponse(BaseModel):
    filename: str
    path: str


# ============ Department Schemas ============
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
