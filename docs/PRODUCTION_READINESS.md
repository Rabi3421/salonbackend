# Production Readiness Checklist

## Environment & Secrets
- [ ] All required env variables set (see ENV_SETUP.md)
- [ ] JWT secrets are strong random strings (32+ chars)
- [ ] MONGODB_URI uses authenticated production cluster
- [ ] NODE_ENV set to `production`
- [ ] No real secrets in `.env.example` or committed files
- [ ] Secrets rotated from development values

## Database
- [ ] MongoDB indexes created (auto-created by Mongoose on first connection)
- [ ] Database user has minimal required permissions
- [ ] Connection uses TLS/SSL
- [ ] Backup strategy in place (daily recommended)
- [ ] Audit log retention policy defined (consider TTL index for old logs)

## Authentication & Security
- [ ] JWT cookies use `httpOnly: true`, `sameSite: "lax"`, `secure: true` in production
- [ ] HTTPS enforced in production
- [ ] `passwordHash` is `select: false` on Superadmin and SalonUser models
- [ ] Temporary passwords returned only once and never stored
- [ ] Audit log sanitizer redacts password, token, secret, JWT, and MONGODB_URI fields

## API Security
- [ ] All `/api/superadmin/*` routes protected by middleware (except auth routes)
- [ ] `/superadmin/dashboard/*` pages protected by middleware redirect
- [ ] Public `/api/enquiries` returns minimal data and respects `publicLeadEnabled` setting
- [ ] Rate limiting recommended for public endpoints (not yet implemented)
- [ ] Consider spam protection for public enquiry form (CAPTCHA, honeypot)

## CORS Strategy
- [ ] Configure CORS headers if `salonweb` runs on a different domain
- [ ] Superadmin dashboard is same-origin (no CORS needed)
- [ ] Salon APIs (`/api/salon/*`) will need CORS for cross-origin `salonweb` requests

## Middleware
- [ ] Current `middleware.ts` protects all required routes
- [ ] Note: Next.js 16 shows deprecation warning recommending migration to `proxy.ts`
- [ ] Migration to `proxy.ts` can be done later if needed — current middleware works correctly

## Monitoring & Logging
- [ ] Error monitoring service recommended (e.g., Sentry)
- [ ] Console errors logged for audit log failures (non-blocking)
- [ ] No passwords or secrets logged to console
- [ ] Consider structured logging for production

## Subscription Management
- [ ] Cron job needed for `POST /api/superadmin/subscriptions/check-expired` (manual button exists in UI)
- [ ] Recommended: run daily to auto-expire past-due subscriptions
- [ ] Payment reconciliation process defined for manual/offline payments

## Deployment
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero errors/warnings
- [ ] Static pages pre-rendered at build time
- [ ] Dynamic API routes server-rendered on demand
- [ ] Environment variables configured in deployment platform

## Pre-Launch Smoke Test
1. [ ] Login as superadmin
2. [ ] Ensure default platform settings
3. [ ] Seed default plans (Basic/Standard/Premium)
4. [ ] Create a test salon
5. [ ] Verify salon ID, owner user, and trial subscription created
6. [ ] Assign/renew subscription
7. [ ] Record and mark a payment as paid
8. [ ] Submit a public enquiry
9. [ ] View all reports
10. [ ] Check audit logs for all actions above
11. [ ] Update platform settings
12. [ ] Verify no sensitive data in audit log before/after fields
