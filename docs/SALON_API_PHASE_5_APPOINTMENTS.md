# Salon API Phase 5 — Appointments

## Model Created

### SalonAppointment (`src/models/SalonAppointment.ts`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| salonId | String | ✅ | Tenant scope |
| appointmentNo | String | ✅ | Auto-generated APT-YYYY-NNNN |
| customer | Subdoc | ✅ | { id, name, phone, email } snapshot |
| services | [Subdoc] | ✅ | [{ id, name, price, duration, category }] |
| stylist | Subdoc | | { id, name, role, avatar } snapshot |
| date | Date | ✅ | Appointment date |
| startTime | String | ✅ | HH:mm format |
| endTime | String | | Auto-calculated |
| status | String | ✅ | 7 statuses |
| source | String | | 5 sources |
| totalAmount | Number | | Server-calculated from services |
| paidAmount | Number | | Default 0 |
| billId | String | | Future billing link |
| notes | String | | Client-visible notes |
| internalNotes | String | | Staff-only notes |
| createdBy | String | | User name who created |
| updatedBy | String | | Last update user |
| statusHistory | [Subdoc] | | [{ status, note, changedBy, changedAt }] |

Indexes: `{salonId,date}`, `{salonId,status}`, `{salonId,"customer.phone"}`, `{salonId,"stylist.id"}`, `{salonId,createdAt}`, `{salonId,appointmentNo}`

## Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/appointments` | owner, manager, receptionist, stylist | List with filters |
| POST | `/api/salon/appointments` | owner, manager, receptionist | Create appointment |
| GET | `/api/salon/appointments/:id` | owner, manager, receptionist, stylist | Get detail |
| PATCH | `/api/salon/appointments/:id` | owner, manager, receptionist | Update appointment |
| PATCH | `/api/salon/appointments/:id/status` | owner, manager, receptionist, stylist | Change status |

## Status Flow

```
requested → confirmed → checked_in → in_service → completed
     ↓           ↓            ↓
  cancelled   cancelled    cancelled
              no_show
```

### Transitions by Role

| Current → Next | owner/manager/receptionist | stylist |
|---------------|---------------------------|---------|
| requested → confirmed | ✅ | ❌ |
| requested → cancelled | ✅ | ❌ |
| confirmed → checked_in | ✅ | ❌ |
| confirmed → cancelled | ✅ | ❌ |
| confirmed → no_show | ✅ | ❌ |
| confirmed → in_service | ✅ | ✅ |
| checked_in → in_service | ✅ | ✅ |
| checked_in → cancelled | ✅ | ❌ |
| in_service → completed | ✅ | ✅ |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| List | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| Create | ✅ | ✅ | ✅ | ❌ | ❌ |
| View detail | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| Update fields | ✅ | ✅ | ✅ | ❌ | ❌ |
| Change status | ✅ | ✅ | ✅ | ✅ (own, limited) | ❌ |

## Stylist Own-Appointment Restriction

Stylists can only see and act on appointments where `stylist.id` matches their user ID or `stylist.name` matches their user name. This is enforced in:
- GET list: filter query adds `$or` condition matching stylist.id or stylist.name
- GET detail: checked after fetch
- PATCH status: checked before transition

**Limitation:** Since SalonStaff and SalonUser may not be linked by userId yet, matching uses both ID and name as fallback.

## Create Behavior

1. Resolve customer from `existingCustomerId` (fetches from SalonCustomer) or inline `customerName/Phone/Email`
2. Resolve services from `serviceIds` (fetches active SalonService records) or inline `services` array
3. Resolve stylist from `stylistId` (fetches active SalonStaff)
4. Calculate `totalAmount` from service prices (server-side)
5. Calculate `endTime` from startTime + total service duration
6. Generate `appointmentNo` per salon
7. Add initial `statusHistory` entry

Customers are NOT auto-created in this phase.

## Query Filters
- `date` — single date filter (finds appointments on that day)
- `status` — appointment status
- `stylistId` — stylist.id match
- `search` — matches customer.name, customer.phone, services.name, appointmentNo
- `page` / `limit` — pagination

## Field Visibility

| Field | owner/manager/receptionist | stylist |
|-------|---------------------------|---------|
| All standard fields | ✅ | ✅ |
| paidAmount, billId | ✅ | ❌ |
| internalNotes | ✅ | ❌ |

## Files Created
- `src/models/SalonAppointment.ts`
- `src/lib/generators/appointment-id.ts`
- `src/lib/validators/salon-appointment.ts`
- `src/lib/serializers/salon-appointment.ts`
- `src/lib/appointments/appointment-utils.ts`
- `app/api/salon/appointments/route.ts`
- `app/api/salon/appointments/[appointmentId]/route.ts`
- `app/api/salon/appointments/[appointmentId]/status/route.ts`
- `docs/SALON_API_PHASE_5_APPOINTMENTS.md`

## Next Phase
Phase 6: Enquiries dashboard APIs (GET list/detail + PATCH)
