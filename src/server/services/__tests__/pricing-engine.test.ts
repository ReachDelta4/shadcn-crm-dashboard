import { describe, it, expect } from "vitest";
import {
  calculateInvoice,
  generatePaymentSchedule,
  generateRecurringSchedule,
  type LineItemInput,
} from "@/server/services/pricing-engine";
import type { Product } from "@/server/repositories/products";
import type { ProductPaymentPlan } from "@/server/repositories/product-payment-plans";

function createProduct(partial: Partial<Product>): Product {
  return {
    id: partial.id ?? "prod_1",
    owner_id: "owner",
    org_id: null,
    name: "Test Product",
    sku: null,
    currency: partial.currency ?? "INR",
    price_minor: partial.price_minor ?? 10_000,
    tax_rate_bp: partial.tax_rate_bp ?? 1_800, // 18%
    cogs_type: partial.cogs_type ?? null,
    cogs_value: partial.cogs_value ?? null,
    discount_type: partial.discount_type ?? null,
    discount_value: partial.discount_value ?? null,
    recurring_interval: partial.recurring_interval ?? null,
    recurring_interval_days: partial.recurring_interval_days ?? null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("pricing engine", () => {
  it("calculates invoice totals with discounts and tax", () => {
    const product = createProduct({
      id: "prod_flat",
      price_minor: 50_000,
      tax_rate_bp: 1_800,
      discount_type: "percent",
      discount_value: 1_000, // 10%
    });

    const calc = calculateInvoice([product], [
      {
        product_id: "prod_flat",
        quantity: 2,
      } satisfies LineItemInput,
    ]);

    expect(calc.total_minor).toBeGreaterThan(0);
    expect(calc.lines[0].discount_minor).toBe(10_000);
    expect(calc.lines[0].tax_minor).toBe(16_200);
    expect(calc.lines[0].total_minor).toBe(106_200);
    expect(calc.total_discount_minor).toBe(10_000);
    expect(calc.total_tax_minor).toBe(16_200);
  });

  it("generates payment schedules honoring down payment and installments", () => {
    const plan: ProductPaymentPlan = {
      id: "plan_1",
      product_id: "prod_flat",
      org_id: null,
      name: "3 Part Plan",
      num_installments: 3,
      interval_type: "monthly",
      interval_days: null,
      down_payment_minor: 20_000,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const start = new Date("2025-01-15T00:00:00.000Z");
    const schedule = generatePaymentSchedule(plan, 100_000, start);

    expect(schedule).toHaveLength(4); // down + 3 installments
    expect(schedule[0].amount_minor).toBe(20_000);
    expect(schedule[0].installment_num).toBe(0);
    const total = schedule.reduce((sum, item) => sum + item.amount_minor, 0);
    expect(total).toBe(100_000);
    expect(schedule[1].installment_num).toBe(1);
    expect(schedule[1].description).toContain("1 of 3");
  });

  it("generates recurring revenue projections", () => {
    const product = createProduct({
      id: "prod_subscription",
      recurring_interval: "monthly",
    });

    const start = new Date("2025-04-01T00:00:00.000Z");
    const schedule = generateRecurringSchedule(product, 5_000, start, 6, 4);

    expect(schedule).toHaveLength(4);
    expect(schedule[0].cycle_num).toBe(1);
    expect(schedule[0].amount_minor).toBe(5_000);
    expect(schedule[3].cycle_num).toBe(4);
    expect(new Date(schedule[3].billing_at_utc).getUTCMonth()).toBe(7); // July (three months after April)
  });
});
