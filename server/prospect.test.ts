import { describe, expect, it } from "vitest";
import { calculateAttainment, createCoachingMessage, defaultProspectGoals, isMondayWeekStart } from "../shared/prospect";

describe("Prospect weekly calculations", () => {
  it("calculates the average category attainment from a weekly plan", () => {
    const result = calculateAttainment(defaultProspectGoals, {
      phoneHours: 15,
      recruits: 1,
      outreachContacts: 20,
      submittedApplications: 4,
      pipelineAppointments: 10,
      engagements: 6,
      closedGcv: 2500,
      targetProspects: 20,
    });
    expect(result.categories.find((category) => category.key === "outreachContacts")?.percentage).toBe(50);
    expect(result.average).toBe(88);
  });

  it("does not divide by zero when a category was not planned", () => {
    const result = calculateAttainment({ ...defaultProspectGoals, recruits: 0 }, { ...defaultProspectGoals, recruits: 0 });
    expect(result.categories.find((category) => category.key === "recruits")?.percentage).toBeNull();
    expect(result.average).toBe(100);
  });

  it("keeps coaching guidance constructive and recognises Monday planning dates", () => {
    expect(createCoachingMessage(38)).toContain("visible commitment");
    expect(isMondayWeekStart("2026-08-17")).toBe(true);
    expect(isMondayWeekStart("2026-08-18")).toBe(false);
  });
});
