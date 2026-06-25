# Salon API Tenant Security Plan

## Multi-Tenant Architecture

Every salon is an isolated tenant identified by `salonId`. All salon data collections include a `salonId` field. No salon can ever access another salon's data.

---

## x-salon-id Header Handling

### Existing Helper
`src/lib/tenant/resolve-salon.ts` → `resolveSalonFromRequest(request)`

This already:
1. Reads `x-salon-id` from request headers
2. Returns error if missing
3. Looks up salon in database
4. Rejects cancelled accounts
5. Rejects non-active/non-trial accounts
6. Returns the salon document on success

### Usage in Every Salon API Route

```typescript
const salonResult = await resolveSalonFromRequest(request);
if (!salonResult.success) {
  return errorResponse(salonResult.error, salonResult.status);
}
const salonId = salonResult.salon.salonId as string;
```

### Rules
- **Every** `/api/salon/*` route MUST call `resolveSalonFromRequest()` as its first operation
- The `salonId` used in all database queries MUST come from the resolved salon, NOT from the request body
- If a client sends `salonId` in the request body, it MUST be ignored and overridden with the header-resolved value

---

## Auth Token Handling

### Salon User Auth Flow
1. `POST /api/salon/auth/login`: Validates email/password against `SalonUser` collection, scoped by `salonId` from `x-salon-id` header. Sets `salon_token` httpOnly cookie.
2. `GET /api/salon/auth/me`: Reads `salon_token` cookie, verifies JWT, returns user.
3. All other salon APIs: Read `salon_token` cookie to identify the authenticated user AND verify `x-salon-id` matches the user's `salonId`.

### Token Payload
```typescript
{
  id: string;       // SalonUser._id
  salonId: string;  // From SalonUser.salonId
  email: string;
  role: string;     // Backend role (salon_owner, manager, etc.)
}
```

### Double Verification
Every authenticated salon API MUST verify:
1. `x-salon-id` header resolves to a valid, active salon
2. `salon_token` cookie contains a valid JWT
3. The JWT's `salonId` matches the `x-salon-id` header
4. The user exists and `isActive === true`

This prevents a user from one salon accessing another salon's data by changing the header.

---

## Query Scoping Rules

### Every Database Query Must Include salonId

```typescript
// ✅ CORRECT
const appointments = await SalonAppointment.find({ salonId }).lean();

// ❌ WRONG — no salon scoping
const appointments = await SalonAppointment.find({}).lean();

// ❌ WRONG — trusting client-sent salonId
const appointments = await SalonAppointment.find({ salonId: body.salonId }).lean();
```

### For Single-Document Operations

```typescript
// ✅ CORRECT — always scope by salonId
const customer = await SalonCustomer.findOne({ _id: customerId, salonId }).lean();

// ❌ WRONG — only checking ID allows cross-tenant access
const customer = await SalonCustomer.findById(customerId).lean();
```

### For Updates

```typescript
// ✅ CORRECT
await SalonService.updateOne({ _id: serviceId, salonId }, { $set: updates });

// ❌ WRONG
await SalonService.findByIdAndUpdate(serviceId, { $set: updates });
```

---

## Anti Data-Leak Checklist

- [ ] Every `/api/salon/*` route starts with `resolveSalonFromRequest()`
- [ ] Every authenticated route verifies `salon_token` cookie
- [ ] JWT `salonId` is compared against `x-salon-id` header
- [ ] All find/findOne/update/delete queries include `salonId` filter
- [ ] `passwordHash` is never included in any API response
- [ ] `salonId` in request body is always overridden with header-resolved value
- [ ] Sensitive financial fields are stripped based on user role before response
- [ ] Salary/commission fields are only included for `salon_owner` role
- [ ] Stylist queries for appointments are filtered by their own user ID
- [ ] Error messages never expose internal database errors or stack traces
- [ ] Audit logs record actor, action, and entity for all mutations
- [ ] List endpoints have pagination limits (max 100 per page)

---

## CORS Considerations

When salonweb runs on a different origin (e.g., `localhost:4028`), the backend must:
1. Allow the salonweb origin in CORS headers
2. Allow `credentials: include` for cookie-based auth
3. Allow `x-salon-id` as a custom header

This can be configured in `next.config.ts` or via middleware response headers.

---

## Rate Limiting (Future)

Consider rate limiting for:
- Auth endpoints (prevent brute force)
- Create endpoints (prevent spam)
- Report endpoints (prevent expensive query abuse)
