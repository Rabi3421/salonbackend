# Salon API Production Readiness

## Required Environment Variables
```env
MONGODB_URI=mongodb+srv://...
SUPERADMIN_JWT_SECRET=<random-32+-chars>
SALON_JWT_SECRET=<random-32+-chars-different-from-superadmin>
SUPERADMIN_NAME=...
SUPERADMIN_EMAIL=...
SUPERADMIN_PHONE=...
SUPERADMIN_PASSWORD=...
NODE_ENV=production
```

## JWT Secret Checklist
- [ ] SUPERADMIN_JWT_SECRET is unique, ≥32 characters, not shared
- [ ] SALON_JWT_SECRET is unique, ≥32 characters, different from superadmin
- [ ] Neither secret is committed to git
- [ ] Secrets rotated from development values

## Cookie Security
- `httpOnly: true` — prevents JavaScript access
- `sameSite: 'lax'` — CSRF protection
- `secure: true` in production (NODE_ENV=production) — HTTPS only
- `path: '/'` — available across all routes
- Separate cookie names: `superadmin_token` vs `salon_access_token`

## CORS Configuration
Currently in `next.config.ts` with `Access-Control-Allow-Origin: http://localhost:4028`.

**For production:** Update to the actual salonweb domain:
```typescript
{ key: "Access-Control-Allow-Origin", value: "https://yourdomain.com" }
```

## Tenant Isolation Checklist
- [ ] Every `/api/salon/*` route reads `x-salon-id` from header
- [ ] JWT token `salonId` is verified against header `salonId`
- [ ] All DB queries include `salonId` filter
- [ ] Body `salonId` is never trusted
- [ ] Cancelled/suspended salons are rejected at tenant resolver
- [ ] Cross-tenant data access is impossible

## MongoDB Indexes
All operational models have salonId-scoped indexes. Verify indexes are created:
```bash
db.salonservices.getIndexes()
db.saloncustomers.getIndexes()
db.salonappointments.getIndexes()
# ... etc
```

## Data Safety
- [ ] `passwordHash` has `select: false` on SalonUser model
- [ ] No API response ever includes `passwordHash`
- [ ] Sensitive fields (salary, commission) only visible to owner
- [ ] Financial fields hidden from stylist
- [ ] Beauty notes hidden from accountant
- [ ] Error messages don't expose internal details

## Backup/Monitoring
- [ ] MongoDB automated backups configured
- [ ] Application error logging in place
- [ ] JWT expiry monitored (7-day tokens)
- [ ] Rate limiting considered for auth endpoints

## Not Implemented (Future Modules)
- Expenses tracking
- Marketing (WhatsApp/SMS campaigns)
- Loyalty/rewards
- Payroll
- Multi-branch support
- Purchase orders
- File/image upload for avatars/gallery
- Real-time notifications (WebSocket)
- SMS/WhatsApp integration

## Pre-Delivery Checklist
- [ ] All 33 salon API routes build without errors
- [ ] Superadmin dashboard works independently
- [ ] Demo data seeded and login verified
- [ ] salonweb connects with mock mode OFF
- [ ] All 5 role types tested (owner/manager/receptionist/stylist/accountant)
- [ ] Public enquiry form works without auth
- [ ] CORS configured for production domain
- [ ] JWT secrets are production-grade
- [ ] NODE_ENV=production set in deployment
