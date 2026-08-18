import { describe, expect, it } from "vitest";

describe("Clerk credential configuration", () => {
  it("accepts the configured secret key for a lightweight instance lookup", async () => {
    const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
    const serverPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    expect(publishableKey, "VITE_CLERK_PUBLISHABLE_KEY must be configured").toMatch(/^pk_/);
    expect(serverPublishableKey, "CLERK_PUBLISHABLE_KEY must be configured").toBe(publishableKey);
    expect(secretKey, "CLERK_SECRET_KEY must be configured").toMatch(/^sk_/);

    const response = await fetch("https://api.clerk.com/v1/instance", {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    expect(response.ok, `Clerk returned HTTP ${response.status}`).toBe(true);
  }, 20_000);
});
