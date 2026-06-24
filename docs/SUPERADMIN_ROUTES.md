# Superadmin Route Inventory

## A. Superadmin Pages

| Route | Description |
|-------|-------------|
| `/superadmin/login` | Login page |
| `/superadmin/dashboard` | Dashboard overview with metrics |
| `/superadmin/dashboard/salons` | Salon list with search/filter |
| `/superadmin/dashboard/salons/new` | Create salon form |
| `/superadmin/dashboard/salons/[salonId]` | Salon detail |
| `/superadmin/dashboard/salons/[salonId]/edit` | Edit salon |
| `/superadmin/dashboard/salons/[salonId]/users` | Manage salon users |
| `/superadmin/dashboard/salons/[salonId]/status` | Manage salon status |
| `/superadmin/dashboard/plans` | Plans list |
| `/superadmin/dashboard/plans/new` | Create plan |
| `/superadmin/dashboard/plans/[planCode]` | Plan detail |
| `/superadmin/dashboard/plans/[planCode]/edit` | Edit plan |
| `/superadmin/dashboard/subscriptions` | Subscriptions list |
| `/superadmin/dashboard/subscriptions/new` | Assign subscription |
| `/superadmin/dashboard/subscriptions/[subscriptionId]` | Subscription detail |
| `/superadmin/dashboard/subscriptions/[subscriptionId]/renew` | Renew subscription |
| `/superadmin/dashboard/subscriptions/[subscriptionId]/change-plan` | Change plan |
| `/superadmin/dashboard/payments` | Payments list |
| `/superadmin/dashboard/payments/new` | Add payment |
| `/superadmin/dashboard/payments/[paymentId]` | Payment detail |
| `/superadmin/dashboard/payments/[paymentId]/edit` | Edit payment |
| `/superadmin/dashboard/enquiries` | Enquiries list |
| `/superadmin/dashboard/enquiries/new` | Add enquiry |
| `/superadmin/dashboard/enquiries/[enquiryId]` | Enquiry detail |
| `/superadmin/dashboard/enquiries/[enquiryId]/edit` | Edit enquiry |
| `/superadmin/dashboard/reports` | Reports hub |
| `/superadmin/dashboard/reports/revenue` | Revenue report |
| `/superadmin/dashboard/reports/salons` | Salon report |
| `/superadmin/dashboard/reports/subscriptions` | Subscription report |
| `/superadmin/dashboard/reports/payments` | Payment report |
| `/superadmin/dashboard/reports/enquiries` | Enquiry report |
| `/superadmin/dashboard/reports/plans` | Plan usage report |
| `/superadmin/dashboard/audit-logs` | Audit log list |
| `/superadmin/dashboard/audit-logs/[auditLogId]` | Audit log detail |
| `/superadmin/dashboard/settings` | Platform settings |

## B. Superadmin APIs

### Auth
| Method | Endpoint |
|--------|----------|
| POST | `/api/superadmin/auth/login` |
| POST | `/api/superadmin/auth/logout` |
| GET | `/api/superadmin/auth/me` |

### Dashboard
| Method | Endpoint |
|--------|----------|
| GET | `/api/superadmin/dashboard/overview` |

### Salons
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/superadmin/salons` |
| GET/PATCH/DELETE | `/api/superadmin/salons/[salonId]` |
| PATCH | `/api/superadmin/salons/[salonId]/status` |
| GET/POST | `/api/superadmin/salons/[salonId]/users` |
| POST | `/api/superadmin/salons/[salonId]/users/[userId]/reset-password` |

### Plans
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/superadmin/plans` |
| GET/PATCH/DELETE | `/api/superadmin/plans/[planCode]` |
| POST | `/api/superadmin/plans/seed` |

### Subscriptions
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/superadmin/subscriptions` |
| GET/PATCH/DELETE | `/api/superadmin/subscriptions/[subscriptionId]` |
| POST | `/api/superadmin/subscriptions/[subscriptionId]/renew` |
| POST | `/api/superadmin/subscriptions/[subscriptionId]/cancel` |
| POST | `/api/superadmin/subscriptions/[subscriptionId]/change-plan` |
| GET/POST | `/api/superadmin/subscriptions/[subscriptionId]/payments` |
| POST | `/api/superadmin/subscriptions/check-expired` |

### Payments
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/superadmin/payments` |
| GET/PATCH/DELETE | `/api/superadmin/payments/[paymentId]` |
| POST | `/api/superadmin/payments/[paymentId]/mark-paid` |
| POST | `/api/superadmin/payments/[paymentId]/refund` |

### Enquiries
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/superadmin/enquiries` |
| GET/PATCH/DELETE | `/api/superadmin/enquiries/[enquiryId]` |
| PATCH | `/api/superadmin/enquiries/[enquiryId]/status` |
| POST | `/api/superadmin/enquiries/[enquiryId]/notes` |

### Reports
| Method | Endpoint |
|--------|----------|
| GET | `/api/superadmin/reports/overview` |
| GET | `/api/superadmin/reports/revenue` |
| GET | `/api/superadmin/reports/salons` |
| GET | `/api/superadmin/reports/subscriptions` |
| GET | `/api/superadmin/reports/payments` |
| GET | `/api/superadmin/reports/enquiries` |
| GET | `/api/superadmin/reports/plans` |

### Audit Logs
| Method | Endpoint |
|--------|----------|
| GET | `/api/superadmin/audit-logs` |
| GET | `/api/superadmin/audit-logs/[auditLogId]` |

### Settings
| Method | Endpoint |
|--------|----------|
| GET/PATCH | `/api/superadmin/settings` |
| POST | `/api/superadmin/settings/reset` |

## C. Public APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/enquiries` | Public lead/contact form submission |

## D. Future salonweb Backend APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/salon/enquiries` | Salon-scoped enquiry via `x-salon-id` header |

**Note:** No salon frontend pages exist in `salonbackend`. The separate `salonweb` project consumes these backend APIs using `x-salon-id` header.
