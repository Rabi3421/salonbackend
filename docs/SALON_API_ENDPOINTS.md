# Salon API Endpoints Reference

## Total: 33 routes (53 HTTP methods)

### Auth (3 routes)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| POST | `/api/salon/auth/login` | ❌ | public | `user` |
| POST | `/api/salon/auth/logout` | ❌ | public | — |
| GET | `/api/salon/auth/me` | ✅ | all | `user` |

### Dashboard (1 route)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/dashboard/overview` | ✅ | all | `stats, todayAppointments, ...` |

### Services (2 routes, 5 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/services` | ✅ | owner, manager, receptionist, stylist | `services, pagination` |
| POST | `/api/salon/services` | ✅ | owner | `service` |
| GET | `/api/salon/services/:id` | ✅ | owner, manager, receptionist, stylist | `service` |
| PATCH | `/api/salon/services/:id` | ✅ | owner | `service` |
| DELETE | `/api/salon/services/:id` | ✅ | owner | — |

### Packages (2 routes, 5 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/packages` | ✅ | owner, manager, receptionist | `packages, pagination` |
| POST | `/api/salon/packages` | ✅ | owner | `package` |
| GET | `/api/salon/packages/:id` | ✅ | owner, manager, receptionist | `package` |
| PATCH | `/api/salon/packages/:id` | ✅ | owner | `package` |
| DELETE | `/api/salon/packages/:id` | ✅ | owner | — |

### Customers (2 routes, 4 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/customers` | ✅ | all 5 roles | `customers, pagination` |
| POST | `/api/salon/customers` | ✅ | owner, manager, receptionist | `customer` |
| GET | `/api/salon/customers/:id` | ✅ | all 5 roles | `customer` |
| PATCH | `/api/salon/customers/:id` | ✅ | owner, manager, receptionist | `customer` |

### Staff (2 routes, 4 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/staff` | ✅ | owner, manager | `staff, pagination` |
| POST | `/api/salon/staff` | ✅ | owner | `staffMember` |
| GET | `/api/salon/staff/:id` | ✅ | owner, manager | `staffMember` |
| PATCH | `/api/salon/staff/:id` | ✅ | owner | `staffMember` |

### Appointments (3 routes, 5 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/appointments` | ✅ | owner, manager, receptionist, stylist | `appointments, pagination` |
| POST | `/api/salon/appointments` | ✅ | owner, manager, receptionist | `appointment` |
| GET | `/api/salon/appointments/:id` | ✅ | owner, manager, receptionist, stylist | `appointment` |
| PATCH | `/api/salon/appointments/:id` | ✅ | owner, manager, receptionist | `appointment` |
| PATCH | `/api/salon/appointments/:id/status` | ✅ | owner, manager, receptionist, stylist | `appointment` |

### Enquiries (4 routes, 6 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| POST | `/api/salon/enquiries` | ❌ | public | `enquiryId` |
| GET | `/api/salon/enquiries` | ✅ | owner, manager, receptionist | `enquiries, pagination` |
| GET | `/api/salon/enquiries/:id` | ✅ | owner, manager, receptionist | `enquiry` |
| PATCH | `/api/salon/enquiries/:id` | ✅ | owner, manager, receptionist | `enquiry` |
| POST | `/api/salon/enquiries/:id/notes` | ✅ | owner, manager, receptionist | `enquiry` |
| POST | `/api/salon/enquiries/:id/convert-to-appointment` | ✅ | owner, manager, receptionist | `enquiry, customer, appointment` |

### Billing (3 routes, 5 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/bills` | ✅ | owner, manager, receptionist, accountant | `bills, pagination` |
| POST | `/api/salon/bills` | ✅ | owner, receptionist, accountant | `bill` |
| GET | `/api/salon/bills/:id` | ✅ | owner, manager, receptionist, accountant | `bill` |
| PATCH | `/api/salon/bills/:id` | ✅ | owner, accountant | `bill` |
| POST | `/api/salon/bills/:id/payments` | ✅ | owner, receptionist, accountant | `bill, payment` |

### Payments (1 route, 2 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/payments` | ✅ | owner, manager, receptionist, accountant | `payments, pagination` |
| POST | `/api/salon/payments` | ✅ | owner, receptionist, accountant | `bill, payment` |

### Reports (4 routes)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/reports/revenue` | ✅ | owner, accountant | `report` |
| GET | `/api/salon/reports/appointments` | ✅ | owner, manager | `report` |
| GET | `/api/salon/reports/staff` | ✅ | owner | `report` |
| GET | `/api/salon/reports/customers` | ✅ | owner, manager | `report` |

### Settings (1 route, 2 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/settings` | ✅ | owner, manager, receptionist, accountant | `settings` |
| PATCH | `/api/salon/settings` | ✅ | owner | `settings` |

### Users (2 routes, 4 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/users` | ✅ | owner, manager | `users, pagination` |
| POST | `/api/salon/users` | ✅ | owner | `user` |
| GET | `/api/salon/users/:id` | ✅ | owner, manager | `user` |
| PATCH | `/api/salon/users/:id` | ✅ | owner | `user` |

### Inventory (3 routes, 5 methods)
| Method | Endpoint | Auth | Roles | Response Key |
|--------|----------|------|-------|-------------|
| GET | `/api/salon/inventory/products` | ✅ | owner, manager, accountant | `products, pagination, summary` |
| POST | `/api/salon/inventory/products` | ✅ | owner | `product` |
| GET | `/api/salon/inventory/products/:id` | ✅ | owner, manager, accountant | `product, adjustments` |
| PATCH | `/api/salon/inventory/products/:id` | ✅ | owner, manager | `product` |
| POST | `/api/salon/inventory/adjustments` | ✅ | owner, manager | `product, adjustment` |
