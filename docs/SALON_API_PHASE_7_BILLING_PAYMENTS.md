# Salon API Phase 7 — Billing + Payments

## Models Created

### SalonBill (`src/models/SalonBill.ts`)
| Field | Type | Notes |
|-------|------|-------|
| salonId | String | Tenant scope |
| billNo | String | Auto-generated BILL-YYYY-NNNN |
| source | String | appointment / walk_in / manual |
| customer | Subdoc | { id, name, phone, email } |
| items | [LineItem] | [{ id, type, name, quantity, unitPrice, discount, taxRate, total }] |
| appointmentId | String | Link to appointment |
| subtotal | Number | Sum of qty × unitPrice |
| discountTotal | Number | Bill-level discount |
| taxTotal | Number | Bill-level tax |
| grandTotal | Number | Server-calculated |
| paidAmount | Number | Updated on payment |
| dueAmount | Number | grandTotal - paidAmount |
| paymentMode | String | Last payment mode |
| status | String | unpaid / partially_paid / paid / cancelled / refunded |
| notes | String | |
| createdBy, updatedBy | String | |
| cancelledAt, cancelledBy, cancelReason | | Cancel audit |

### SalonBillPayment (`src/models/SalonBillPayment.ts`)
| Field | Type | Notes |
|-------|------|-------|
| salonId | String | Tenant scope |
| paymentNo | String | Auto-generated PAY-YYYY-NNNN |
| billId | String | Link to bill |
| billNo | String | Denormalized for search |
| customerName, customerPhone | String | Denormalized |
| amount | Number | Payment amount |
| mode | String | cash / upi / card / bank_transfer / wallet / other |
| status | String | completed / pending / failed / refunded |
| paidAt | Date | |
| referenceNo | String | Transaction reference |
| collectedBy, collectedByName | String | Who collected |
| notes | String | |

## Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/bills` | owner, manager, receptionist, accountant | List bills |
| POST | `/api/salon/bills` | owner, receptionist, accountant | Create bill |
| GET | `/api/salon/bills/:id` | owner, manager, receptionist, accountant | Bill detail + payments |
| PATCH | `/api/salon/bills/:id` | owner, accountant | Update notes / cancel |
| POST | `/api/salon/bills/:id/payments` | owner, receptionist, accountant | Record payment |
| GET | `/api/salon/payments` | owner, manager, receptionist, accountant | List all payments |
| POST | `/api/salon/payments` | owner, receptionist, accountant | Record payment (with billId) |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| List bills | ✅ | ✅ | ✅ | ❌ | ✅ |
| Create bill | ✅ | ❌ | ✅ | ❌ | ✅ |
| View bill detail | ✅ | ✅ | ✅ | ❌ | ✅ |
| Cancel bill | ✅ | ❌ | ❌ | ❌ | ✅ |
| Record payment | ✅ | ❌ | ✅ | ❌ | ✅ |
| List payments | ✅ | ✅ | ✅ | ❌ | ✅ |
| Create payment | ✅ | ❌ | ✅ | ❌ | ✅ |

## Bill Status Logic
- `paidAmount = 0` → `unpaid`
- `0 < paidAmount < grandTotal` → `partially_paid`
- `paidAmount >= grandTotal` → `paid`
- Manual cancel via PATCH (not if paid/refunded)

## Payment Flow
1. Create bill with line items → server calculates totals → status `unpaid`
2. Record payment → validates amount ≤ dueAmount → creates SalonBillPayment → updates bill paidAmount/dueAmount/status
3. Overpayment rejected with readable error
4. Cancelled/refunded bills cannot accept payments

## Side Effects
- **Appointment:** When payment recorded and bill has `appointmentId`, updates appointment's `billId` and `paidAmount`
- **Customer totals:** NOT updated in this phase to avoid double-counting. Will be handled by reports/aggregation later.

## Platform vs Salon Payments
- `Payment` model = platform subscription payments (superadmin)
- `SalonBillPayment` model = salon service billing payments (salon dashboard)
- These are completely separate collections with no cross-reference.

## Query Filters
### Bills
- `search` — billNo, customer.name, customer.phone
- `status` — bill status
- `dateFrom` / `dateTo` — creation date range
- `page` / `limit`

### Payments
- `search` — paymentNo, billNo, customerName, customerPhone
- `mode` — payment mode
- `status` — payment status
- `dateFrom` / `dateTo` — paidAt date range
- `page` / `limit`

## Files Created
- `src/models/SalonBill.ts`
- `src/models/SalonBillPayment.ts`
- `src/lib/generators/bill-id.ts` — generateBillNo() + generatePaymentNo()
- `src/lib/validators/salon-billing.ts`
- `src/lib/serializers/salon-billing.ts`
- `src/lib/billing/billing-utils.ts`
- `app/api/salon/bills/route.ts`
- `app/api/salon/bills/[billId]/route.ts`
- `app/api/salon/bills/[billId]/payments/route.ts`
- `app/api/salon/payments/route.ts`
- `docs/SALON_API_PHASE_7_BILLING_PAYMENTS.md`

## Next Phase
Phase 8: Dashboard Overview API
