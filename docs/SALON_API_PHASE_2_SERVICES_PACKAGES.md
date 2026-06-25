# Salon API Phase 2 — Services + Packages

## Models Created

### SalonService (`src/models/SalonService.ts`)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| salonId | String | ✅ | Tenant scope |
| name | String | ✅ | 2–100 chars |
| slug | String | | Auto-generated |
| category | String | ✅ | e.g. Hair, Skin, Nails |
| description | String | ✅ | 5–1000 chars |
| price | Number | ✅ | >= 0 |
| duration | Number | ✅ | 5–720 minutes |
| status | String | ✅ | active / inactive |
| image | String | | URL |
| assignedStaffIds | [String] | | |
| assignedStaffNames | [String] | | |
| isFeatured | Boolean | | default false |
| sortOrder | Number | | default 0 |

Indexes: `{salonId,name}`, `{salonId,category}`, `{salonId,status}`, `{salonId,slug}` unique sparse

### SalonPackage (`src/models/SalonPackage.ts`)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| salonId | String | ✅ | Tenant scope |
| name | String | ✅ | |
| slug | String | | Auto-generated |
| description | String | ✅ | |
| price | Number | ✅ | >= 0 |
| status | String | ✅ | active / inactive |
| tag | String | | e.g. "Most Popular" |
| bestFor | String | | e.g. "Bride-to-be" |
| includedServiceIds | [String] | | |
| includedServices | [String] | | Service names |
| validityDays | Number | | 0 = unlimited |
| isHighlighted | Boolean | | default false |
| sortOrder | Number | | default 0 |

Indexes: `{salonId,name}`, `{salonId,status}`, `{salonId,slug}` unique sparse

## Endpoints

### Services

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/services` | owner, manager, receptionist, stylist | List with search/category/status filters |
| POST | `/api/salon/services` | owner | Create service |
| GET | `/api/salon/services/:id` | owner, manager, receptionist, stylist | Get service detail |
| PATCH | `/api/salon/services/:id` | owner | Update service |
| DELETE | `/api/salon/services/:id` | owner | Soft delete (set inactive) |

### Packages

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/packages` | owner, manager, receptionist | List with search/status filters |
| POST | `/api/salon/packages` | owner | Create package |
| GET | `/api/salon/packages/:id` | owner, manager, receptionist | Get package detail |
| PATCH | `/api/salon/packages/:id` | owner | Update package |
| DELETE | `/api/salon/packages/:id` | owner | Soft delete (set inactive) |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| List services | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create service | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update service | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete service | ✅ | ❌ | ❌ | ❌ | ❌ |
| List packages | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create package | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update package | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete package | ✅ | ❌ | ❌ | ❌ | ❌ |

## Query Filters

### Services
- `search` — matches name, description, category (case-insensitive)
- `category` — exact match
- `status` — active / inactive
- `page` — default 1
- `limit` — default 20, max 100

### Packages
- `search` — matches name, description
- `status` — active / inactive
- `page` — default 1
- `limit` — default 20, max 100

## Response Examples

### GET /api/salon/services
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "services": [
      {
        "id": "...",
        "name": "Hair Styling",
        "slug": "hair-styling",
        "category": "Hair",
        "price": 1500,
        "duration": 60,
        "status": "active",
        "isFeatured": true,
        ...
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### POST /api/salon/services (201)
```json
{
  "success": true,
  "message": "Service created successfully.",
  "data": {
    "service": { "id": "...", "name": "...", ... }
  }
}
```

## Tenant Security
- All queries scoped by `salonId` from `requireSalonUser()` (resolved from `x-salon-id` header)
- `salonId` never taken from request body
- JWT salonId verified against header salonId
- ObjectId validated before DB query
- DELETE is soft (sets status to inactive, not hard delete)

## Files Created
- `src/models/SalonService.ts`
- `src/models/SalonPackage.ts`
- `src/lib/validators/salon-service.ts`
- `src/lib/validators/salon-package.ts`
- `src/lib/slug.ts`
- `app/api/salon/services/route.ts`
- `app/api/salon/services/[serviceId]/route.ts`
- `app/api/salon/packages/route.ts`
- `app/api/salon/packages/[packageId]/route.ts`
- `docs/SALON_API_PHASE_2_SERVICES_PACKAGES.md`

## Next Phase
Phase 3: Customers APIs
