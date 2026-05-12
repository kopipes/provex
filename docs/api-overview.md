# API Overview — ReimburseEasy

## Base Configuration

- **Base URL**: `http://localhost:8000`
- **API Prefix**: `/api` (configured in main.py)
- **Content-Type**: `application/json`

## Authentication

All endpoints except `/auth/*` require Bearer token:
```
Authorization: Bearer <access_token>
```

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes |

### Auth Request/Response

```bash
# Login Request
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Login Response
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}

# Me Response
GET /auth/me
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "role": "user",
  "status": "active",
  "department": "Engineering"
}
```

---

## User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | List all users | Manager/Admin |
| GET | `/users/{id}` | Get user by ID | Manager/Admin |
| POST | `/users` | Create user | Admin |
| PUT | `/users/{id}` | Update user | Admin |
| PATCH | `/users/{id}/status` | Update user status | Admin |
| PATCH | `/users/{id}/role` | Update user role | Admin |
| POST | `/users/{id}/password` | Change password | Admin |
| DELETE | `/users/{id}` | Delete user | Admin |

---

## Project Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/projects` | List projects | User |
| POST | `/projects` | Create project | Admin |
| GET | `/projects/{id}` | Get project | User |
| PUT | `/projects/{id}` | Update project | Admin |
| DELETE | `/projects/{id}` | Delete project | Admin |
| GET | `/projects/{id}/members` | List members | User |
| POST | `/projects/{id}/members` | Add member | Admin |
| DELETE | `/projects/{id}/members/{user_id}` | Remove member | Admin |
| GET | `/projects/{id}/my-claims` | Get user's claims for project | User |

---

## Claim Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/claims` | List claims (with filters) | User |
| POST | `/claims` | Create claim | User |
| GET | `/claims/{id}` | Get claim | User |
| PUT | `/claims/{id}` | Update claim (draft only) | User |
| PATCH | `/claims/{id}/status` | Update status | Manager/Admin |
| POST | `/claims/{id}/submit` | Submit for review | User |

### Query Parameters for GET /claims
```
?project_id=1
?status=submitted
?user_id=2
?start_date=2024-01-01
?end_date=2024-12-31
?category=Makanan
```

### Status Update Request
```bash
PATCH /claims/{id}/status
{
  "status": "approved",  // or "rejected" or "revision"
  "notes": "Optional note"  // recommended for rejection/revision
}
```

---

## Claims Workflow Status

| Status | Description | Allowed Transitions |
|--------|-------------|-------------------|
| `draft` | Initial state | → submitted |
| `submitted` | Awaiting review | → approved, rejected, revision |
| `revision` | Needs changes | → submitted |
| `approved` | Approved | (terminal) |
| `rejected` | Rejected | (terminal) |

---

## Upload Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/upload/receipt` | Upload receipt image | User |
| GET | `/uploads/{filename}` | Get uploaded file | User |

### Upload Request
```bash
POST /upload/receipt
Content-Type: multipart/form-data

file: <image file>
```

### Upload Response
```json
{
  "filename": "abc123uuid.jpg",
  "path": "/api/uploads/abc123uuid.jpg"
}
```

**Constraints:**
- Max size: 5MB
- Allowed: .jpg, .jpeg, .png

---

## Analytics Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/analytics/overview` | Dashboard overview | Manager/Admin |
| GET | `/analytics/by-project` | Claims by project | Manager/Admin |
| GET | `/analytics/top-submitters` | Top claim submitters | Manager/Admin |
| GET | `/analytics/audit-logs` | Audit logs | Admin |
| GET | `/analytics/export/csv` | Export to CSV | Manager/Admin |
| GET | `/analytics/dashboard` | User dashboard data | User |

### Query Parameters
```
?period=daily|weekly|monthly|all
?project_id=1
?start_date=2024-01-01
?end_date=2024-12-31
```

---

## AI Config Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/ai-config` | Get AI config | Admin |
| PUT | `/ai-config` | Update AI config | Admin |
| POST | `/ai-config/test` | Test AI connection | Admin |
| GET | `/ai-config/ocr-setting` | Get OCR status | User |

---

## Database Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/database/backup` | Create backup | Admin |
| GET | `/database/backups` | List backups | Admin |
| GET | `/database/backups/{filename}` | Download backup | Admin |
| POST | `/database/restore/{filename}` | Restore backup | Admin |
| DELETE | `/database/backups/{filename}` | Delete backup | Admin |

---

## Error Response Format

```json
{
  "detail": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (role not allowed) |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## API Versioning

Currently no versioning (v1 implied). Future versions may use `/api/v1/` prefix.