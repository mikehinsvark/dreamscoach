import { describe, expect, it } from "vitest";
import { getClerkAuthorizationHeader } from "./clerkAuth";

describe("getClerkAuthorizationHeader", () => {
  it("forwards a signed-in Clerk session as a bearer token", async () => {
    await expect(getClerkAuthorizationHeader(async () => "clerk-session-token")).resolves.toEqual({
      Authorization: "Bearer clerk-session-token",
    });
  });

  it("does not send an authorization header when no Clerk session exists", async () => {
    await expect(getClerkAuthorizationHeader(async () => null)).resolves.toEqual({});
  });
});
