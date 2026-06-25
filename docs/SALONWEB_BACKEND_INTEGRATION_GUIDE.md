# Salonweb ↔ Salonbackend Integration Guide

## Setup

### 1. Start salonbackend
```bash
cd salonbackend
npm run dev    # runs on http://localhost:3000
```

### 2. Seed demo data
```bash
npx tsx src/scripts/seed-salon-demo-data.ts
```

### 3. Configure salonweb `.env.local`
```env
NEXT_PUBLIC_APP_NAME=Rosé Luxe Salon
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SALON_ID=SALON-2026-0001
NEXT_PUBLIC_SITE_URL=http://localhost:4028
NEXT_PUBLIC_ENABLE_DASHBOARD_MOCKS=false
```

### 4. Start salonweb
```bash
cd salonweb
npm run dev -- -p 4028    # runs on http://localhost:4028
```

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@demo-salon.com` | `Demo@12345` |

Create additional users via the dashboard Users page after logging in as owner.

## Testing Order
1. Open `http://localhost:4028/login`
2. Enter owner credentials
3. Verify dashboard overview loads with real data
4. Navigate to each module: Appointments → Customers → Services → Staff → Billing → Enquiries → Reports → Settings → Users → Inventory
5. Test create/edit actions

## Switching Mock Mode
- **Mock ON:** Set `NEXT_PUBLIC_ENABLE_DASHBOARD_MOCKS=true` in `.env.local`, restart salonweb
- **Mock OFF:** Set `NEXT_PUBLIC_ENABLE_DASHBOARD_MOCKS=false`, restart salonweb

When mock mode is OFF, all data comes from salonbackend APIs.

## Common Issues

### CORS errors
salonbackend's `next.config.ts` has CORS headers for `http://localhost:4028`. If salonweb runs on a different port, update the `Access-Control-Allow-Origin` value.

### Cookie not set
Login succeeds but `/auth/me` returns 401:
- Ensure `credentials: 'include'` in salonweb's api-client (already set)
- Ensure salonbackend cookie `sameSite: 'lax'` (already set)
- In dev, `secure: false` (already set for non-production)
- Both apps must be on `localhost` (not IP)

### Missing x-salon-id
All salon API calls require `x-salon-id` header. salonweb's api-client sends it automatically from `NEXT_PUBLIC_SALON_ID`.

### Wrong Salon ID
If `NEXT_PUBLIC_SALON_ID` doesn't match any salon in MongoDB, all API calls return 404.

### No seeded user
Login will fail if the demo user doesn't exist. Run the seed script first.

### Browser extensions
Some browser extensions (QuillBot, Grammarly) intercept `fetch` and can cause errors. Test in incognito if you see unexpected fetch errors.
