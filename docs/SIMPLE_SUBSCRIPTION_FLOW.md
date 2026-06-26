# Simple Subscription Flow

## Overview
SalonFlow uses a simple, manual subscription system controlled by the superadmin. There is no online payment gateway, no automatic billing, and no cron jobs.

## Trial
- When superadmin creates/onboards a salon, it gets 1 month free trial
- `trialStartDate` = onboarding date
- `trialEndDate` = onboarding date + 1 month
- During trial, salon is active

## Plans

| Plan    | Code    | Standard Price | Minimum Price | Access                                |
|---------|---------|---------------|---------------|---------------------------------------|
| Basic   | basic   | ₹2,000/month  | ₹1,000/month  | Public website, owner & stylist dashboard |
| Premium | premium | ₹3,000/month  | ₹2,000/month  | All dashboards, all roles, full permissions |

Superadmin can negotiate the price down to the minimum. The negotiated price and reason are recorded.

## Billing Rules
- **Payment collection date**: 5th of every month
- **Grace period ends**: 10th of every month
- **Currency**: INR

### Due Date Calculation
After trial ends, the next payment due date is the next upcoming 5th:
- Onboard 20 June → trial ends 20 July → first due 5 August, grace 10 August
- Onboard 1 June → trial ends 1 July → first due 5 July, grace 10 July

## Subscription Statuses

| Status    | Access Allowed | Dashboard | Description                    |
|-----------|---------------|-----------|--------------------------------|
| trial     | Yes           | Allowed   | Free trial running             |
| active    | Yes           | Allowed   | Paid/active salon              |
| unpaid    | Yes (warning) | Allowed   | Payment due but not blocked    |
| blocked   | No            | Blocked   | Manually blocked by superadmin |
| cancelled | No            | Blocked   | Stopped/cancelled              |

## Payment Collection Flow
1. Salon owner pays through UPI/cash/bank/other offline method
2. Salon owner shares transaction proof with support
3. Superadmin records the payment in the system
4. System activates the salon and advances due date to next month's 5th

## Superadmin Actions
- **Edit Plan/Price**: Change plan, negotiated price, status, dates
- **Mark Unpaid**: Set status to unpaid (salon can still access with warning)
- **Block**: Block salon dashboard access with reason
- **Reactivate**: Restore active status after payment or admin decision
- **Cancel**: Cancel subscription (blocks access)
- **Record Payment**: Record manual payment, auto-activates and advances dates

## Owner Dashboard
Salon owner sees:
- Current plan and monthly price
- Trial end date
- Payment due date and grace end date
- Current status with warning banner
- Payment instructions (UPI/account details)
- Payment history

## API Endpoints

### Superadmin
- `GET /api/superadmin/salons/[salonId]/simple-subscription` - Get subscription summary
- `PATCH /api/superadmin/salons/[salonId]/simple-subscription` - Update plan/price/status
- `POST /api/superadmin/salons/[salonId]/simple-subscription/block` - Block access
- `POST /api/superadmin/salons/[salonId]/simple-subscription/reactivate` - Reactivate
- `POST /api/superadmin/salons/[salonId]/simple-subscription/mark-unpaid` - Mark unpaid
- `POST /api/superadmin/salons/[salonId]/simple-subscription/cancel` - Cancel
- `POST /api/superadmin/salons/[salonId]/simple-payments` - Record payment
- `GET /api/superadmin/salons/[salonId]/simple-payments` - Payment history

### Salon Owner
- `GET /api/salon/subscription/current` - Current subscription details
- `GET /api/salon/subscription/payments` - Payment history
