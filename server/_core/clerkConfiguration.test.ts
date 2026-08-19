import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexPath = new URL("./index.ts", import.meta.url);
const contextPath = new URL("./context.ts", import.meta.url);

describe("production Clerk server configuration", () => {
  it("uses the configured live keys for middleware and profile synchronization", () => {
    const indexSource = readFileSync(indexPath, "utf8");
    const contextSource = readFileSync(contextPath, "utf8");

    expect(indexSource).toContain("publishableKey: ENV.clerkPublishableKey || undefined");
    expect(indexSource).toContain("secretKey: ENV.clerkSecretKey || undefined");
    expect(contextSource).toContain("createClerkClient({ secretKey: ENV.clerkSecretKey })");
    expect(contextSource).toContain("secretKey: ENV.clerkSecretKey");
  });
});
