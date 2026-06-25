# Salon API Phase 8 — Dashboard Overview

## Endpoint

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/dashboard/overview` | all roles | Role-specific dashboard overview |

## Role-Specific Behavior

### Owner
**Stats:** Today Revenue, Monthly Revenue, Today Appointments, Pending Requests, Active Customers, Pending Dues
**Data:** todayAppointments, recentEnquiries, revenueSummary (todayCollection, monthCollection, pendingDues, paymentModes), staffSnapshot (total, available, busy, onLeave)
**Alerts:** pending confirmations, open enquiries, pending dues, no-shows

### Manager
**Stats:** Today Appointments, Pending Confirmations, Checked-In Clients, Open Enquiries, Staff Available, Completed Today
**Data:** todayAppointments, recentEnquiries, staffSnapshot
**Hidden:** revenueSummary

### Receptionist
**Stats:** Today Queue, Next Appointment, Pending Confirmations, Checked-In, Walk-Ins Today, Open Enquiries
**Data:** todayAppointments, recentEnquiries
**Hidden:** revenueSummary, staffSnapshot

### Stylist
**Stats:** My Appointments, Next Client, Completed Today, Pending Services
**Data:** todayAppointments (own assigned only)
**Hidden:** revenueSummary, staffSnapshot, recentEnquiries, all other staff data
**Restriction:** Only sees appointments where stylist.id or stylist.name matches user

### Accountant
**Stats:** Today Collection, Monthly Collection, Pending Dues, Payments Today, Unpaid Bills, Partially Paid
**Data:** revenueSummary
**Hidden:** todayAppointments, recentEnquiries, staffSnapshot

## Aggregation Sources

| Data | Model | Query |
|------|-------|-------|
| Today appointments | SalonAppointment | date = today, sorted by startTime |
| Appointment counts | SalonAppointment | countDocuments by status + date = today |
| Walk-in count | SalonAppointment | source = walk_in, date = today |
| Open enquiries | Enquiry | status in [new, contacted, follow_up, in_progress] |
| Today collection | SalonBillPayment | status = completed, paidAt = today |
| Monthly collection | SalonBillPayment | status = completed, paidAt = this month |
| Pending dues | SalonBill | status in [unpaid, partially_paid], sum dueAmount |
| Payment mode breakdown | SalonBillPayment | grouped by mode, today |
| Active customers | SalonCustomer | status = active |
| Staff counts | SalonStaff | active, on_leave counts |
| Busy now | SalonAppointment | status in [checked_in, in_service], today |

## Stylist Assignment Limitation
Stylist overview filters appointments by `stylist.id === user.id` OR `stylist.name === user.name`. Since SalonStaff and SalonUser may not be linked by userId, name matching is used as fallback.

## Inventory Placeholder
`lowStockAlerts: []` — will be populated after inventory API phase is implemented.

## Response Shape
```json
{
  "success": true,
  "data": {
    "role": "owner",
    "salonName": "Rosé Luxe Salon",
    "generatedAt": "2026-06-24T...",
    "isDemoData": false,
    "stats": [{ "label": "...", "value": "...", "icon": "...", "variant": "..." }],
    "todayAppointments": [...],
    "recentEnquiries": [...],
    "revenueSummary": { "todayCollection": 0, "monthCollection": 0, ... },
    "staffSnapshot": { "totalStaff": 0, "availableToday": 0, ... },
    "lowStockAlerts": [],
    "quickActions": [...],
    "alerts": [...]
  }
}
```

The response is spread directly into `data` (not nested under `data.overview`) for compatibility with the frontend's `getDashboardOverview()` which reads `res.data` directly.

## Performance
- Uses `countDocuments` for counts (no full document fetch)
- `.lean()` on all queries
- Lists limited: appointments max 8, enquiries max 5
- All queries run in parallel via `Promise.all`

## Files Created
- `src/lib/dashboard/date-utils.ts` — getTodayRange(), getMonthRange()
- `src/lib/dashboard/salon-overview.ts` — role-specific overview builders + dispatcher
- `app/api/salon/dashboard/overview/route.ts` — GET endpoint
- `docs/SALON_API_PHASE_8_DASHBOARD_OVERVIEW.md`

## Next Phase
Phase 9: Reports APIs
