import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type Role = "user" | "rep" | "manager" | "admin";

function contextFor(role: Role | null): TrpcContext {
  const user = role ? {
    id: role === "admin" ? 9001 : role === "manager" ? 9002 : 9003,
    openId: `test-${role}`,
    name: `Test ${role}`,
    email: `${role}@example.com`,
    loginMethod: "test",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } : null;
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("Protected Prospect Coach procedures", () => {
  it("rejects unauthenticated dashboard access before any data lookup", async () => {
    await expect(appRouter.createCaller(contextFor(null)).prospect.myDashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a representative from manager-only team access", async () => {
    await expect(appRouter.createCaller(contextFor("rep")).prospect.teamDashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects managers from the administrator-only CRM control", async () => {
    await expect(appRouter.createCaller(contextFor("manager")).prospect.setIntegrationStatus({ enabled: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a manager to query only their authorized team view", async () => {
    await expect(appRouter.createCaller(contextFor("manager")).prospect.teamDashboard()).resolves.toEqual([]);
  });

  it("allows an administrator to read and pause the company CRM control", async () => {
    const caller = appRouter.createCaller(contextFor("admin"));
    await expect(caller.prospect.integrationStatus()).resolves.toMatchObject({ provider: "GoHighLevel Dreams Cloud" });
    await expect(caller.prospect.setIntegrationStatus({ enabled: false })).resolves.toMatchObject({ enabled: false });
  });
});
