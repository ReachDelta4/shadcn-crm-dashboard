# Quick Reference Guide - New Components & APIs

## 📅 Sessions Calendar

### Using the Appointments API

```typescript
// GET /api/appointments
// Query parameters:
// - from: ISO 8601 date (optional, defaults to today)
// - to: ISO 8601 date (optional, defaults to from + 30 days)
// - limit: number (optional, max 500, defaults to 200)

const response = await fetch('/api/appointments?from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z&limit=100')
const data = await response.json()
// Returns: { appointments: [...], meta: { from, to, count, limit } }
```

### Using the Appointments Hook

```typescript
import { useAppointments } from '@/features/calendar/hooks/use-appointments'
import { startOfMonth, endOfMonth } from 'date-fns'

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const { events, loading, error, refetch } = useAppointments({
    from: startOfMonth(selectedDate).toISOString(),
    to: endOfMonth(selectedDate).toISOString(),
    enabled: true, // optional, defaults to true
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {events.map(event => (
        <div key={event.id}>
          {event.title} - {event.start_at_utc}
        </div>
      ))}
    </div>
  )
}
```

### Event Normalization

```typescript
import { normalizeAppointments, type CalendarEvent } from '@/features/calendar/lib/normalize'

// Manually normalize appointments from API
const rawAppointments = await fetchAppointments()
const events: CalendarEvent[] = normalizeAppointments(rawAppointments)

// CalendarEvent structure:
// {
//   id: string
//   source_type: 'appointment' | 'payment_schedule' | 'recurring_revenue' | 'task'
//   title: string
//   start_at_utc: string (ISO 8601)
//   end_at_utc: string (ISO 8601)
//   timezone: string
//   links: {
//     subject_id?: string
//     lead_id?: string
//     meeting_link?: string
//   }
//   meta: Record<string, any>
// }
```

---

## 🛒 Product Picker Component

### Basic Usage

```typescript
import { ProductPicker } from '@/features/dashboard/components/product-picker'

function MyInvoiceForm() {
  const [productId, setProductId] = useState<string>('')
  const [product, setProduct] = useState<Product | null>(null)

  return (
    <ProductPicker
      value={productId}
      onValueChange={(id, productData) => {
        setProductId(id)
        setProduct(productData)
      }}
      disabled={false} // optional
    />
  )
}
```

### Product Type

```typescript
interface Product {
  id: string
  name: string
  sku: string | null
  currency: string
  price_minor: number
  recurring_interval: string | null
}
```

### Features
- Searches products with 300ms debounce
- Filters to active products only
- Displays price in formatted currency
- Shows SKU and recurring interval if present
- Keyboard navigation (arrow keys, enter to select)

---

## 💳 Payment Plan Picker Component

### Basic Usage

```typescript
import { PaymentPlanPicker } from '@/features/dashboard/components/payment-plan-picker'

function MyInvoiceLineItem() {
  const [productId, setProductId] = useState<string>('')
  const [planId, setPlanId] = useState<string | null>(null)
  const [plan, setPlan] = useState<PaymentPlan | null>(null)

  return (
    <PaymentPlanPicker
      productId={productId} // Required: fetches plans for this product
      value={planId || undefined}
      onValueChange={(id, planData) => {
        setPlanId(id)
        setPlan(planData)
      }}
      disabled={false} // optional
    />
  )
}
```

### PaymentPlan Type

```typescript
interface PaymentPlan {
  id: string
  name: string
  num_installments: number
  interval_type: string
  interval_days: number | null
  down_payment_minor: number | null
}
```

### Features
- Auto-fetches plans when `productId` changes
- Shows "No payment plans available" when none exist
- Includes "No payment plan" option to clear selection
- Displays installments, interval, and down payment
- Only relevant for one-time products (not recurring)

---

## 🧾 Enhanced Invoice Creation Dialog

### Usage

```typescript
import { NewInvoiceDialogV2 } from '@/features/dashboard/pages/invoices/components/new-invoice-dialog-v2'

function InvoicesPage() {
  const handleInvoiceCreated = () => {
    // Refresh invoice list, show success message, etc.
    refetchInvoices()
  }

  return (
    <NewInvoiceDialogV2 onCreated={handleInvoiceCreated} />
  )
}
```

### Features
- **Product Selection:** Searchable dropdown (no UUIDs!)
- **Payment Plans:** Auto-loads for selected product (one-time only)
- **Multiple Line Items:** Add/remove with card-based UI
- **Live Preview:** See subtotal, discount, tax, total before submission
- **Discounts:** Percent or amount, per line item
- **Validation:** Client-side and server-side with clear error messages

### Submitted Data Structure

```typescript
// POST /api/invoices
{
  customer_name: string
  email: string
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled"
  lead_id?: string (UUID)
  line_items: [
    {
      product_id: string (UUID)
      quantity: number
      discount_type?: "percent" | "amount"
      discount_value?: number
      payment_plan_id?: string (UUID)
    }
  ]
}
```

### Backend Response
- Creates invoice record
- Calculates totals via pricing engine
- Generates line items
- Creates payment schedules (if payment plan)
- Creates recurring schedules (if recurring product)
- Returns invoice with all related data

---

## 🎯 Lead Status Management

### Available Statuses

```typescript
type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'demo_appointment'
  | 'proposal_negotiation'
  | 'invoice_sent'
  | 'won'
  | 'lost'
  | 'converted'
```

### Creating a Lead with Status

```typescript
// POST /api/leads
{
  full_name: "John Doe",
  email: "john@example.com",
  phone: "555-1234",
  company: "Acme Inc",
  value: 50000,
  status: "qualified", // Can now be any valid status
  source: "website"
}
```

### Updating Lead Status (Simple)

```typescript
// PATCH /api/leads/[id]
{
  status: "proposal_negotiation" // Direct status update
}
```

### Updating Lead Status (With Side Effects)

```typescript
// POST /api/leads/[id]/transition
// Use this for statuses that trigger additional actions:
// - demo_appointment: Creates appointment record
// - invoice_sent: Creates invoice with line items

{
  status_to: "demo_appointment",
  appointment: {
    start_at_utc: "2025-10-15T14:00:00Z",
    end_at_utc: "2025-10-15T15:00:00Z",
    timezone: "America/New_York",
    provider: "google_meet",
    meeting_link: "https://meet.google.com/abc-defg-hij"
  }
}
```

---

## 🔧 Utility Functions

### Event Normalization

```typescript
import { normalizeAppointment } from '@/features/calendar/lib/normalize'

// Single appointment
const event = normalizeAppointment(rawAppointment)
if (event) {
  // Valid event
} else {
  // Invalid appointment (failed validation)
}

// Batch appointments
const events = normalizeAppointments(rawAppointments)
// Returns only valid events, filters out invalid ones
```

### Date Utilities

```typescript
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns'

// Get month range
const from = startOfMonth(new Date())
const to = endOfMonth(new Date())

// Format for API
const fromISO = from.toISOString()
const toISO = to.toISOString()

// Parse and format for display
const date = parseISO("2025-10-15T14:00:00Z")
const formatted = format(date, 'h:mm a') // "2:00 PM"
```

---

## 🧪 Testing Examples

### Test Appointments API

```bash
# Fetch appointments for October 2025
curl "http://localhost:3000/api/appointments?from=2025-10-01T00:00:00Z&to=2025-10-31T23:59:59Z" \
  -H "Cookie: your-session-cookie"
```

### Test Product Search

```bash
# Search products
curl "http://localhost:3000/api/products?search=premium&active=true&pageSize=50" \
  -H "Cookie: your-session-cookie"
```

### Test Payment Plans

```bash
# Get payment plans for a product
curl "http://localhost:3000/api/products/[product-id]/plans" \
  -H "Cookie: your-session-cookie"
```

### Create Invoice with Payment Plan

```bash
curl -X POST "http://localhost:3000/api/invoices" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "customer_name": "Test Customer",
    "email": "test@example.com",
    "status": "draft",
    "line_items": [
      {
        "product_id": "uuid-here",
        "quantity": 1,
        "payment_plan_id": "plan-uuid-here"
      }
    ]
  }'
```

---

## 🎨 UI Component Patterns

### Loading State

```typescript
{loading ? (
  <Skeleton className="h-64 w-full" />
) : (
  <Calendar ... />
)}
```

### Error State

```typescript
{error && (
  <Card className="border-destructive">
    <CardContent className="pt-6">
      <p className="text-sm text-destructive">{error}</p>
    </CardContent>
  </Card>
)}
```

### Empty State

```typescript
{events.length === 0 ? (
  <p className="text-sm text-muted-foreground text-center py-4">
    No appointments on this date
  </p>
) : (
  <EventList events={events} />
)}
```

---

## 📦 Import Paths

```typescript
// Calendar
import { useAppointments } from '@/features/calendar/hooks/use-appointments'
import { normalizeAppointments, type CalendarEvent } from '@/features/calendar/lib/normalize'

// Product & Payment Plan Pickers
import { ProductPicker, type Product } from '@/features/dashboard/components/product-picker'
import { PaymentPlanPicker, type PaymentPlan } from '@/features/dashboard/components/payment-plan-picker'

// Invoice Dialog
import { NewInvoiceDialogV2 } from '@/features/dashboard/pages/invoices/components/new-invoice-dialog-v2'

// UI Components (Shadcn)
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
```

---

## 🚀 Quick Start Checklist

- [ ] Run `npm run dev` to start development server
- [ ] Navigate to `/dashboard/sessions/calendar` to see appointments
- [ ] Create a lead and transition to `demo_appointment` to create test data
- [ ] Navigate to `/dashboard/invoices` and try creating invoice with product picker
- [ ] Test payment plan selection for one-time products
- [ ] Verify live preview updates as you change line items
- [ ] Create a lead with different status options
- [ ] Check database for created appointments, invoices, and schedules

---

## 💡 Pro Tips

1. **Debounced Search:** Product search debounces at 300ms - wait for it!
2. **Payment Plans:** Only appear for products without `recurring_interval`
3. **Calendar Events:** Dates with events show bold text and colored background
4. **Error Handling:** All components gracefully handle API failures
5. **Type Safety:** Use TypeScript autocomplete for all props and return values
6. **Keyboard Navigation:** Use arrow keys in product/plan pickers for efficiency
7. **Live Preview:** Invoice totals update as you type - no need to submit first
8. **Validation:** Zod schemas ensure data integrity at every layer

---

**Need Help?** Check the full implementation documentation in `IMPLEMENTATION_COMPLETE.md`
