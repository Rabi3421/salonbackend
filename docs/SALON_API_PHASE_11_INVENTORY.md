# Salon API Phase 11 — Inventory

## Models Created

### SalonInventoryProduct (`src/models/SalonInventoryProduct.ts`)
| Field | Type | Notes |
|-------|------|-------|
| salonId | String | Tenant scope |
| productNo | String | Auto PRD-YYYY-NNNN |
| name | String | Required, 2–150 |
| sku | String | Optional, unique per salon |
| brand | String | |
| category | String | 8 categories |
| description | String | |
| unit | String | Default "pcs" |
| currentStock | Number | ≥ 0 |
| minStockLevel | Number | ≥ 0 |
| purchasePrice | Number | ≥ 0, owner-only visible for manager |
| sellingPrice | Number | ≥ 0 |
| stockState | String | in_stock / low_stock / out_of_stock (computed) |
| inventoryValue | Number | currentStock × purchasePrice (computed) |
| status | String | active / inactive / discontinued |
| supplierName, supplierPhone, supplierWhatsapp | String | |
| expiryDate | Date | |
| lastStockedAt | Date | Updated on stock_in |
| notes | String | |

### SalonStockAdjustment (`src/models/SalonStockAdjustment.ts`)
| Field | Type | Notes |
|-------|------|-------|
| salonId | String | Tenant scope |
| adjustmentNo | String | Auto STK-YYYY-NNNN |
| productId, productName | String | Product reference |
| type | String | 7 types |
| quantity | Number | > 0 |
| previousStock, newStock | Number | Audit trail |
| reason, referenceNo, notes | String | |
| adjustedBy, adjustedByName | String | User who adjusted |
| adjustedAt | Date | |

## Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/inventory/products` | owner, manager, accountant | List with filters + summary |
| POST | `/api/salon/inventory/products` | owner | Create product |
| GET | `/api/salon/inventory/products/:id` | owner, manager, accountant | Detail + recent adjustments |
| PATCH | `/api/salon/inventory/products/:id` | owner, manager | Update product |
| POST | `/api/salon/inventory/adjustments` | owner, manager | Record stock adjustment |

## Role Access

| Action | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| List products | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create product | ✅ | ❌ | ❌ | ❌ | ❌ |
| View product detail | ✅ | ✅ | ❌ | ❌ | ✅ |
| Update product | ✅ | ✅ (no financials) | ❌ | ❌ | ❌ |
| Adjust stock | ✅ | ✅ | ❌ | ❌ | ❌ |

## Field Visibility

| Field | owner | manager | accountant |
|-------|-------|---------|------------|
| All standard fields | ✅ | ✅ | ✅ |
| purchasePrice | ✅ | ❌ | ✅ |
| inventoryValue | ✅ | ❌ | ✅ |
| Summary inventoryValue | ✅ | ❌ | ✅ |

## Stock State Logic
- `currentStock <= 0` → `out_of_stock`
- `currentStock <= minStockLevel` → `low_stock`
- otherwise → `in_stock`

## Stock Adjustment Types
- **Increase:** stock_in, correction
- **Decrease:** stock_out, sale, usage, damage, expired
- Negative stock prevented with readable error

## Dashboard Integration
Owner overview now includes `lowStockAlerts` — up to 5 active products with low/out-of-stock state.

## Query Filters
- `search` — name, SKU, brand, supplier
- `category` — product category
- `status` — active/inactive/discontinued
- `stockState` — in_stock/low_stock/out_of_stock
- `expiry` — expired / expiring_soon (30 days)
- `page` / `limit`

## Summary Cards (GET list response)
```json
"summary": {
  "totalProducts": 12,
  "lowStock": 3,
  "outOfStock": 1,
  "expiringSoon": 2,
  "inventoryValue": 45600
}
```

## Files Created/Changed
- `src/models/SalonInventoryProduct.ts`
- `src/models/SalonStockAdjustment.ts`
- `src/lib/generators/inventory-id.ts`
- `src/lib/inventory/inventory-utils.ts`
- `src/lib/validators/salon-inventory.ts`
- `src/lib/serializers/salon-inventory.ts`
- `app/api/salon/inventory/products/route.ts`
- `app/api/salon/inventory/products/[productId]/route.ts`
- `app/api/salon/inventory/adjustments/route.ts`
- `src/lib/dashboard/salon-overview.ts` — added lowStockAlerts integration
- `docs/SALON_API_PHASE_11_INVENTORY.md`

## Next Phase
Phase 12: Backend Final QA + Seed Data + End-to-End Integration
