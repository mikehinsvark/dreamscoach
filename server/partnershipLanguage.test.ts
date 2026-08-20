import { describe, expect, it } from "vitest";
import { prospectMetrics } from "@shared/prospect";

describe("strategic partnership language", () => {
  it("uses partner-facing labels while retaining the stable stored metric key", () => {
    const partnershipMetric = prospectMetrics.find((metric) => metric.key === "recruits");

    expect(partnershipMetric).toMatchObject({
      key: "recruits",
      label: "Strategic Partners",
      shortLabel: "Partners",
      unit: "partners",
    });
  });
});
