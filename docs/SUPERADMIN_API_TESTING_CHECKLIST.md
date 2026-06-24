# Superadmin API Testing Checklist

## Auth
- [ ] POST `/api/superadmin/auth/login` — correct credentials returns 200 + cookie
- [ ] POST `/api/superadmin/auth/login` — wrong password returns 401
- [ ] GET `/api/superadmin/auth/me` — with valid cookie returns user (no passwordHash)
- [ ] GET `/api/superadmin/auth/me` — without cookie returns 401
- [ ] POST `/api/superadmin/auth/logout` — clears cookie

## Salons
- [ ] POST `/api/superadmin/salons` — creates salon, owner user, trial subscription
- [ ] POST `/api/superadmin/salons` — duplicate ownerEmail returns 409
- [ ] GET `/api/superadmin/salons` — returns paginated list with summary
- [ ] GET `/api/superadmin/salons?search=...&status=...` — filters work
- [ ] GET `/api/superadmin/salons/[salonId]` — returns detail with owner, subscription, payments
- [ ] PATCH `/api/superadmin/salons/[salonId]` — updates allowed fields
- [ ] PATCH `/api/superadmin/salons/[salonId]/status` — updates account/website status
- [ ] DELETE `/api/superadmin/salons/[salonId]` — soft cancels salon
- [ ] POST `/api/superadmin/salons/[salonId]/users` — creates user (no passwordHash returned)
- [ ] POST `.../users/[userId]/reset-password` — returns temporary password once

## Plans
- [ ] POST `/api/superadmin/plans/seed` — creates Basic/Standard/Premium
- [ ] POST `/api/superadmin/plans` — creates custom plan
- [ ] POST `/api/superadmin/plans` — duplicate planCode returns 409
- [ ] GET `/api/superadmin/plans/[planCode]` — includes usage counts
- [ ] PATCH `/api/superadmin/plans/[planCode]` — updates fields (not planCode)
- [ ] DELETE `/api/superadmin/plans/[planCode]` — soft deactivates

## Subscriptions
- [ ] POST `/api/superadmin/subscriptions` — assigns subscription, syncs salon
- [ ] POST `.../[subscriptionId]/renew` — creates new record, sets active
- [ ] POST `.../[subscriptionId]/change-plan` — creates new record with new plan
- [ ] POST `.../[subscriptionId]/cancel` — cancels, syncs salon
- [ ] POST `/api/superadmin/subscriptions/check-expired` — marks past-due as expired

## Payments
- [ ] POST `/api/superadmin/payments` — creates payment
- [ ] POST `/api/superadmin/payments` — with subscriptionId validates salon match
- [ ] POST `.../[paymentId]/mark-paid` — sets paid + paidAt, syncs subscription
- [ ] POST `.../[paymentId]/refund` — sets refunded with reason
- [ ] PATCH `.../[paymentId]` — updates allowed fields
- [ ] DELETE `.../[paymentId]` — soft sets failed/refunded

## Enquiries
- [ ] POST `/api/enquiries` — public, creates with status "new" (no auth)
- [ ] POST `/api/enquiries` — respects publicLeadEnabled platform setting
- [ ] POST `/api/salon/enquiries` — with valid x-salon-id header works
- [ ] POST `/api/salon/enquiries` — without x-salon-id returns 400
- [ ] GET `/api/superadmin/enquiries` — paginated with summary
- [ ] PATCH `.../[enquiryId]/status` — updates status, sets resolvedAt/closedAt
- [ ] POST `.../[enquiryId]/notes` — adds internal note with author tracking
- [ ] DELETE `.../[enquiryId]` — soft close or spam

## Settings
- [ ] GET `/api/superadmin/settings` — returns all settings with defaults
- [ ] PATCH `/api/superadmin/settings` — updates provided keys only
- [ ] POST `/api/superadmin/settings/reset` — fills missing defaults

## Audit Logs
- [ ] Verify audit log created after each major action above
- [ ] GET `/api/superadmin/audit-logs` — returns paginated logs
- [ ] GET `.../[auditLogId]` — returns sanitized detail (no passwords/secrets)

## Reports
- [ ] GET `/api/superadmin/reports/overview?range=this_month` — returns metrics
- [ ] GET `/api/superadmin/reports/revenue?range=this_year` — breakdowns work
- [ ] GET `/api/superadmin/reports/salons` — city/status breakdown
- [ ] GET `/api/superadmin/reports/subscriptions` — plan/cycle breakdown
- [ ] GET `/api/superadmin/reports/payments` — status/method breakdown
- [ ] GET `/api/superadmin/reports/enquiries` — type/priority breakdown
- [ ] GET `/api/superadmin/reports/plans` — plan usage + module usage

## Security
- [ ] All `/api/superadmin/*` routes (except login/logout/me) return 401 without cookie
- [ ] `/superadmin/dashboard/*` redirects to login without cookie
- [ ] `passwordHash` is never present in any API response
- [ ] Temporary passwords returned only once on creation/reset
- [ ] Audit logs sanitize sensitive fields (password, token, secret, MONGODB_URI)
- [ ] Public APIs (`/api/enquiries`) return minimal data (enquiryId only)
