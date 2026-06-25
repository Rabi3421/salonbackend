# Salon API Role Permission Plan

## Role Mapping (Backend ↔ Frontend)

| Backend Role | Frontend Role | Display Label |
|-------------|--------------|---------------|
| `salon_owner` | `owner` | Owner |
| `salon_admin` | `manager` | Manager |
| `manager` | `manager` | Manager |
| `receptionist` | `receptionist` | Receptionist |
| `stylist` | `stylist` | Stylist |
| `cashier` | `accountant` | Accountant |

When returning user data in `/api/salon/auth/me`, the backend must map `salon_owner` → `owner` and `cashier` → `accountant` so the frontend role keys match.

---

## API Group Access Matrix

### Auth (all roles can authenticate)
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ | ✅ | ✅ |

### Dashboard Overview
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /dashboard/overview | ✅ | ✅ | ✅ | ✅ | ✅ |

Response data should be role-filtered (e.g., stylist sees only own stats).

### Appointments
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /appointments | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| POST /appointments | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /appointments/:id | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| PATCH /appointments/:id/status | ✅ | ✅ | ✅ | ✅ (limited) | ❌ |

**Stylist rule:** Only sees appointments assigned to them. Can only change status from `checked_in` → `in_service` → `completed`.

### Customers
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /customers | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /customers | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /customers/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /customers/:id | ✅ | ✅ | ✅ | ❌ | ❌ |

**Accountant/Stylist:** Cannot see customer preferences/notes. Accountant sees financial fields.

### Services
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /services | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /services | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /services/:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| PATCH /services/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE /services/:id | ✅ | ❌ | ❌ | ❌ | ❌ |

### Packages
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /packages | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /packages | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /packages/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PATCH /packages/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE /packages/:id | ✅ | ❌ | ❌ | ❌ | ❌ |

### Staff
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /staff/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /staff/:id | ✅ | ❌ | ❌ | ❌ | ❌ |

**Salary/commission fields:** Owner only.

### Billing
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /bills | ✅ | ✅ | ✅ | ❌ | ✅ |
| POST /bills | ✅ | ❌ | ✅ | ❌ | ✅ |
| GET /bills/:id | ✅ | ✅ | ✅ | ❌ | ✅ |
| PATCH /bills/:id | ✅ | ❌ | ✅ | ❌ | ✅ |

### Payments
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /payments | ✅ | ✅ | ✅ | ❌ | ✅ |
| POST /payments | ✅ | ❌ | ✅ | ❌ | ✅ |

### Enquiries
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /enquiries | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /enquiries/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PATCH /enquiries/:id | ✅ | ✅ | ✅ | ❌ | ❌ |

### Reports
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /reports/revenue | ✅ | ❌ | ❌ | ❌ | ✅ |
| GET /reports/appointments | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /reports/staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /reports/customers | ✅ | ✅ | ❌ | ❌ | ❌ |

### Settings
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /settings | ✅ | ✅ | ✅ | ❌ | ✅ (limited) |
| PATCH /settings | ✅ | ✅ | ✅ | ❌ | ❌ |

**Accountant:** Can only read notification preferences section.

### Users
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /users | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /users | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /users/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /users/:id | ✅ | ❌ | ❌ | ❌ | ❌ |

### Inventory
| Endpoint | owner | manager | receptionist | stylist | accountant |
|----------|-------|---------|--------------|---------|------------|
| GET /inventory/products | ✅ | ✅ | ❌ | ❌ | ✅ |
| POST /inventory/products | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /inventory/products/:id | ✅ | ✅ | ❌ | ❌ | ✅ |
| PATCH /inventory/products/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /inventory/adjustments | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Sensitive Data Rules

1. **Passwords:** Never returned in responses. `passwordHash` always excluded via `select: false` or explicit `.select('-passwordHash')`.
2. **Salary/Commission:** Visible only to `owner`. Backend must strip these fields for other roles.
3. **Revenue/Financial totals:** Only `owner` and `accountant` see aggregated revenue data.
4. **Customer financial data (totalSpent, dueAmount):** Visible to `owner`, `manager`, `accountant`.
5. **Customer preferences/notes:** Hidden from `accountant`.
6. **Inventory stock value:** Visible to `owner` and `accountant` only.

## Owner-Only Actions

- Create/edit services and packages
- Create staff members
- Create salon users
- Delete services/packages
- Access staff performance reports
- View salary/commission data
- Create inventory products

## Implementation Pattern

```typescript
// In each route handler:
const user = await getSalonUserFromRequest(request);
if (!user) return errorResponse("Unauthorized.", 401);

if (!hasPermission(user.role, 'appointments.create')) {
  return errorResponse("Permission denied.", 403);
}
```
