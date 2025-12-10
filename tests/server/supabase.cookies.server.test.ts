import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock Supabase SSR client so we can inspect how cookies are wired
vi.mock("@supabase/ssr", () => {
  return {
    createServerClient: vi.fn(() => ({
      // Minimal surface; tests only care that it is constructed
      auth: {
        getUser: vi.fn(),
      },
    })),
  };
});

// Import after mocks so the module under test sees the mocked SSR client
import { createServerSupabase } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";

const createServerClientMock = createServerClient as unknown as ReturnType<typeof vi.fn>;

describe("createServerSupabase cookie wiring", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    createServerClientMock.mockClear();
  });

  it("configures Supabase with read-only cookie methods for server component usage", async () => {
    await createServerSupabase();

    expect(createServerClientMock).toHaveBeenCalledTimes(1);

    const [, , options] = createServerClientMock.mock.calls[0] as any[];
    const cookieMethods = options.cookies;

    // We must expose a getAll method so Supabase can read cookies
    expect(typeof cookieMethods.getAll).toBe("function");

    // Deprecated single-cookie methods must NOT be present
    expect("get" in cookieMethods).toBe(false);
    expect("set" in cookieMethods).toBe(false);
    expect("remove" in cookieMethods).toBe(false);

    // We intentionally provide a no-op setAll so Supabase SSR is satisfied
    // but no actual cookie mutations happen from this context.
    expect(typeof cookieMethods.setAll).toBe("function");
  });

  it("throws a clear error when Supabase env is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(createServerSupabase()).rejects.toThrow("Supabase env not configured");
  });
});
