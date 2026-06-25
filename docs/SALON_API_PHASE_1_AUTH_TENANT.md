# Salon API Phase 1 — Auth + Tenant Foundation

## Files Created

### Auth Helpers
- `src/lib/auth/salon-auth.ts` — JWT sign/verify, cookie name, token extraction
- `src/lib/auth/salon-permissions.ts` — Role mapping, module access, user sanitization
- `src/lib/auth/require-salon-user.ts` — Unified auth guard for all future salon API routes

### API Routes
- `app/api/salon/auth/login/route.ts` — POST salon user login
- `app/api/salon/auth/logout/route.ts` — POST salon user logout
- `app/api/salon/auth/me/route.ts` — GET current salon user

## Auth Endpoints

### POST /api/salon/auth/login
- **Headers:** `x-salon-id` (required)
- **Body:** `{ email, password }`
- **Response:** `{ user: { id, name, email, phone, role, salonId }, salon }`
- **Cookie set:** `salon_access_token` (httpOnly, 7 days)
- **Role returned:** Frontend-mapped role (owner/manager/receptionist/stylist/accountant)

### POST /api/salon/auth/logout
- **Headers:** `x-salon-id` (optional)
- **Response:** `{ success: true, message: "Logged out successfully." }`
- **Cookie cleared:** `salon_access_token` (maxAge: 0)

### GET /api/salon/auth/me
- **Headers:** `x-salon-id` (required), `Cookie: salon_access_token`
- **Response:** `{ user: { id, name, email, phone, role, salonId, isActive } }`

## Cookie Name
`salon_access_token` — separate from superadmin's `superadmin_token`

## Role Mapping (Backend → Frontend)

| Backend (DB) | Frontend (API response) |
|-------------|------------------------|
| salon_owner | owner |
| salon_admin | manager |
| manager | manager |
| receptionist | receptionist |
| stylist | stylist |
| cashier | accountant |

## Tenant Validation Flow

1. Every `/api/salon/*` authenticated route calls `requireSalonUser(request)`
2. `requireSalonUser` calls `resolveSalonFromRequest(request)` which reads `x-salon-id` header
3. Salon must exist and have `accountStatus` of `active` or `trial`
4. JWT token is extracted from cookie or Authorization Bearer header
5. Token is verified using `SALON_JWT_SECRET`
6. Token's `salonId` must match the `x-salon-id` header (prevents cross-tenant access)
7. User is fetched from DB by `userId + salonId` (double-scoped)
8. User must be active
9. Role is mapped to frontend name
10. Allowed roles are checked if specified

## Permission Helper Summary

Module access matrix defined in `salon-permissions.ts`:
- **auth/overview:** All authenticated roles
- **services:** owner, manager, receptionist, stylist
- **packages:** owner, manager, receptionist
- **customers:** All roles
- **appointments:** owner, manager, receptionist, stylist
- **staff/users:** owner, manager
- **billing/payments:** owner, manager, receptionist, accountant
- **enquiries:** owner, manager, receptionist
- **reports:** owner, manager, accountant
- **settings:** owner, manager, receptionist, accountant
- **inventory:** owner, manager, accountant

## Existing Routes Unchanged
- `POST /api/salon/enquiries` — Public salon enquiry (no auth required, tenant-resolved)
- All superadmin APIs — Untouched
- Middleware — Only matches `/superadmin/*`, does not intercept `/api/salon/*`

## Frontend Integration Notes (salonweb)
- salonweb's `api-client.ts` sends `x-salon-id` header and `credentials: 'include'` — compatible
- salonweb's `dashboard-auth.ts` calls `POST /api/salon/auth/login`, `POST /api/salon/auth/logout`, `GET /api/salon/auth/me` — all now implemented
- Role keys in response match salonweb's `SalonRole` type: owner/manager/receptionist/stylist/accountant

## Next Phase
Phase 2: Services + Packages APIs (models + CRUD endpoints)
