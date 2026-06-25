# Salon API Phase 10 — Settings + Users

## Models Created

### SalonSettings (`src/models/SalonSettings.ts`)
| Field Group | Fields | Notes |
|-------------|--------|-------|
| Identity | salonId (unique) | One settings doc per salon |
| Profile | businessName, displayName, phone, email, address, city, state, pincode, logo, description | |
| Business Hours | businessHours: [{ day, isOpen, openTime, closeTime, breakStart, breakEnd }] | Default Mon–Sat 10–20 |
| Booking Rules | allowOnlineBooking, requireApproval, advanceBookingDays, minAdvanceHours, slotIntervalMinutes, cancellationWindowHours, allowWalkIns | |
| Notifications | appointmentConfirmation, appointmentReminder, paymentReceipt, enquiryAlert, lowStockAlert, whatsappEnabled, smsEnabled, emailEnabled | |

## Endpoints

### Settings
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/settings` | owner, manager, receptionist, accountant | Get salon settings |
| PATCH | `/api/salon/settings` | owner | Update settings |

### Users
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/users` | owner, manager | List dashboard users |
| POST | `/api/salon/users` | owner | Create dashboard user |
| GET | `/api/salon/users/:id` | owner, manager | User detail |
| PATCH | `/api/salon/users/:id` | owner | Update user |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| View settings | ✅ | ✅ | ✅ | ❌ | ✅ |
| Update settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| List users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ | ❌ | ❌ |
| View user detail | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update user | ✅ | ❌ | ❌ | ❌ | ❌ |

## Role Mapping (Frontend ↔ Backend)

| Frontend (API) | Backend (DB) |
|---------------|-------------|
| owner | salon_owner |
| manager | manager |
| receptionist | receptionist |
| stylist | stylist |
| accountant | cashier |

`mapFrontendSalonRoleToBackend()` added to salon-permissions.ts for user create/update.

## Staff Profile vs Login User

- **SalonUser** = login/auth account (email, passwordHash, role). Managed by user APIs.
- **SalonStaff** = operational profile (schedule, services, salary). Managed by staff APIs.
- They may be linked later via `staff.userId`, but are independent collections.
- Creating a user does NOT auto-create a staff profile and vice versa.

## Settings Auto-Creation
When GET settings is called and no SalonSettings document exists, one is automatically created using data from the Salon model (name, email, phone, address, city, state, pincode).

## Settings PATCH Behavior
- Profile fields updated directly
- bookingRules and notifications use dot-notation updates (only specified sub-fields change)
- businessHours array replaced entirely if provided
- salonId cannot be changed

## User Create Behavior
1. Validate name, email, phone, password (min 6), frontend role
2. Check email uniqueness within salonId
3. Map frontend role to backend role
4. Hash password using bcrypt (same helper as superadmin)
5. Create SalonUser — passwordHash never returned
6. Return serialized user with frontend-mapped role

## Last Owner Protection
Cannot deactivate a user with `salon_owner` role if they are the last active owner in the salon.

## Files Created/Changed
- `src/models/SalonSettings.ts`
- `src/lib/validators/salon-settings.ts`
- `src/lib/validators/salon-user-dashboard.ts`
- `src/lib/serializers/salon-settings.ts`
- `src/lib/serializers/salon-user-dashboard.ts`
- `src/lib/auth/salon-permissions.ts` — added `mapFrontendSalonRoleToBackend()`
- `app/api/salon/settings/route.ts`
- `app/api/salon/users/route.ts`
- `app/api/salon/users/[userId]/route.ts`
- `docs/SALON_API_PHASE_10_SETTINGS_USERS.md`

## Next Phase
Phase 11: Inventory APIs
