# Salon API Audit

## Existing Models (9)

| Model | File | Purpose |
|-------|------|---------|
| Salon | `src/models/Salon.ts` | Salon tenant record (salonId, name, owner, status, plan) |
| SalonUser | `src/models/SalonUser.ts` | Salon staff users (salonId, email, passwordHash, role) |
| Plan | `src/models/Plan.ts` | Subscription plans (features, pricing, modules) |
| Subscription | `src/models/Subscription.ts` | Salon-plan assignments (dates, status) |
| Payment | `src/models/Payment.ts` | Platform subscription payments (NOT salon billing) |
| Enquiry | `src/models/Enquiry.ts` | Website/platform enquiries (contact, demo, appointment requests) |
| AuditLog | `src/models/AuditLog.ts` | System audit trail (actor, action, entity, before/after) |
| PlatformSettings | `src/models/PlatformSettings.ts` | Platform-wide settings (key-value) |
| Superadmin | `src/models/Superadmin.ts` | Superadmin users (email, passwordHash, role) |

## Existing Salon User Roles (Backend)

Defined in `src/constants/salon.ts` as `SALON_USER_ROLES`:
- `salon_owner` — maps to frontend `owner`
- `salon_admin` — maps to frontend `manager` (or separate admin role)
- `manager` — maps to frontend `manager`
- `receptionist` — maps to frontend `receptionist`
- `stylist` — maps to frontend `stylist`
- `cashier` — maps to frontend `accountant`

**IMPORTANT ROLE MAPPING:**
The frontend uses `owner/manager/receptionist/stylist/accountant`.
The backend uses `salon_owner/salon_admin/manager/receptionist/stylist/cashier`.
The salon auth API must translate between these when returning user data to the frontend.

## Existing API Routes

### A. Superadmin APIs (under `/api/superadmin/`)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/superadmin/auth/login` | POST | Superadmin login |
| `/api/superadmin/auth/logout` | POST | Superadmin logout |
| `/api/superadmin/auth/me` | GET | Current superadmin |
| `/api/superadmin/dashboard/overview` | GET | Platform overview stats |
| `/api/superadmin/salons` | GET, POST | List/create salons |
| `/api/superadmin/salons/[salonId]` | GET, PATCH | Get/update salon |
| `/api/superadmin/salons/[salonId]/status` | PATCH | Update salon status |
| `/api/superadmin/salons/[salonId]/users` | GET, POST | List/create salon users |
| `/api/superadmin/salons/[salonId]/users/[userId]/reset-password` | POST | Reset salon user password |
| `/api/superadmin/plans` | GET, POST | List/create plans |
| `/api/superadmin/plans/[planCode]` | GET, PATCH | Get/update plan |
| `/api/superadmin/plans/seed` | POST | Seed default plans |
| `/api/superadmin/subscriptions` | GET, POST | List/create subscriptions |
| `/api/superadmin/subscriptions/[subscriptionId]` | GET, PATCH | Get/update subscription |
| `/api/superadmin/subscriptions/[subscriptionId]/renew` | POST | Renew subscription |
| `/api/superadmin/subscriptions/[subscriptionId]/cancel` | POST | Cancel subscription |
| `/api/superadmin/subscriptions/[subscriptionId]/change-plan` | POST | Change plan |
| `/api/superadmin/subscriptions/[subscriptionId]/payments` | GET | List subscription payments |
| `/api/superadmin/subscriptions/check-expired` | POST | Check expired subscriptions |
| `/api/superadmin/payments` | GET, POST | List/create platform payments |
| `/api/superadmin/payments/[paymentId]` | GET, PATCH | Get/update payment |
| `/api/superadmin/payments/[paymentId]/mark-paid` | POST | Mark payment paid |
| `/api/superadmin/payments/[paymentId]/refund` | POST | Refund payment |
| `/api/superadmin/enquiries` | GET | List enquiries |
| `/api/superadmin/enquiries/[enquiryId]` | GET, PATCH | Get/update enquiry |
| `/api/superadmin/enquiries/[enquiryId]/status` | PATCH | Update enquiry status |
| `/api/superadmin/enquiries/[enquiryId]/notes` | POST | Add internal note |
| `/api/superadmin/audit-logs` | GET | List audit logs |
| `/api/superadmin/audit-logs/[auditLogId]` | GET | Get audit log detail |
| `/api/superadmin/settings` | GET, PATCH | Get/update platform settings |
| `/api/superadmin/settings/reset` | POST | Reset to defaults |
| `/api/superadmin/reports/overview` | GET | Platform overview report |
| `/api/superadmin/reports/salons` | GET | Salon report |
| `/api/superadmin/reports/subscriptions` | GET | Subscription report |
| `/api/superadmin/reports/payments` | GET | Payment report |
| `/api/superadmin/reports/revenue` | GET | Revenue report |
| `/api/superadmin/reports/plans` | GET | Plan report |
| `/api/superadmin/reports/enquiries` | GET | Enquiry report |

### B. Public APIs

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/enquiries` | POST | Platform enquiry from public website |

### C. Existing Salon APIs

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/salon/enquiries` | POST | Salon-scoped enquiry from salon website |

## Existing Helpers Reusable for Salon APIs

| Helper | File | Reuse For |
|--------|------|-----------|
| `resolveSalonFromRequest()` | `src/lib/tenant/resolve-salon.ts` | All salon API routes — validates x-salon-id |
| `successResponse()` / `errorResponse()` | `src/lib/api-response.ts` | All API responses |
| `connectDB()` | `src/lib/db.ts` | All DB operations |
| `createAuditLog()` | `src/lib/audit-log.ts` | Audit trail for mutations |
| `hashPassword()` / `comparePassword()` | `src/lib/auth/superadmin-auth.ts` | User password handling (reuse bcrypt logic) |
| `getServerEnv()` | `src/lib/env.ts` | Access SALON_JWT_SECRET |
| ID generators | `src/lib/generators/*.ts` | Generate IDs (extend for new entities) |

## Missing Models Required (10)

| Model | Purpose |
|-------|---------|
| SalonAppointment | Appointment bookings |
| SalonCustomer | Customer profiles with visit history |
| SalonService | Service catalog (name, price, duration, category) |
| SalonPackage | Service bundles (name, price, included services) |
| SalonStaff | Staff profiles (extends SalonUser with schedule/services) |
| SalonBill | Billing invoices (line items, totals, status) |
| SalonBillPayment | Bill payment records (method, amount) |
| SalonInventoryProduct | Inventory products (stock, pricing, supplier) |
| SalonStockAdjustment | Stock movement records |
| SalonSettings | Per-salon configuration (business info, booking prefs, notifications) |

**Note:** SalonStaff may be a virtual model built on top of SalonUser + staff-specific fields, or a separate collection. Decision to be made in implementation.

## Missing APIs Required (46 endpoints)

See `docs/SALON_API_IMPLEMENTATION_PLAN.md` for the complete list grouped by phase.
