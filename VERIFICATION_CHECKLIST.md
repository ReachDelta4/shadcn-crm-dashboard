# ✅ Verification Checklist

## Pre-Testing Setup

- [ ] Ensure database is running (Supabase)
- [ ] Run `npm run dev` to start development server
- [ ] Open browser to `http://localhost:3000`
- [ ] Ensure you're logged in to the dashboard

---

## 1. Sessions Calendar Testing

### Navigate to Calendar
- [ ] Go to `/dashboard/sessions/calendar`
- [ ] Verify page loads without errors

### Create Test Appointment
- [ ] Go to `/dashboard/leads`
- [ ] Select an existing lead OR create a new one
- [ ] Click the status dropdown
- [ ] Select "Demo Appointment"
- [ ] Fill in appointment details:
  - [ ] Start date/time (future date)
  - [ ] End date/time
  - [ ] Provider (Google Meet, Zoom, etc.)
  - [ ] Meeting link
- [ ] Submit the appointment

### Verify Calendar Display
- [ ] Return to `/dashboard/sessions/calendar`
- [ ] Navigate to the month of your test appointment
- [ ] Verify the date is **highlighted/bold**
- [ ] Click on the date with the appointment
- [ ] Verify appointment appears in the list below
- [ ] Check appointment details are correct:
  - [ ] Title shows "Appointment (provider)"
  - [ ] Time displays correctly (start - end)
  - [ ] "Join" button appears if meeting link exists
- [ ] Click "Join" button (should open meeting link)

### Test Edge Cases
- [ ] Select a date with no appointments (should show empty state)
- [ ] Change months (should reload appointments)
- [ ] Check loading skeleton appears briefly
- [ ] Verify error handling (disconnect internet, should show error)

---

## 2. Invoice Creation Testing

### Open Invoice Dialog
- [ ] Go to `/dashboard/invoices`
- [ ] Look for "New Invoice" button with V2 implementation
- [ ] Click to open dialog
- [ ] Verify dialog is large (900px max width)

### Test Product Picker
- [ ] Click "Select product..." in first line item
- [ ] Type to search for a product
- [ ] Verify:
  - [ ] Search debounces (300ms delay)
  - [ ] Results show product name, price, SKU
  - [ ] Recurring interval shown if applicable
  - [ ] Loading state displays while fetching
- [ ] Select a product
- [ ] Verify product is displayed in button

### Test Payment Plan Picker (One-Time Product)
- [ ] Ensure selected product is NOT recurring
- [ ] Verify "Payment Plan (Optional)" field appears
- [ ] Click to open payment plan picker
- [ ] Verify:
  - [ ] Plans load for selected product
  - [ ] Shows "No payment plan" option
  - [ ] Displays installments and interval
  - [ ] Down payment shown if applicable
- [ ] Select a payment plan
- [ ] Verify plan is displayed in button

### Test Payment Plan Picker (Recurring Product)
- [ ] Select a product WITH recurring interval
- [ ] Verify payment plan picker does NOT appear

### Test Multiple Line Items
- [ ] Click "Add Line" button
- [ ] Verify new line item card appears
- [ ] Add 2-3 products
- [ ] Verify each has independent:
  - [ ] Product picker
  - [ ] Quantity field
  - [ ] Discount fields
  - [ ] Payment plan (if applicable)
  - [ ] Remove button

### Test Live Preview
- [ ] Add products with different prices
- [ ] Verify "Preview Totals" card appears
- [ ] Check calculations:
  - [ ] Subtotal = sum of (price × quantity)
  - [ ] Discount applies correctly (percent or amount)
  - [ ] Tax calculated on after-discount amount
  - [ ] Total = subtotal - discount + tax
- [ ] Change quantity, verify totals update
- [ ] Add discount, verify totals update
- [ ] Remove line item, verify totals update

### Test Form Validation
- [ ] Try to submit with no product selected
- [ ] Verify submit button is disabled
- [ ] Try invalid email format
- [ ] Verify error message appears
- [ ] Fill all required fields correctly
- [ ] Verify submit button is enabled

### Test Invoice Creation
- [ ] Fill in:
  - [ ] Customer name
  - [ ] Email
  - [ ] Optional: Link to lead
  - [ ] At least one line item with product
  - [ ] Optional: Payment plan
- [ ] Click "Create Invoice"
- [ ] Verify:
  - [ ] Loading state (button shows "Creating…")
  - [ ] Success (dialog closes, invoice appears in list)
  - [ ] No errors in console

### Verify Database Records
- [ ] Open database (Supabase dashboard)
- [ ] Check `invoices` table for new record
- [ ] Verify `total_minor` matches preview
- [ ] Check `invoice_lines` table for line items
- [ ] If payment plan: check `invoice_payment_schedules` table
- [ ] If recurring: check `recurring_revenue_schedules` table

---

## 3. Lead Status Testing

### Create Lead with Advanced Status
- [ ] Go to `/dashboard/leads`
- [ ] Click "New Lead"
- [ ] Fill in required fields
- [ ] Open "Status" dropdown
- [ ] Verify ALL statuses are available:
  - [ ] New
  - [ ] Contacted
  - [ ] Qualified
  - [ ] Unqualified
  - [ ] Demo Appointment
  - [ ] Proposal/Negotiation
  - [ ] Invoice Sent
  - [ ] Won
  - [ ] Lost
  - [ ] Converted
- [ ] Select "Proposal/Negotiation"
- [ ] Submit lead
- [ ] Verify:
  - [ ] No validation errors
  - [ ] Lead appears in list with correct status

### Update Lead Status Directly
- [ ] Click on a lead to view details
- [ ] If edit dialog available, change status
- [ ] OR use PATCH `/api/leads/[id]` via API
- [ ] Verify status updates without error

### Test Status Transition with Side Effects
- [ ] Select a lead with status "qualified"
- [ ] Use status dropdown to transition to "Demo Appointment"
- [ ] Fill appointment details
- [ ] Submit
- [ ] Verify:
  - [ ] Lead status updates
  - [ ] Appointment record created
  - [ ] Appointment appears in Sessions Calendar

---

## 4. TypeScript & Code Quality

### TypeScript Compilation
- [ ] Run `npx tsc --noEmit --skipLibCheck`
- [ ] Verify: **0 errors** ✅

### ESLint (if configured)
- [ ] Run `npm run lint`
- [ ] Verify no critical errors

### Console Errors
- [ ] Open browser DevTools console
- [ ] Navigate through all tested pages
- [ ] Verify: No red errors (warnings OK)

---

## 5. API Endpoint Testing (Optional)

### Test Appointments API
```bash
curl "http://localhost:3000/api/appointments?from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z" \
  -H "Cookie: sb-[your-session-cookie]"
```
- [ ] Returns JSON with appointments array
- [ ] Includes meta object (from, to, count, limit)

### Test Product Search API
```bash
curl "http://localhost:3000/api/products?search=test&active=true&pageSize=50" \
  -H "Cookie: sb-[your-session-cookie]"
```
- [ ] Returns products matching search
- [ ] Filters to active products

### Test Payment Plans API
```bash
curl "http://localhost:3000/api/products/[product-uuid]/plans" \
  -H "Cookie: sb-[your-session-cookie]"
```
- [ ] Returns payment plans for product
- [ ] Empty array if no plans

---

## 6. Edge Cases & Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to load calendar
- [ ] Verify error message displays
- [ ] Reconnect internet
- [ ] Verify auto-recovery or refetch works

### Invalid Data
- [ ] Try to create invoice with invalid product UUID
- [ ] Verify error handling
- [ ] Check error message is user-friendly

### Empty States
- [ ] View calendar with no appointments
- [ ] Verify "No appointments" message
- [ ] Try product search with no results
- [ ] Verify "No product found" message

### Loading States
- [ ] On slow network, verify skeletons appear
- [ ] Verify buttons show "Loading..." or spinner
- [ ] Verify disabled state during operations

---

## 7. UI/UX Quality

### Visual Design
- [ ] All components use Shadcn UI styling
- [ ] Consistent spacing and padding
- [ ] Proper dark mode support (if enabled)
- [ ] Icons are aligned and sized correctly

### Responsive Design
- [ ] Test on mobile viewport (DevTools)
- [ ] Verify dialogs scroll on small screens
- [ ] Check grid layouts adapt (stack on mobile)

### Accessibility
- [ ] Tab navigation works through forms
- [ ] Enter key submits forms
- [ ] Escape key closes dialogs
- [ ] Error messages have proper ARIA attributes

---

## 8. Performance

### Page Load Time
- [ ] Calendar page loads in < 2 seconds
- [ ] Invoice dialog opens instantly
- [ ] Product search debounces (doesn't lag)

### Memory Leaks
- [ ] Open/close dialogs multiple times
- [ ] Navigate between pages
- [ ] Check DevTools Memory tab for growth

---

## Final Checklist

- [ ] All 3 phases tested and verified
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All features work as documented
- [ ] Database records created correctly
- [ ] Error handling works
- [ ] Loading states display
- [ ] Empty states display
- [ ] UI is polished and responsive

---

## Known Limitations (Document Any Found)

1. _[Add any issues discovered during testing]_
2. _[Add any edge cases not handled]_
3. _[Add any performance concerns]_

---

## Sign-Off

- **Tester Name:** _________________
- **Date:** _________________
- **Result:** ☐ Pass ☐ Fail ☐ Pass with issues
- **Notes:** _________________________________

---

**All checks passed?** 🎉 Implementation is production-ready!  
**Issues found?** Document above and create GitHub issues for tracking.
