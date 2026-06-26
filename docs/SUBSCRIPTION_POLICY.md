# Subscription Policy

## Trial

New salons receive a 30 day free trial from onboarding.

- `trialStartDate`: salon creation date
- `trialEndDate`: creation date + 30 days
- Default trial plan: Premium, unless a valid plan is provided during salon creation
- Access status during trial: `trial`

## Plans

### Basic

- `planCode`: `basic`
- Monthly price: Rs 2000
- Minimum negotiated price: Rs 1000
- Allowed: public website, owner dashboard, stylist dashboard, basic customer/service/staff/appointment access
- Restricted: receptionist dashboard, accountant dashboard, inventory dashboard, advanced reports, full admin dashboards

### Premium

- `planCode`: `premium`
- Monthly price: Rs 3000
- Minimum negotiated price: Rs 2000
- Allowed: all dashboards, roles, modules, and permissions

## Negotiated Pricing

Subscription pricing fields:

- `standardMonthlyPrice`
- `negotiatedMonthlyPrice`
- `finalMonthlyPrice`
- `minimumMonthlyPrice`
- `negotiationNote`
- `priceLockedBySuperadmin`

Validation:

- Basic cannot be below Rs 1000
- Premium cannot be below Rs 2000

## Billing Dates

- Payment due date: 5th of every month
- Grace period ends: 10th of every month
- First due date after trial is the next upcoming 5th after `trialEndDate`

Examples:

- Onboard 20 June, trial ends 20 July, first due date 5 August, grace until 10 August
- Onboard 1 June, trial ends 1 July, first due date 5 July, grace until 10 July

## Access Statuses

- `trial`: access allowed
- `active`: access allowed
- `payment_due`: access allowed with warning
- `grace_period`: access allowed with warning
- `access_blocked`: dashboard/API access blocked
- `suspended`: blocked by superadmin
- `cancelled`: blocked
- `expired`: blocked

Public website content is blocked for `access_blocked`, `suspended`, and `cancelled` by tenant resolution.

## Manual Payments

Supported modes:

- `upi`
- `cash`
- `bank_transfer`
- `card`
- `cheque`
- `other`

When a payment is marked paid:

- Subscription becomes `active`
- Salon becomes active
- `lastPaidAt` and `lastPaymentId` are updated
- Next due date is next month’s 5th
- Next grace end date is next month’s 10th

## Owner APIs

Current subscription:

```txt
GET /api/salon/subscription/current
```

Payment history:

```txt
GET /api/salon/subscription/payments
```

Allowed roles:

- owner
- manager

## Superadmin APIs

Update subscription policy:

```txt
PATCH /api/superadmin/salons/[salonId]/subscription-policy
```

Block salon access:

```txt
POST /api/superadmin/salons/[salonId]/subscription/block
```

Reactivate salon access:

```txt
POST /api/superadmin/salons/[salonId]/subscription/reactivate
```

Evaluate all subscriptions:

```txt
POST /api/superadmin/subscriptions/evaluate-access
```

## Scripts

Seed Basic and Premium plans:

```txt
npm run seed:salon-plans
```

Backfill existing salons:

```txt
npm run backfill:salon-subscriptions
```
