import { describe, expect, it } from "vitest";

describe("GoHighLevel Dreams Cloud connection", () => {
  it("accepts an explicitly labeled connection-test payload at the configured company webhook", async () => {
    const webhookUrl = process.env.GHL_DREAMS_CLOUD_WEBHOOK_URL;
    expect(webhookUrl, "GHL_DREAMS_CLOUD_WEBHOOK_URL must be configured").toBeTruthy();

    const response = await fetch(webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "prospect_accountability_coach",
        eventType: "connection_test",
        test: true,
        occurredAt: new Date().toISOString(),
      }),
    });

    expect(response.ok, `Dreams Cloud returned HTTP ${response.status}`).toBe(true);
  }, 20_000);
});
