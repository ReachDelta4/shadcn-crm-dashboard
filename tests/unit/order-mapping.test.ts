import { describe, it, expect } from "vitest";
import { mapOrderRecord, type OrderStatus } from "@/features/dashboard/pages/orders/types/order";

describe("mapOrderRecord", () => {
  it("maps snake_case order fields including customer_id and timestamps", () => {
    const raw = {
      id: "ord_1",
      order_number: "ORD-001",
      customer_id: "cust_1",
      customer_name: "Acme Corp",
      email: "a@b.com",
      phone: "123",
      amount: 1500,
      status: "processing" as OrderStatus,
      date: "2025-02-01T00:00:00.000Z",
      items: 2,
      payment_method: "card",
      lead_id: "lead_1",
      created_at: "2025-02-01T00:00:00.000Z",
      updated_at: "2025-02-02T00:00:00.000Z",
    };

    const mapped = mapOrderRecord(raw);

    expect(mapped.id).toBe("ord_1");
    expect(mapped.orderNumber).toBe("ORD-001");
    expect(mapped.customerId).toBe("cust_1");
    expect(mapped.customerName).toBe("Acme Corp");
    expect(mapped.email).toBe("a@b.com");
    expect(mapped.phone).toBe("123");
    expect(mapped.status).toBe("processing");
    expect(mapped.date).toBe("2025-02-01T00:00:00.000Z");
    expect(mapped.items).toBe(2);
    expect(mapped.lead_id).toBe("lead_1");
    expect(mapped.createdAt).toBe("2025-02-01T00:00:00.000Z");
    expect(mapped.updatedAt).toBe("2025-02-02T00:00:00.000Z");
  });

  it("falls back safely when optional fields are missing", () => {
    const raw = {
      id: "ord_2",
      order_number: "ORD-002",
      customer_name: "Fallback Corp",
      email: "fallback@example.com",
      amount: undefined,
      status: undefined,
      // date, created_at, updated_at intentionally omitted
    };

    const mapped = mapOrderRecord(raw);

    expect(mapped.id).toBe("ord_2");
    expect(mapped.orderNumber).toBe("ORD-002");
    expect(mapped.customerName).toBe("Fallback Corp");
    expect(mapped.email).toBe("fallback@example.com");
    expect(typeof mapped.amount).toBe("number");
    expect(typeof mapped.createdAt).toBe("string");
    expect(typeof mapped.updatedAt).toBe("string");
  });

  it("returns already-normalized Order objects unchanged", () => {
    const existing = {
      id: "ord_3",
      orderNumber: "ORD-003",
      customerId: "cust_3",
      customerName: "Existing Corp",
      email: "ex@example.com",
      amount: 999,
      status: "pending" as OrderStatus,
      date: "2025-02-01T00:00:00.000Z",
      items: 1,
      paymentMethod: "cash",
      createdAt: "2025-02-01T00:00:00.000Z",
      updatedAt: "2025-02-01T00:00:00.000Z",
    };

    const mapped = mapOrderRecord(existing);

    expect(mapped).toBe(existing);
  });
});

