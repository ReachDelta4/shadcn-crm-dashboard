import { describe, it, expect } from "vitest";
import { mapInvoiceRecord, type InvoiceStatus } from "@/features/dashboard/pages/invoices/types/invoice";

describe("mapInvoiceRecord", () => {
  it("maps snake_case invoice fields including customer_id and timestamps", () => {
    const raw = {
      id: "inv_1",
      invoice_number: "INV-001",
      customer_id: "cust_1",
      customer_name: "Acme Corp",
      email: "a@b.com",
      phone: "123",
      amount: 1000,
      status: "sent" as InvoiceStatus,
      date: "2025-01-01T00:00:00.000Z",
      due_date: "2025-01-10T00:00:00.000Z",
      items: 3,
      payment_method: "card",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-02T00:00:00.000Z",
    };

    const mapped = mapInvoiceRecord(raw);

    expect(mapped.id).toBe("inv_1");
    expect(mapped.invoiceNumber).toBe("INV-001");
    expect(mapped.customerId).toBe("cust_1");
    expect(mapped.customerName).toBe("Acme Corp");
    expect(mapped.email).toBe("a@b.com");
    expect(mapped.phone).toBe("123");
    expect(mapped.status).toBe("sent");
    expect(mapped.date).toBe("2025-01-01T00:00:00.000Z");
    expect(mapped.dueDate).toBe("2025-01-10T00:00:00.000Z");
    expect(mapped.createdAt).toBe("2025-01-01T00:00:00.000Z");
    expect(mapped.updatedAt).toBe("2025-01-02T00:00:00.000Z");
  });

  it("falls back safely when optional fields are missing", () => {
    const raw = {
      id: "inv_2",
      invoice_number: "INV-002",
      customer_name: "Fallback Corp",
      email: "fallback@example.com",
      amount: undefined,
      status: undefined,
      // date, due_date, created_at, updated_at intentionally omitted
    };

    const mapped = mapInvoiceRecord(raw);

    expect(mapped.id).toBe("inv_2");
    expect(mapped.invoiceNumber).toBe("INV-002");
    expect(mapped.customerName).toBe("Fallback Corp");
    expect(mapped.email).toBe("fallback@example.com");
    expect(typeof mapped.amount).toBe("number");
    // createdAt and updatedAt should be defined ISO strings
    expect(typeof mapped.createdAt).toBe("string");
    expect(typeof mapped.updatedAt).toBe("string");
  });

  it("returns already-normalized Invoice objects unchanged", () => {
    const existing = {
      id: "inv_3",
      invoiceNumber: "INV-003",
      customerId: "cust_3",
      customerName: "Existing Corp",
      email: "ex@example.com",
      amount: 500,
      status: "draft" as InvoiceStatus,
      date: "2025-01-01T00:00:00.000Z",
      dueDate: "2025-01-05T00:00:00.000Z",
      items: 1,
      paymentMethod: "card",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };

    const mapped = mapInvoiceRecord(existing);

    expect(mapped).toBe(existing);
  });
});

