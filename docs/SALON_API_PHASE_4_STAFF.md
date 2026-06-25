# Salon API Phase 4 — Staff

## Design Decision

Staff profiles are stored in a separate `SalonStaff` collection, distinct from `SalonUser` (login credentials). This keeps operational staff data (schedule, services, salary, performance) separate from auth data (passwordHash, login timestamps). An optional `userId` field links a staff profile to a SalonUser for cross-reference.

- `SalonUser`: login/auth only (email, passwordHash, role, isActive)
- `SalonStaff`: operational profile (schedule, services, salary, performance)
- This POST route creates staff profiles only, NOT login credentials.

## Model Created

### SalonStaff (`src/models/SalonStaff.ts`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| salonId | String | ✅ | Tenant scope |
| staffNo | String | | Auto-generated STF-YYYY-NNNN |
| userId | String | | Optional link to SalonUser |
| name | String | ✅ | |
| email | String | ✅ | |
| phone | String | ✅ | |
| role | String | ✅ | owner/manager/receptionist/stylist/accountant |
| designation | String | ✅ | e.g. "Senior Stylist" |
| status | String | | active/inactive/on_leave |
| employmentType | String | | full_time/part_time/freelance/contract |
| avatar | String | | URL |
| experience | String | | e.g. "5+ Years" |
| specialties | [String] | | |
| assignedServiceIds | [String] | | |
| assignedServiceNames | [String] | | |
| workingDays | [WorkingDay] | | day, isWorking, start/end/break times |
| joiningDate | Date | | |
| address | String | | |
| notes | String | | |
| salary | Number | | Owner-only visible |
| commissionPercent | Number | | 0–100, owner-only visible |
| emergencyContactName | String | | Owner-only visible |
| emergencyContactPhone | String | | Owner-only visible |
| appointmentsToday | Number | | Updated by appointments module later |
| completedServicesThisMonth | Number | | Updated later |
| revenueThisMonth | Number | | Owner-only visible, updated later |
| rating | Number | | 0–5 |

Indexes: `{salonId,phone}`, `{salonId,email}`, `{salonId,role}`, `{salonId,status}`, `{salonId,createdAt}`

## Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/staff` | owner, manager | List with search/role/status/serviceId filters |
| POST | `/api/salon/staff` | owner | Create staff profile |
| GET | `/api/salon/staff/:id` | owner, manager | Get staff detail |
| PATCH | `/api/salon/staff/:id` | owner | Update staff profile |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| List staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| View staff detail | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update staff | ✅ | ❌ | ❌ | ❌ | ❌ |

## Field Visibility by Role

| Field Group | owner | manager |
|-------------|-------|---------|
| Profile (name, email, phone, role, designation) | ✅ | ✅ |
| Schedule (workingDays, status, employmentType) | ✅ | ✅ |
| Services (specialties, assignedServices) | ✅ | ✅ |
| Performance (appointmentsToday, completedServices, rating) | ✅ | ✅ |
| Financial (salary, commissionPercent, revenueThisMonth) | ✅ | ❌ |
| Emergency (emergencyContactName, emergencyContactPhone) | ✅ | ❌ |

## Query Filters
- `search` — matches name, phone, email, designation (case-insensitive)
- `role` — owner/manager/receptionist/stylist/accountant
- `status` — active/inactive/on_leave
- `serviceId` — filter by assigned service
- `page` — default 1
- `limit` — default 20, max 100

## Duplicate Prevention
- On POST: checks for existing staff with same email OR phone within salonId
- On PATCH: if email/phone changes, checks for conflict within same salon

## Response Examples

### GET /api/salon/staff (as manager)
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "...",
        "staffNo": "STF-2026-0001",
        "name": "Ananya Sharma",
        "role": "stylist",
        "designation": "Senior Stylist",
        "status": "active",
        "specialties": ["Hair Styling", "Hair Spa"],
        "appointmentsToday": 3,
        "rating": 4.8
      }
    ],
    "pagination": { "total": 6, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```
Note: salary, commissionPercent, emergencyContact, revenueThisMonth fields are absent for manager.

### POST /api/salon/staff (201)
```json
{
  "success": true,
  "message": "Staff member created successfully.",
  "data": {
    "staffMember": { "id": "...", "staffNo": "STF-2026-0001", ... }
  }
}
```

## Tenant Security
- All queries scoped by `salonId` from `requireSalonUser()`
- `salonId` never taken from request body
- Duplicate checks scoped to same salon
- ObjectId validated before DB query
- No passwordHash or SalonUser credentials exposed

## Files Created
- `src/models/SalonStaff.ts`
- `src/lib/generators/staff-id.ts`
- `src/lib/validators/salon-staff.ts`
- `src/lib/serializers/salon-staff.ts`
- `app/api/salon/staff/route.ts`
- `app/api/salon/staff/[staffId]/route.ts`
- `docs/SALON_API_PHASE_4_STAFF.md`

## Next Phase
Phase 5: Appointments APIs
