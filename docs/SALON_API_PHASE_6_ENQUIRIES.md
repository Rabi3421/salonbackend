# Salon API Phase 6 — Enquiries Dashboard

## Existing Public Route Preserved
`POST /api/salon/enquiries` remains **public** (no auth required). Website enquiry forms continue to work unchanged.

## Model Changes
Extended `Enquiry` model with optional dashboard fields (no existing fields removed):

| New Field | Type | Notes |
|-----------|------|-------|
| preferredService | String | From enquiry form |
| preferredDate | Date | |
| preferredTime | String | |
| nextFollowUpAt | Date | Dashboard follow-up scheduling |
| convertedCustomerId | String | Link to created customer |
| convertedAppointmentId | String | Link to created appointment |

Extended enums (backwards compatible):
- **Statuses:** added `contacted`, `follow_up`, `converted`, `lost` (existing `new/in_progress/resolved/closed/spam` preserved)
- **Priorities:** added `normal` (existing `low/medium/high/urgent` preserved)
- **Types:** added `package_interest`, `bridal_enquiry` (existing types preserved)

## Endpoints

| Method | Endpoint | Auth | Access | Purpose |
|--------|----------|------|--------|---------|
| GET | `/api/salon/enquiries` | ✅ | owner, manager, receptionist | Dashboard enquiry list |
| POST | `/api/salon/enquiries` | ❌ | public | Website enquiry submission |
| GET | `/api/salon/enquiries/:id` | ✅ | owner, manager, receptionist | Enquiry detail |
| PATCH | `/api/salon/enquiries/:id` | ✅ | owner, manager, receptionist | Update status/priority/assignment/note |
| POST | `/api/salon/enquiries/:id/notes` | ✅ | owner, manager, receptionist | Add follow-up note |
| POST | `/api/salon/enquiries/:id/convert-to-appointment` | ✅ | owner, manager, receptionist | Convert to customer/appointment |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| List enquiries | ✅ | ✅ | ✅ | ❌ | ❌ |
| View detail | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add note | ✅ | ✅ | ✅ | ❌ | ❌ |
| Convert | ✅ | ✅ | ✅ | ❌ | ❌ |

## Status Flow
```
new → contacted / follow_up / in_progress / closed / lost / spam
contacted → follow_up / converted / closed / lost
follow_up → contacted / converted / closed / lost
in_progress → contacted / follow_up / converted / resolved / closed / lost
closed → follow_up (reopen)
lost → follow_up (reopen)
converted → (terminal)
```

## Follow-Up Notes
Two supported methods:
1. **PATCH** `/api/salon/enquiries/:id` with `note` field — appends to `internalNotes` alongside status/priority updates
2. **POST** `/api/salon/enquiries/:id/notes` — dedicated note endpoint with optional `nextFollowUpAt` and `statusAfterNote`

Note structure (uses existing `internalNotes` array): `{ note, addedBy, addedByEmail, addedAt }`

## Convert-to-Appointment/Customer

**POST** `/api/salon/enquiries/:id/convert-to-appointment`

Payload: `{ createCustomer, createAppointment, serviceName?, appointmentDate?, appointmentTime?, stylistId?, notes? }`

Behavior:
1. If `createCustomer: true` — checks for existing customer by phone+salonId; reuses if found, creates new SalonCustomer otherwise
2. If `createAppointment: true` — creates SalonAppointment with customer snapshot, service snapshot (from serviceName or "Consultation"), requested status
3. Updates enquiry status to `converted`, stores `convertedCustomerId` and `convertedAppointmentId`
4. Returns `{ enquiry, customer, appointment }`

No duplicate customers created for same phone within salon.

## Query Filters
- `search` — name, phone, email, message
- `type` — enquiry type
- `status` — enquiry status
- `priority` — priority level
- `source` — source channel
- `dateFrom` / `dateTo` — creation date range
- `page` / `limit` — pagination

## Files Created/Changed
- `src/models/Enquiry.ts` — added optional fields + extended enums
- `src/constants/enquiry.ts` — added new status/type/priority values
- `src/lib/enquiries/enquiry-utils.ts` — status transition helper
- `src/lib/validators/salon-enquiry-dashboard.ts` — update/note/convert validation
- `src/lib/serializers/salon-enquiry.ts` — response shaping
- `app/api/salon/enquiries/route.ts` — added GET (kept POST public)
- `app/api/salon/enquiries/[enquiryId]/route.ts` — GET + PATCH
- `app/api/salon/enquiries/[enquiryId]/notes/route.ts` — POST add note
- `app/api/salon/enquiries/[enquiryId]/convert-to-appointment/route.ts` — POST convert
- `docs/SALON_API_PHASE_6_ENQUIRIES.md`

## Next Phase
Phase 7: Billing + Payments APIs
