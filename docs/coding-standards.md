# Coding Standards — ReimburseEasy

## Project Conventions

### Directory Naming
- Use kebab-case for directories: `admin/claims`, `admin/users`
- Use camelCase for files: `dashboardPage.tsx`, `apiClient.ts`
- React components: PascalCase: `StatusBadge.tsx`, `Sidebar.tsx`

### Import Order (Frontend)
```typescript
// 1. External libraries
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// 2. Internal components
import { Button } from '@/components/Button';
import { Sidebar } from '@/components/Sidebar';

// 3. Internal lib/utils
import { formatCurrency, formatDate } from '@/lib/utils';
import { authAPI, claimsAPI } from '@/lib/api';

// 4. Types
import type { Claim, User } from '@/lib/types';
```

### Import Order (Backend)
```python
# 1. Standard library
import os
import uuid
from datetime import datetime

# 2. Third-party
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# 3. Local app
from app.database import get_db
from app.models import User, Claim
from app.schemas import ClaimCreate
```

---

## Naming Conventions

### Frontend (TypeScript)

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `isLoading`, `userName` |
| Functions | camelCase | `handleSubmit`, `fetchData` |
| Components | PascalCase | `StatusBadge`, `ClaimForm` |
| Hooks | camelCase with use prefix | `useAuth`, `useDashboard` |
| Types/Interfaces | PascalCase | `UserRole`, `ClaimStatus` |
| Enums | camelCase values, PascalCase type | `type ClaimStatus = 'draft' \| 'submitted'` |
| CSS Classes | kebab-case | `text-center`, `bg-bg-surface` |

### Backend (Python)

| Type | Convention | Example |
|------|------------|---------|
| Variables | snake_case | `user_id`, `project_name` |
| Functions | snake_case | `get_user_by_id`, `create_claim` |
| Classes | PascalCase | `UserService`, `ClaimRepository` |
| Routes | snake_case | `/claims`, `/project-members` |
| Tables | snake_case (plural) | `project_members`, `audit_logs` |
| Columns | snake_case | `receipt_image_path`, `created_at` |

---

## TypeScript Patterns

### Use TypeScript Strictly
```typescript
// ✅ Good
interface Claim {
  id: number;
  merchant_name: string;
  amount: number;
}

// ❌ Bad
const claim: any = response.data;
```

### Prefer Interface for Objects
```typescript
// ✅ Good
export interface User {
  id: number;
  name: string;
  email: string;
}

// ❌ Bad - avoid type alias for objects
export type User = {
  id: number;
  name: string;
};
```

### Use Union Types for Status/Enum Values
```typescript
// ✅ Good
export type ClaimStatus = 'draft' | 'submitted' | 'revision' | 'approved' | 'rejected';
export type UserRole = 'user' | 'manager' | 'admin';
```

---

## Python Patterns

### Pydantic Schemas for Validation
```python
# ✅ Good
class ClaimCreate(BaseModel):
    project_id: int
    merchant_name: str = Field(..., max_length=255)
    amount: float = Field(..., gt=0)
    category: str

# ❌ Bad - no validation
class ClaimCreate(BaseModel):
    project_id: int
    merchant_name: str
    amount: float
```

### SQLAlchemy Models
```python
# ✅ Good
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ❌ Bad - missing indexes on frequently queried columns
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String)
```

---

## React Component Patterns

### Client Components
```typescript
'use client';

import { useState } from 'react';

export default function DashboardPage() {
  const [data, setData] = useState<Type>(initialValue);

  useEffect(() => {
    // fetch data
  }, []);

  return (
    <div>
      {/* content */}
    </div>
  );
}
```

### Component Props
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

---

## API Patterns

### Frontend API Client
```typescript
// ✅ Good - centralized API
export const claimsAPI = {
  list: (params?: { status?: string }) => 
    api.get<Claim[]>('/claims', { params }),
  create: (data: ClaimFormData) => 
    api.post<Claim>('/claims', data),
};

// ❌ Bad - scattered API calls
const response = await axios.get('/claims');
```

### Backend Router Pattern
```python
# ✅ Good - grouped routes
router = APIRouter(prefix="/claims", tags=["Claims"])

@router.get("")
def list_claims(...): ...

@router.post("")
def create_claim(...): ...

@router.get("/{claim_id}")
def get_claim(...): ...
```

---

## Error Handling

### Frontend
```typescript
// ✅ Good
try {
  const response = await api.post('/claims', data);
  showToast('success', 'Claim created');
  router.push('/dashboard');
} catch (err: any) {
  showToast('error', err.response?.data?.detail || 'Failed to create claim');
}
```

### Backend
```python
# ✅ Good
from fastapi import HTTPException, status

@router.get("/{claim_id}")
def get_claim(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return claim
```

---

## Testing Conventions

### Backend - pytest structure
```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_claims.py
│   └── test_projects.py
```

### Frontend - manual testing
- All claims must be tested manually due to lack of test suite
- Use browser console for debugging
- Check Network tab for API responses

---

## Code Formatting

### Pre-commit Hooks
Not currently configured. Add these:

```bash
# Backend
pip install black isort
black .
isort .

# Frontend
npx prettier --write .
npx eslint --fix .
```

### Recommended Extensions
- Backend: Pylance, Python, Ruff
- Frontend: ESLint, Prettier, TypeScript Vue Volar