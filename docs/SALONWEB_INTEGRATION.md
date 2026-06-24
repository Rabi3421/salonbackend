# Salonweb Integration Guide

## Architecture

`salonweb` is a separate Next.js frontend project that consumes APIs from `salonbackend`.

```
salonbackend (this project)
├── Backend APIs (/api/salon/*)
├── Superadmin UI (/superadmin/*)
└── Public APIs (/api/enquiries)

salonweb (separate project)
├── Salon website (public pages)
├── Salon dashboard (staff/owner pages)
└── Uses NEXT_PUBLIC_SALON_ID from .env
```

## Tenant Resolution

Every request from `salonweb` to `salonbackend` must include:

```
x-salon-id: SALON-2026-0001
```

The backend validates this using `resolveSalonFromRequest()` which checks:
- Salon exists in database
- `accountStatus` is `active` or `trial` (not cancelled/suspended/expired)

## salonweb .env Configuration

```env
NEXT_PUBLIC_SALON_ID=SALON-2026-0001
NEXT_PUBLIC_API_URL=https://backend.example.com
```

## Available Backend APIs for salonweb

### Currently Implemented
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/salon/enquiries` | x-salon-id | Submit enquiry from salon website |

### Future APIs (not yet built)
- `/api/salon/auth/login` — Salon user authentication
- `/api/salon/auth/me` — Current salon user
- `/api/salon/dashboard/*` — Salon dashboard data
- `/api/salon/appointments/*` — Appointment management
- `/api/salon/customers/*` — Customer management
- `/api/salon/services/*` — Service catalog
- `/api/salon/staff/*` — Staff management

## Security Rules

1. **Superadmin tokens and salon tokens are separate** — never mix them
2. **salonweb must never use superadmin cookies** — different auth flow
3. **x-salon-id header** is required for all `/api/salon/*` routes
4. Future authenticated salon APIs should verify:
   - Salon token is valid
   - Token's salonId matches `x-salon-id` header
   - User belongs to the salon
   - User's role has permission for the action
5. **Module access control**: check salon's subscription plan modules before allowing feature access

## CORS Configuration

If `salonweb` runs on a different domain than `salonbackend`:
- Configure CORS headers on `/api/salon/*` and `/api/enquiries` routes
- Allow `x-salon-id` as a custom header
- Restrict allowed origins to known salonweb domains

## Public Website APIs

Public salon website pages (services, about, contact) should:
- Check `websiteStatus === "active"` before serving content
- Respect `maintenanceMode` from platform settings
- Use the public enquiry endpoint for contact forms
