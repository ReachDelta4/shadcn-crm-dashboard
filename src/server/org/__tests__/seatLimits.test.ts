import { describe, expect, it } from "vitest";
import { willExceedSeatLimit, type SeatLimits, type SeatUsage } from "../seatLimits";

const limits: SeatLimits = { admins: 1, managers: 2, supervisors: 3, users: 5 };
const usage: SeatUsage = { admins: 1, managers: 1, supervisors: 0, users: 4 };

describe("willExceedSeatLimit", () => {
  it("blocks when limit is zero", () => {
    const res = willExceedSeatLimit({
      role: "supervisor",
      limits: { ...limits, supervisors: 0 },
      usage,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/zero/);
  });

  it("blocks when usage meets limit", () => {
    const res = willExceedSeatLimit({
      role: "org_admin",
      limits,
      usage,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/limit reached/i);
  });

  it("allows when seats are available", () => {
    const res = willExceedSeatLimit({
      role: "manager",
      limits,
      usage,
    });
    expect(res.allowed).toBe(true);
  });
});
