# Salon API Phase 3 — Customers

## Model Created

### SalonCustomer (`src/models/SalonCustomer.ts`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| salonId | String | ✅ | Tenant scope |
| customerNo | String | | Auto-generated CUST-YYYY-NNNN |
| name | String | ✅ | 2–100 chars |
| phone | String | ✅ | 7–20 chars |
| email | String | | Lowercase |
| gender | String | | female/male/other/not_specified |
| dateOfBirth | Date | | |
| anniversaryDate | Date | | |
| address | String | | Max 500 chars |
| city | String | | Max 100 chars |
| status | String | ✅ | active/inactive/blocked |
| source | String | | dashboard/website/phone/whatsapp/walk_in/referral |
| favoriteServices | [String] | | |
| preferredStylistId | String | | |
| preferredStylistName | String | | |
| notes | String | | Beauty/service notes |
| allergies | String | | Allergy info |
| hairSkinNotes | String | | Hair/skin notes |
| totalVisits | Number | | Default 0, updated by appointments later |
| totalSpent | Number | | Default 0, updated by billing later |
| dueAmount | Number | | Default 0, updated by billing later |
| lastVisitAt | Date | | Updated by appointments later |
| nextAppointmentAt | Date | | Updated by appointments later |

Indexes: `{salonId,phone}`, `{salonId,email}`, `{salonId,name}`, `{salonId,status}`, `{salonId,source}`, `{salonId,createdAt}`

## Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/customers` | all roles | List with search/status/source filters |
| POST | `/api/salon/customers` | owner, manager, receptionist | Create customer |
| GET | `/api/salon/customers/:id` | all roles | Get customer detail |
| PATCH | `/api/salon/customers/:id` | owner, manager, receptionist | Update customer profile |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| List customers | ✅ | ✅ | ✅ | ✅ | ✅ |
| View customer detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create customer | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update customer | ✅ | ✅ | ✅ | ❌ | ❌ |

## Field Visibility by Role

| Field Group | owner | manager | receptionist | stylist | accountant |
|-------------|-------|---------|--------------|---------|------------|
| Contact (name, phone, email) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profile (gender, dates, city) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Business (totalVisits, lastVisitAt) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Financial (totalSpent, dueAmount) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Beauty notes (notes, allergies, hairSkinNotes) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Preferences (favoriteServices, preferredStylist) | ✅ | ✅ | ✅ | ✅ | ❌ |

**Stylist:** Cannot see financial fields (totalSpent, dueAmount).
**Accountant:** Cannot see beauty-private fields (notes, allergies, hairSkinNotes, favoriteServices, preferredStylist).

## Query Filters
- `search` — matches name, phone, email (case-insensitive)
- `status` — active / inactive / blocked
- `source` — dashboard / website / phone / whatsapp / walk_in / referral
- `page` — default 1
- `limit` — default 20, max 100

## Duplicate Prevention
- On POST: checks for existing customer with same phone + salonId (excluding blocked)
- On PATCH: if phone changes, checks for conflict within same salon

## Customer Number
Auto-generated as `CUST-YYYY-NNNN`, scoped per salon, sequential.

## Business Fields Note
`totalVisits`, `totalSpent`, `dueAmount`, `lastVisitAt`, `nextAppointmentAt` are NOT editable via customer PATCH. They will be updated by future appointments and billing modules.

## Response Examples

### GET /api/salon/customers
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "customers": [
      {
        "id": "...",
        "customerNo": "CUST-2026-0001",
        "name": "Priya Sharma",
        "phone": "9876543210",
        "status": "active",
        "totalVisits": 12,
        ...
      }
    ],
    "pagination": { "total": 8, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

### POST /api/salon/customers (409 duplicate)
```json
{
  "success": false,
  "message": "A customer with phone 9876543210 already exists."
}
```

## Tenant Security
- All queries scoped by `salonId` from `requireSalonUser()`
- `salonId` never taken from request body
- Duplicate checks scoped to same salon
- ObjectId validated before DB query

## Files Created
- `src/models/SalonCustomer.ts`
- `src/lib/generators/customer-id.ts`
- `src/lib/validators/salon-customer.ts`
- `src/lib/serializers/salon-customer.ts`
- `app/api/salon/customers/route.ts`
- `app/api/salon/customers/[customerId]/route.ts`
- `docs/SALON_API_PHASE_3_CUSTOMERS.md`

## Next Phase
Phase 4: Staff APIs
