import type { ProspectMetrics } from "../shared/prospect";
import { createCrmSyncEvent, getCrmConnection, getCrmContactId, updateCrmSyncEvent } from "./db";

type GhlSyncInput = {
  repId: number;
  repName: string | null;
  repEmail: string | null;
  eventType: "weekly_plan_saved" | "weekly_result_submitted";
  weeklyGoalId: number;
  weeklyResultId?: number;
  weekStart: string;
  goals: ProspectMetrics;
  actuals?: ProspectMetrics;
  attainmentPercent?: number;
  commitment?: string | null;
};

/**
 * Sends only to the shared GoHighLevel Dreams Cloud URL intentionally configured
 * as a project secret. Until then, the event remains visibly marked disabled.
 */
export async function syncToGhlDreamsCloud(input: GhlSyncInput) {
  const externalContactId = await getCrmContactId(input.repId);
  const payload = {
    source: "prospect_accountability_coach",
    eventType: input.eventType,
    rep: { id: input.repId, name: input.repName, email: input.repEmail, ghlContactId: externalContactId },
    weekStart: input.weekStart,
    goals: input.goals,
    actuals: input.actuals ?? null,
    attainmentPercent: input.attainmentPercent ?? null,
    commitment: input.commitment ?? null,
    occurredAt: new Date().toISOString(),
  };
  const eventId = await createCrmSyncEvent({
    repId: input.repId,
    weeklyGoalId: input.weeklyGoalId,
    weeklyResultId: input.weeklyResultId ?? null,
    eventType: input.eventType,
    externalContactId,
    payloadJson: JSON.stringify(payload),
  });

  const webhookUrl = process.env.GHL_DREAMS_CLOUD_WEBHOOK_URL;
  const connection = await getCrmConnection("ghl_dreams_cloud");
  if (!webhookUrl || !connection?.enabled) return { status: "disabled" as const, eventId };

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.GHL_DREAMS_CLOUD_SHARED_SECRET) headers["X-Prospect-Webhook-Secret"] = process.env.GHL_DREAMS_CLOUD_SHARED_SECRET;
    const response = await fetch(webhookUrl, { method: "POST", headers, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Dreams Cloud responded with HTTP ${response.status}`);
    await updateCrmSyncEvent(eventId, "delivered");
    return { status: "delivered" as const, eventId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Dreams Cloud delivery error";
    await updateCrmSyncEvent(eventId, "failed", message);
    return { status: "failed" as const, eventId, message };
  }
}
