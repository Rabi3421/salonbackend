# SalonBackend — Multi-Tenant Salon Management Platform

Central backend and superadmin dashboard for the Rabivio Salon Management System.

## Architecture

This project contains **backend APIs** and **superadmin UI** only. Individual salon frontend belongs to the separate `salonweb` project.

```
salonbackend (this project)
├── Superadmin dashboard UI     (/superadmin/*)
├── Superadmin APIs             (/api/superadmin/*)
├── Public APIs                 (/api/enquiries)
├── Salon backend APIs          (/api/salon/*)
├── Database models             (src/models/*)
├── Business logic helpers      (src/lib/*)
└── Reports & analytics         (/api/superadmin/reports/*)

salonweb (separate project)
├── Salon public website
├── Salon owner/staff dashboard
└── Consumes salonbackend APIs via x-salon-id header
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB with Mongoose
- **Auth:** JWT with httpOnly cookies
- **Styling:** Tailwind CSS
- **Language:** TypeScript (strict mode)

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in actual values (see docs/ENV_SETUP.md)

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## Superadmin Access

- **Login URL:** `http://localhost:3000/superadmin/login`
- Default superadmin is auto-created on first login using env credentials
- After login, access the full dashboard at `/superadmin/dashboard`

## Key Features

- Salon onboarding with auto-generated IDs and slugs
- Plan & module management with seed defaults
- Subscription lifecycle (assign, renew, change plan, cancel, expire check)
- Platform payment tracking (create, mark paid, refund)
- Enquiry & lead management with internal notes
- Reports & analytics with date range filtering
- Full audit log with sensitive data sanitization
- Platform settings management

## Documentation

- [Route Inventory](docs/SUPERADMIN_ROUTES.md)
- [Environment Setup](docs/ENV_SETUP.md)
- [API Testing Checklist](docs/SUPERADMIN_API_TESTING_CHECKLIST.md)
- [Frontend QA Checklist](docs/SUPERADMIN_FRONTEND_QA_CHECKLIST.md)
- [Production Readiness](docs/PRODUCTION_READINESS.md)
- [Salonweb Integration](docs/SALONWEB_INTEGRATION.md)

## Scope Note

This project contains backend APIs and superadmin UI only. Individual salon frontend (website, dashboard, appointments, customers, POS, services, staff) belongs to the separate `salonweb` project.
