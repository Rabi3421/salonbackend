# Salon API Phase 9 — Reports

## Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/salon/reports/revenue` | owner, accountant | Revenue/billing report |
| GET | `/api/salon/reports/appointments` | owner, manager | Appointment analytics |
| GET | `/api/salon/reports/staff` | owner | Staff performance |
| GET | `/api/salon/reports/customers` | owner, manager | Customer insights |

## Role Access

| Report | owner | manager | receptionist | stylist | accountant |
|--------|-------|---------|--------------|---------|------------|
| Revenue | ✅ | ❌ | ❌ | ❌ | ✅ |
| Appointments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Customers | ✅ | ✅ | ❌ | ❌ | ❌ |

## Query Parameters (all reports)
- `range` — `today`, `7d`, `30d` (default), `month`, `custom`
- `dateFrom` — YYYY-MM-DD (required if range=custom)
- `dateTo` — YYYY-MM-DD (required if range=custom)

## Revenue Report
**Sources:** SalonBill, SalonBillPayment

**Summary:** totalCollection, previousCollection, collectionChangePercent, totalBilled, pendingDues, paidBills, unpaidBills, partiallyPaidBills

**Breakdowns:**
- dailyCollection: [{ date, collection, billed, payments }]
- paymentModeBreakdown: [{ mode, amount, count, percentage }]
- billStatusBreakdown: [{ status, count, amount }]
- topCustomers: [{ name, phone, amount, bills }]
- recentPayments: latest 10

## Appointment Report
**Sources:** SalonAppointment

**Summary:** totalAppointments, completedAppointments, cancelledAppointments, noShowAppointments, completionRate, cancellationRate, previousTotalAppointments, appointmentChangePercent

**Breakdowns:**
- dailyAppointments: [{ date, total, completed, cancelled, noShow }]
- statusBreakdown: [{ status, count }]
- sourceBreakdown: [{ source, count }]
- topServices: [{ name, count, amount }] from embedded service snapshots
- peakDays: top 5 busiest days

## Staff Report
**Sources:** SalonStaff, SalonAppointment

**Summary:** totalStaff, activeStaff, onLeaveStaff, totalCompletedServices, totalStaffRevenue

**Data:**
- staffPerformance: [{ staffId, name, role, designation, appointments, completedAppointments, cancelledAppointments, revenue, rating }]
- workloadBreakdown: [{ name, appointments }]
- attendanceSnapshot: { active, onLeave, inactive }

**Limitation:** Staff revenue is calculated from completed appointment totalAmount matched by stylist.id or stylist.name. This is an approximation since actual billing may differ.

## Customer Report
**Sources:** SalonCustomer

**Summary:** totalCustomers, newCustomers, activeCustomers, repeatCustomers, blockedCustomers, customerGrowthPercent

**Data:**
- newCustomersTrend: [{ date, count }]
- sourceBreakdown: [{ source, count }]
- topCustomers: [{ name, phone, visits, totalSpent, dueAmount }]
- retentionSnapshot: { oneTimeCustomers, repeatCustomers, repeatRate }

**Limitation:** repeat customer detection uses customer.totalVisits field. If totalVisits is not maintained by billing/appointments yet, repeat count may be 0 until that aggregation is implemented.

## Response Compatibility
All reports return both `data.report` and spread `data` for frontend compatibility:
```json
{ "success": true, "data": { "report": {...}, ...reportFields } }
```

## Performance
- All queries scoped by salonId
- `.lean()` on all queries
- Lists limited to 10 items
- Daily buckets generated in-memory from query results
- Previous period comparison calculated from same-duration prior range

## Files Created
- `src/lib/reports/salon-report-date.ts` — parseReportDateRange(), getDateBuckets()
- `src/lib/reports/salon-report-utils.ts` — percentChange(), countByField(), shapeList()
- `app/api/salon/reports/revenue/route.ts`
- `app/api/salon/reports/appointments/route.ts`
- `app/api/salon/reports/staff/route.ts`
- `app/api/salon/reports/customers/route.ts`
- `docs/SALON_API_PHASE_9_REPORTS.md`

## Next Phase
Phase 10: Settings + Users APIs
