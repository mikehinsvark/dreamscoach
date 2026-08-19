import { describe, expect, it } from "vitest";
import { decryptBackupPayload, encryptBackupPayload, hasValidBackupToken } from "./backup";

describe("encrypted backup archive", () => {
  const secret = "an-encryption-secret-that-is-long-enough-for-the-backup-tests";
  const payload = {
    format: "dreamscoach.mysql-export.v1" as const,
    createdAt: "2026-08-19T00:00:00.000Z",
    tables: { users: [{ id: 1, email: "rep@example.com" }], weeklyGoals: [] },
  };

  it("round-trips a compressed encrypted archive without retaining the source data in clear text", () => {
    const archive = encryptBackupPayload(payload, secret);
    expect(archive).not.toContain("rep@example.com");
    expect(decryptBackupPayload(archive, secret)).toEqual(payload);
  });

  it("rejects a backup request token unless it is an exact match", () => {
    expect(hasValidBackupToken("scheduled-secret", "scheduled-secret")).toBe(true);
    expect(hasValidBackupToken("scheduled-secret-extra", "scheduled-secret")).toBe(false);
    expect(hasValidBackupToken(undefined, "scheduled-secret")).toBe(false);
  });
});
