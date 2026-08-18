import { describe, expect, it } from "vitest";
import { clerkDisplayName, isConfiguredClerkAdmin } from "./clerkIdentity";

describe("Clerk identity helpers", () => {
  it("uses a full name first and treats the configured administrator email case-insensitively", () => {
    expect(clerkDisplayName({ clerkUserId: "user_1", email: "rep@example.com", firstName: "Mike", lastName: "Hinsvark", username: null })).toBe("Mike Hinsvark");
    expect(isConfiguredClerkAdmin("MIKE@example.com", "mike@example.com")).toBe(true);
  });

  it("falls back to username or email for an incomplete Clerk profile", () => {
    expect(clerkDisplayName({ clerkUserId: "user_2", email: "rep@example.com", firstName: null, lastName: null, username: "coachmike" })).toBe("coachmike");
  });
});
