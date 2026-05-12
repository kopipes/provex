# Business Rules — ReimburseEasy

## Core Domain: Reimbursement Claim Management

ReimburseEasy is a project-based reimbursement management system where:
- **Every claim belongs to exactly one project**
- **Every user must be a member of a project to submit claims**
- **Claims have a defined workflow lifecycle**

---

## User Roles & Permissions

### Role Hierarchy
| Role | Level | Description |
|------|-------|-------------|
| `user` | 1 | Submit claims, view own projects |
| `manager` | 2 | Review claims, manage users in project |
| `admin` | 3 | Full system access |

### Permission Matrix

| Action | User | Manager | Admin |
|--------|------|---------|-------|
| Login | ✅ | ✅ | ✅ |
| Register | ✅ | ✅ | ✅ |
| View own projects | ✅ | ✅ | ✅ |
| Submit claims | ✅ | ✅ | ✅ |
| View own claims | ✅ | ✅ | ✅ |
| Submit own claim for review | ✅ | ✅ | ✅ |
| Review claims (approve/reject) | ❌ | ✅ | ✅ |
| View all claims | ❌ | ✅ | ✅ |
| Manage users | ❌ | ✅ | ✅ |
| Create/edit projects | ❌ | ❌ | ✅ |
| Delete projects | ❌ | ❌ | ✅ |
| Add project members | ❌ | ❌ | ✅ |
| View analytics | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| Configure AI | ❌ | ❌ | ✅ |
| Database backup/restore | ❌ | ❌ | ✅ |

---

## Claim Workflow

### Status Lifecycle
```
draft → submitted → approved
                   ↘ rejected
                   ↘ revision → submitted
```

### Status Definitions

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `draft` | Initial state, not yet submitted | User (creator) |
| `submitted` | Submitted for review | User (creator) |
| `revision` | Needs revision, sent back | Manager/Admin |
| `approved` | Approved for reimbursement | Manager/Admin |
| `rejected` | Rejected, no further action | Manager/Admin |

### Workflow Rules

1. **Draft → Submitted**: User must explicitly submit
2. **Submitted → Revision**: Manager/Admin adds notes explaining required changes
3. **Revision → Submitted**: User resubmits after fixing issues
4. **Submitted → Approved/Rejected**: Final decision, no workflow return

### Claim Data Validation

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `project_id` | int | Yes | Must be active project, user must be member |
| `merchant_name` | string | Yes | Max 255 chars |
| `transaction_date` | date | Yes | Cannot be future date |
| `amount` | float | Yes | Must be > 0 |
| `category` | enum | Yes | makanan/transport/akomodasi/lain-lain |
| `receipt_image_path` | string | No | Valid path to uploaded file |
| `receipt_number` | string | No | Max 100 chars |
| `description` | text | No | Optional notes |

---

## Project Membership Rules

### Rules
1. A user can only submit claims for projects they are members of
2. Only Admin can add/remove project members
3. A project must have at least one member (creator is auto-added)
4. Projects can be `active` or `archived`

### Project Status Rules
- `active`: Accepts new claims
- `archived`: No new claims, existing claims remain

---

## User Account Rules

### Registration
1. New users start with `role: "user"` and `status: "pending"`
2. Password must be hashed with bcrypt before storage
3. Email must be unique across system

### User Status Values
| Status | Meaning |
|--------|---------|
| `pending` | Registered but not activated |
| `active` | Can use system |
| `inactive` | Temporarily disabled |

---

## Audit Logging Rules

### Tracked Actions
| Action | Trigger |
|--------|---------|
| `user.registered` | New user registration |
| `user.login` | User login |
| `user.status_changed` | User status updated |
| `user.role_changed` | User role updated |
| `project.created` | New project created |
| `project.updated` | Project modified |
| `project.deleted` | Project deleted |
| `claim.created` | New claim submitted |
| `claim.submitted` | Claim submitted for review |
| `claim.approved` | Claim approved |
| `claim.rejected` | Claim rejected |
| `claim.revision` | Claim returned for revision |

---

## Budget Tracking (Implicit)

### Rules
1. `budget_limit` is optional per project
2. No automatic enforcement of budget limits
3. Analytics show total claims vs budget for reporting

---

## AI Integration (Optional)

### Rules
1. AI Config is optional
2. OCR disabled by default
3. API key encrypted at rest using Fernet
4. If AI fails, graceful fallback to manual entry

---

## Security Constraints

1. **Password Storage**: bcrypt hashing only
2. **API Authentication**: JWT with 24-hour expiry
3. **File Upload**: Max 5MB, images only (jpg/jpeg/png)
4. **CORS**: Restricted to localhost:3000, localhost:3001

---

## Data Constraints

1. **Soft Delete**: No hard deletes for claims/projects
2. **Timestamps**: All records have created_at, most have updated_at
3. **UTC+7**: All timestamps in Asia/Jakarta timezone
4. **Unique Constraints**: Email must be unique