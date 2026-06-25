# Salon API Response Contract

All `/api/salon/*` endpoints follow these response formats. The frontend `api-client.ts` expects `{ success, message, data }`.

---

## Success Response (Single Item)

```json
{
  "success": true,
  "message": "Customer created successfully.",
  "data": {
    "customer": {
      "id": "...",
      "name": "...",
      ...
    }
  }
}
```

HTTP Status: `200` for reads/updates, `201` for creates.

The `data` object wraps the result in a named key matching the entity type:
- `{ "customer": {...} }`
- `{ "service": {...} }`
- `{ "appointment": {...} }`
- `{ "bill": {...} }`
- `{ "product": {...} }`
- `{ "user": {...} }`
- `{ "settings": {...} }`

---

## Success Response (List)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "customers": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "totalPages": 5
    }
  }
}
```

The frontend may or may not use pagination initially — most helpers expect:
- `res.data?.customers ?? []`
- `res.data?.services ?? []`
- etc.

For forward compatibility, always include `pagination` in list responses.

---

## Error Response

```json
{
  "success": false,
  "message": "Customer not found.",
  "code": "NOT_FOUND"
}
```

HTTP Status codes:
- `400` — Bad request / validation error
- `401` — Unauthorized (not logged in)
- `403` — Forbidden (logged in but insufficient role)
- `404` — Entity not found
- `409` — Conflict (duplicate email, etc.)
- `500` — Internal server error

Error codes (optional but recommended):
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_ERROR`

---

## Validation Error Response

```json
{
  "success": false,
  "message": "Name is required.",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "name",
    "reason": "required"
  }
}
```

For multiple validation errors, `message` should contain the first/most important error. The `details` field is optional and not parsed by the frontend currently.

---

## Existing Response Helpers

Located in `src/lib/api-response.ts`:

```typescript
successResponse(data, message?, status?)
errorResponse(message?, status?, details?)
```

These already produce the correct format. All new salon API routes MUST use these helpers.

---

## Entity ID Format

The frontend sends/receives IDs as strings. The backend should:
- Use MongoDB `_id` internally
- Return `id` (not `_id`) in responses by mapping: `id: doc._id.toString()`
- Accept both `_id` and `id` in request params

---

## Date Format

- All dates returned as ISO 8601 strings: `"2026-06-24T10:30:00.000Z"`
- The frontend formats dates on its own using `toLocaleDateString('en-IN', ...)`

---

## Pagination Parameters

Query string parameters for list endpoints:
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)
- `search` — Text search (name, email, phone, etc.)
- `status` — Status filter
- `sort` — Sort field (default: `createdAt`)
- `order` — Sort order: `asc` or `desc` (default: `desc`)

Module-specific filters:
- Appointments: `date`, `stylistId`, `status`
- Customers: `status`, `source`
- Services: `category`, `status`
- Inventory: `category`, `status`, `stockState`
- Bills: `status`, `customerId`, `dateFrom`, `dateTo`
- Enquiries: `status`, `priority`, `type`
