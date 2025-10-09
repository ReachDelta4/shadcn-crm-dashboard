import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('🌱 Seeding revenue test data...')

  // 1. Create a one-time product
  const oneTimeProduct = await fetch(`${supabaseUrl.replace('/v1', '')}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Test One-Time Product',
      sku: 'TEST-OT-001',
      currency: 'INR',
      price_minor: 100000, // ₹1000
      tax_rate_bp: 1800, // 18%
      cogs_type: 'percent',
      cogs_value: 5000, // 50%
      recurring_interval: null,
      active: true,
    })
  }).then(r => r.json())

  console.log('✅ Created one-time product:', oneTimeProduct[0]?.id)

  // 2. Create a payment plan for one-time product
  const paymentPlan = await fetch(`${supabaseUrl.replace('/v1', '')}/rest/v1/product_payment_plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      product_id: oneTimeProduct[0].id,
      name: '3-Month Plan',
      num_installments: 3,
      interval_type: 'monthly',
      interval_days: null,
      down_payment_minor: 20000, // ₹200 down
      active: true,
    })
  }).then(r => r.json())

  console.log('✅ Created payment plan:', paymentPlan[0]?.id)

  // 3. Create a recurring product
  const recurringProduct = await fetch(`${supabaseUrl.replace('/v1', '')}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Test Recurring Subscription',
      sku: 'TEST-REC-001',
      currency: 'INR',
      price_minor: 50000, // ₹500/month
      tax_rate_bp: 1800, // 18%
      recurring_interval: 'monthly',
      recurring_interval_days: null,
      active: true,
    })
  }).then(r => r.json())

  console.log('✅ Created recurring product:', recurringProduct[0]?.id)

  console.log('\n📊 Seed complete! Test by:')
  console.log('1. Create an invoice with Test One-Time Product + 3-Month Plan')
  console.log('   → Verify 3 payment schedules appear in Financials (with down payment)')
  console.log('2. Create an invoice with Test Recurring Subscription + 12 cycles')
  console.log('   → Verify 12 recurring cycles appear in Financials')
  console.log('3. Mark schedules paid/billed and verify invoice status + revenue changes')
}

seed().catch(console.error)
