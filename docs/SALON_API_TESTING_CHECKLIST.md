# Salon API Testing Checklist

## Prerequisites
1. salonbackend running on `http://localhost:3000`
2. MongoDB connected
3. Demo data seeded: `npx tsx src/scripts/seed-salon-demo-data.ts`
4. Demo salon: `SALON-2026-0001`
5. Demo owner: `owner@demo-salon.com` / `Demo@12345`

## Auth Tests
- [ ] POST /auth/login with valid credentials → 200 + cookie set
- [ ] POST /auth/login with wrong password → 401
- [ ] POST /auth/login without x-salon-id → 400
- [ ] GET /auth/me with valid cookie → 200 + user with frontend role
- [ ] GET /auth/me without cookie → 401
- [ ] POST /auth/logout → 200 + cookie cleared

## Tenant Safety Tests
- [ ] Any GET without x-salon-id → 400 "Missing x-salon-id"
- [ ] Any GET with non-existent salon ID → 404
- [ ] Login with token from salon A, x-salon-id of salon B → 403

## Role Access Tests
- [ ] Owner can access all endpoints
- [ ] Manager can list services but NOT create
- [ ] Receptionist can create appointment but NOT access staff
- [ ] Stylist can only see own appointments
- [ ] Accountant can access bills but NOT appointments
- [ ] Stylist cannot access billing/payments → 403
- [ ] Accountant cannot access appointments → 403

## Module Flow Tests

### 1. Services
- [ ] GET /services → list
- [ ] POST /services → create (owner)
- [ ] GET /services/:id → detail
- [ ] PATCH /services/:id → update
- [ ] DELETE /services/:id → soft deactivate

### 2. Packages
- [ ] GET /packages → list
- [ ] POST /packages → create (owner)
- [ ] PATCH /packages/:id → update

### 3. Customers
- [ ] POST /customers → create
- [ ] POST /customers with duplicate phone → 409
- [ ] GET /customers → list with search
- [ ] GET /customers/:id → detail

### 4. Staff
- [ ] POST /staff → create (owner)
- [ ] GET /staff → list
- [ ] GET /staff/:id → detail (manager sees no salary)

### 5. Appointments
- [ ] POST /appointments with serviceIds → create with resolved snapshots
- [ ] POST /appointments with existingCustomerId → customer resolved
- [ ] GET /appointments?date=YYYY-MM-DD → filtered list
- [ ] PATCH /appointments/:id/status → valid transition works
- [ ] PATCH /appointments/:id/status → invalid transition fails
- [ ] Stylist GET /appointments → only sees own assigned

### 6. Enquiries
- [ ] POST /enquiries (public, no auth) → 201
- [ ] GET /enquiries (auth) → list
- [ ] PATCH /enquiries/:id → update status
- [ ] POST /enquiries/:id/notes → add note
- [ ] POST /enquiries/:id/convert-to-appointment → creates customer + appointment

### 7. Billing
- [ ] POST /bills → create with line items
- [ ] GET /bills → list
- [ ] GET /bills/:id → detail with embedded payments
- [ ] POST /bills/:id/payments → record payment
- [ ] Overpayment → 400
- [ ] Payment on cancelled bill → 400
- [ ] Bill status changes: unpaid → partially_paid → paid

### 8. Reports
- [ ] GET /reports/revenue → owner ✅, accountant ✅, manager ❌
- [ ] GET /reports/appointments → owner ✅, manager ✅
- [ ] GET /reports/staff → owner only ✅
- [ ] GET /reports/customers → owner ✅, manager ✅

### 9. Settings
- [ ] GET /settings → auto-creates if missing
- [ ] PATCH /settings → owner only

### 10. Users
- [ ] POST /users → create with password hash
- [ ] GET /users → list (no passwordHash)
- [ ] PATCH /users/:id → update
- [ ] Deactivate last owner → 400

### 11. Inventory
- [ ] POST /inventory/products → create
- [ ] GET /inventory/products → list with summary
- [ ] POST /inventory/adjustments → stock_in increases stock
- [ ] POST /inventory/adjustments → stock_out decreases stock
- [ ] Negative stock adjustment → 400
- [ ] Manager cannot see purchasePrice
