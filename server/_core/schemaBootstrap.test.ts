import { describe, expect, it } from "vitest";
import { schemaStatements } from "./schemaBootstrap";

describe("Railway first-run schema bootstrap", () => {
  it("creates every Prospect Coach table idempotently without destructive statements", () => {
    const schema = schemaStatements.join("\n");
    for (const table of [
      "coachingReports",
      "crmConnections",
      "crmSyncEvents",
      "managerAssignments",
      "userCrmLinks",
      "users",
      "weeklyGoals",
      "weeklyResults",
    ]) {
      expect(schema).toContain(`CREATE TABLE IF NOT EXISTS \`${table}\``);
    }
    expect(schema).not.toMatch(/\bDROP\b|\bDELETE\b|\bTRUNCATE\b/i);
  });
});
