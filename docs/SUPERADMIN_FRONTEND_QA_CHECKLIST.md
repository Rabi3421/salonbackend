# Superadmin Frontend QA Checklist

## Layout & Navigation
- [ ] Login page renders and accepts credentials
- [ ] Dashboard layout shows sidebar on desktop
- [ ] Mobile navigation shows horizontal scroll menu
- [ ] All 9 sidebar links work (Dashboard, Salons, Plans, Subscriptions, Payments, Enquiries, Reports, Audit Logs, Settings)
- [ ] Logout button works and redirects to login

## Dashboard
- [ ] Metric cards load with live data (Salon Status, Revenue, Enquiries sections)
- [ ] Quick action links all navigate correctly
- [ ] Loading state shows spinner
- [ ] Error state shows retry button

## Salons
- [ ] List page loads with search, status filter, pagination, summary cards
- [ ] Create page form submits and shows success with salon ID + temp password + copy buttons
- [ ] Detail page shows all 4 info cards + subscription links + enquiry links
- [ ] Edit page pre-fills data and saves with plan dropdown
- [ ] Users page lists users, add user form works, reset password shows temp password
- [ ] Status page shows warning for dangerous statuses
- [ ] Cancel salon shows confirmation dialog

## Plans
- [ ] List page loads with summary, search, status filter, seed button
- [ ] Create page with module checkboxes submits and redirects
- [ ] Detail page shows modules grid and usage counts
- [ ] Edit page pre-fills and saves (planCode not editable)
- [ ] Deactivate shows confirmation

## Subscriptions
- [ ] List page loads with 8 summary cards, status/cycle filters
- [ ] Assign page has salon/plan dropdowns with auto-fill amount
- [ ] Detail page shows subscription/salon/plan cards + payments table
- [ ] Renew page auto-fills from current plan pricing
- [ ] Change plan page loads active plans dropdown
- [ ] Cancel shows confirmation

## Payments
- [ ] List page loads with 8 summary cards, status/method filters
- [ ] Add page has salon dropdown and method/status selects
- [ ] Detail page shows payment/salon/subscription cards
- [ ] Edit page pre-fills and saves
- [ ] Mark paid and refund show confirmation dialogs

## Enquiries
- [ ] List page loads with 8 summary cards, status/type/priority filters
- [ ] Add page has salon dropdown, type/priority selects
- [ ] Detail page shows info/contact/message cards + inline note form
- [ ] Edit page pre-fills all fields
- [ ] Status actions (In Progress, Resolve, Close, Spam) show confirmations

## Reports
- [ ] Main page loads with range selector and 8 metric cards + 6 report links
- [ ] Revenue report shows method/monthly breakdown tables + top salons
- [ ] Salon report shows status/business type bars + city table + recent salons
- [ ] Subscription report shows cycle/plan breakdown + expiring soon
- [ ] Payment report shows status/method breakdown + recent payments
- [ ] Enquiry report shows type/priority/status bars + recent enquiries
- [ ] Plan usage report shows plan table with revenue + module usage bars
- [ ] Custom date range works on all report pages

## Audit Logs
- [ ] List page loads with summary cards, actor/category filters
- [ ] Detail page shows action/actor/entity cards + before/after JSON blocks
- [ ] Read-only — no edit/delete actions

## Settings
- [ ] Page loads with all 5 sections (General, Support, Legal, Controls, Modules)
- [ ] Save button updates settings
- [ ] Ensure Defaults button fills missing keys
- [ ] Maintenance mode shows warning banner
- [ ] Module checkboxes highlight correctly

## Cross-cutting
- [ ] All list pages show loading spinner during fetch
- [ ] All list pages show error state with retry on failure
- [ ] All list pages show empty state when no data
- [ ] All copy buttons work (salon ID, subscription ID, payment ID, enquiry ID)
- [ ] All confirm dialogs block destructive actions
- [ ] Responsive layout works on mobile/tablet
- [ ] No salon operational UI (appointments, customers, POS, services, staff) exists
