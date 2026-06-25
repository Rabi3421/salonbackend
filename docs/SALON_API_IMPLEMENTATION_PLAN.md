# Salon API Implementation Plan

## Phase Order & Rationale

APIs must be built in dependency order. Services/packages come before appointments (appointments reference services). Customers come before billing (bills reference customers). Staff comes before appointments (appointments reference stylists).

---

## Phase 1 — Salon Auth + Tenant Middleware

**Why first:** Every other API depends on authenticated salon user context.

**Work:**
- Create `src/lib/auth/salon-auth.ts` with `signSalonToken()`, `verifySalonToken()`, `getSalonUserFromRequest()`
- Add `SALON_COOKIE_NAME` constant
- Create role permission helper: `hasPermission(role, action)`
- Role mapping: `salon_owner` → `owner`, `cashier` → `accountant` for frontend responses

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/salon/auth/login` | Email/password login, set httpOnly cookie |
| POST | `/api/salon/auth/logout` | Clear cookie |
| GET | `/api/salon/auth/me` | Return current user (role mapped to frontend name) |

**Models:** None new — uses existing `SalonUser`.

---

## Phase 2 — Services + Packages

**Why second:** Appointments, billing, and packages all reference services.

**New models:** `SalonService`, `SalonPackage`

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/services` | List services (filter by category, status) |
| POST | `/api/salon/services` | Create service (owner only) |
| GET | `/api/salon/services/[serviceId]` | Get service detail |
| PATCH | `/api/salon/services/[serviceId]` | Update service (owner only) |
| DELETE | `/api/salon/services/[serviceId]` | Soft delete / deactivate service |
| GET | `/api/salon/packages` | List packages |
| POST | `/api/salon/packages` | Create package (owner only) |
| GET | `/api/salon/packages/[packageId]` | Get package detail |
| PATCH | `/api/salon/packages/[packageId]` | Update package (owner only) |
| DELETE | `/api/salon/packages/[packageId]` | Soft delete / deactivate package |

---

## Phase 3 — Customers

**Why third:** Appointments and billing reference customers.

**New model:** `SalonCustomer`

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/customers` | List customers (search, status filter) |
| POST | `/api/salon/customers` | Create customer |
| GET | `/api/salon/customers/[customerId]` | Get customer detail with visits |
| PATCH | `/api/salon/customers/[customerId]` | Update customer |

---

## Phase 4 — Staff

**Why fourth:** Appointments reference assigned stylists.

**New model:** `SalonStaff` (or extend SalonUser with staff-specific fields)

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/staff` | List staff members |
| POST | `/api/salon/staff` | Create staff member (owner only) |
| GET | `/api/salon/staff/[staffId]` | Get staff detail |
| PATCH | `/api/salon/staff/[staffId]` | Update staff member |

---

## Phase 5 — Appointments

**Why fifth:** Depends on services, customers, and staff.

**New model:** `SalonAppointment`

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/appointments` | List appointments (date, status, stylist filters) |
| POST | `/api/salon/appointments` | Create appointment |
| GET | `/api/salon/appointments/[appointmentId]` | Get appointment detail |
| PATCH | `/api/salon/appointments/[appointmentId]/status` | Update appointment status |

---

## Phase 6 — Enquiries (Salon Dashboard)

**Why sixth:** Independent module; existing Enquiry model has `salonId` field.

**No new model** — reuse existing `Enquiry` model, filtered by `salonId`.

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/enquiries` | List salon's enquiries (already have POST) |
| GET | `/api/salon/enquiries/[enquiryId]` | Get enquiry detail |
| PATCH | `/api/salon/enquiries/[enquiryId]` | Update status/notes/assignment |

**Note:** `POST /api/salon/enquiries` already exists for website form submission.

---

## Phase 7 — Billing + Payments

**Why seventh:** Depends on services, customers, staff.

**New models:** `SalonBill`, `SalonBillPayment`

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/bills` | List bills (status, date, customer filters) |
| POST | `/api/salon/bills` | Create bill with line items |
| GET | `/api/salon/bills/[billId]` | Get bill detail |
| PATCH | `/api/salon/bills/[billId]` | Update bill (status, payment) |
| GET | `/api/salon/payments` | List salon bill payments |
| POST | `/api/salon/payments` | Record a payment |

---

## Phase 8 — Dashboard Overview

**Why eighth:** Aggregates data from appointments, customers, billing, etc.

**No new model.**

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/dashboard/overview` | Role-aware overview stats |

---

## Phase 9 — Reports

**Why ninth:** Aggregation queries across all modules.

**No new model.**

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/reports/revenue` | Revenue report |
| GET | `/api/salon/reports/appointments` | Appointment analytics |
| GET | `/api/salon/reports/staff` | Staff performance |
| GET | `/api/salon/reports/customers` | Customer insights |

---

## Phase 10 — Settings + Users

**Why tenth:** Independent admin module.

**New model:** `SalonSettings`

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/settings` | Get salon settings |
| PATCH | `/api/salon/settings` | Update salon settings |
| GET | `/api/salon/users` | List salon users |
| POST | `/api/salon/users` | Create salon user (owner only) |
| GET | `/api/salon/users/[userId]` | Get user detail |
| PATCH | `/api/salon/users/[userId]` | Update user (toggle status, reset password) |

---

## Phase 11 — Inventory

**Why eleventh:** Independent module, lowest priority.

**New models:** `SalonInventoryProduct`, `SalonStockAdjustment`

**APIs:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salon/inventory/products` | List inventory products |
| POST | `/api/salon/inventory/products` | Create product (owner only) |
| GET | `/api/salon/inventory/products/[productId]` | Get product detail |
| PATCH | `/api/salon/inventory/products/[productId]` | Update product |
| POST | `/api/salon/inventory/adjustments` | Record stock adjustment |

---

## Phase 12 — Final QA + Seed Data

**Work:**
- Seed script for demo salon with sample data across all modules
- API test checklist for every endpoint
- CORS configuration for salonweb origin
- Rate limiting considerations
- Error handling audit

---

## Total: 46 new API endpoints across 12 phases
## Total new models: 10
## Reusable existing infrastructure: 7+ helpers
