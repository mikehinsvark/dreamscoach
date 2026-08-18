import { describe, expect, it } from "vitest";
import { canManageAssignments, canReviewTeam } from "./access";

describe("Prospect role boundaries", () => {
  it("permits only managers and administrators to review teams", () => {
    expect(canReviewTeam("rep")).toBe(false);
    expect(canReviewTeam("user")).toBe(false);
    expect(canReviewTeam("manager")).toBe(true);
    expect(canReviewTeam("admin")).toBe(true);
  });

  it("keeps manager assignments restricted to administrators", () => {
    expect(canManageAssignments("rep")).toBe(false);
    expect(canManageAssignments("manager")).toBe(false);
    expect(canManageAssignments("admin")).toBe(true);
  });
});
