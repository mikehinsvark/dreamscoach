import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  coachingReports,
  crmConnections,
  crmSyncEvents,
  InsertUser,
  managerAssignments,
  users,
  userCrmLinks,
  weeklyGoals,
  weeklyResults,
} from "../drizzle/schema";
import type { ProspectMetrics } from "../shared/prospect";
import { ENV } from "./_core/env";
import { ensureProspectCoachSchema } from "./_core/schemaBootstrap";

let _db: ReturnType<typeof drizzle> | null = null;
let _schemaReady: Promise<void> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  if (_db && !_schemaReady) {
    _schemaReady = ensureProspectCoachSchema(_db).catch((error) => {
      _schemaReady = null;
      throw error;
    });
  }
  if (_schemaReady) await _schemaReady;
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

/**
 * Retain an existing numeric user ID when a legacy account signs into Clerk with
 * the same verified email address, preserving related plans, results, assignments, and CRM links.
 */
export async function findOrAdoptClerkUser(user: InsertUser) {
  if (!user.openId) throw new Error("Clerk user ID is required");
  const existing = await getUserByOpenId(user.openId);
  if (existing) {
    await upsertUser(user);
    return (await getUserByOpenId(user.openId)) ?? existing;
  }

  const legacy = user.email ? await getUserByEmail(user.email) : undefined;
  if (legacy) {
    const db = await requireDb();
    const updates: Record<string, unknown> = {
      openId: user.openId,
      name: user.name ?? legacy.name,
      email: user.email ?? legacy.email,
      loginMethod: user.loginMethod ?? "clerk",
      lastSignedIn: new Date(),
    };
    if (user.role === "admin") updates.role = "admin";
    await db.update(users).set(updates).where(eq(users.id, legacy.id));
    return (await getUserByOpenId(user.openId)) ?? legacy;
  }

  await upsertUser(user);
  return getUserByOpenId(user.openId);
}

export async function saveWeeklyGoals(repId: number, weekStart: string, goals: ProspectMetrics) {
  const db = await requireDb();
  await db
    .insert(weeklyGoals)
    .values({ repId, weekStart, ...goals, status: "saved" })
    .onDuplicateKeyUpdate({ set: { ...goals, status: "saved", updatedAt: new Date() } });
  const result = await db
    .select()
    .from(weeklyGoals)
    .where(and(eq(weeklyGoals.repId, repId), eq(weeklyGoals.weekStart, weekStart)))
    .limit(1);
  return result[0];
}

export async function getWeeklyGoalForRep(repId: number, goalId: number) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(weeklyGoals)
    .where(and(eq(weeklyGoals.repId, repId), eq(weeklyGoals.id, goalId)))
    .limit(1);
  return result[0];
}

export async function listWeeklyGoalsForRep(repId: number) {
  const db = await requireDb();
  return db.select().from(weeklyGoals).where(eq(weeklyGoals.repId, repId)).orderBy(desc(weeklyGoals.weekStart));
}

export async function listWeeklyGoalsForReps(repIds: number[]) {
  if (!repIds.length) return [];
  const db = await requireDb();
  return db.select().from(weeklyGoals).where(inArray(weeklyGoals.repId, repIds)).orderBy(desc(weeklyGoals.weekStart));
}

export async function saveWeeklyResults(
  repId: number,
  weeklyGoalId: number,
  actuals: ProspectMetrics,
  reflection: string | null,
  commitment: string | null,
) {
  const db = await requireDb();
  await db
    .insert(weeklyResults)
    .values({
      repId,
      weeklyGoalId,
      ...actuals,
      reflection,
      commitment,
      status: "submitted",
      submittedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: { ...actuals, reflection, commitment, status: "submitted", submittedAt: new Date(), updatedAt: new Date() },
    });
  const result = await db.select().from(weeklyResults).where(eq(weeklyResults.weeklyGoalId, weeklyGoalId)).limit(1);
  return result[0];
}

export async function listWeeklyResultsForRep(repId: number) {
  const db = await requireDb();
  return db.select().from(weeklyResults).where(eq(weeklyResults.repId, repId)).orderBy(desc(weeklyResults.updatedAt));
}

export async function getWeeklyResultForRepAndGoal(repId: number, weeklyGoalId: number) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(weeklyResults)
    .where(and(eq(weeklyResults.repId, repId), eq(weeklyResults.weeklyGoalId, weeklyGoalId)))
    .limit(1);
  return result[0];
}

export async function saveWeeklyCommitment(repId: number, weeklyGoalId: number, commitment: string) {
  const db = await requireDb();
  await db
    .update(weeklyResults)
    .set({ commitment, updatedAt: new Date() })
    .where(and(eq(weeklyResults.repId, repId), eq(weeklyResults.weeklyGoalId, weeklyGoalId)));
  return getWeeklyResultForRepAndGoal(repId, weeklyGoalId);
}

export async function listWeeklyResultsForGoals(goalIds: number[]) {
  if (!goalIds.length) return [];
  const db = await requireDb();
  return db.select().from(weeklyResults).where(inArray(weeklyResults.weeklyGoalId, goalIds));
}

export async function saveCoachingReport(repId: number, weeklyResultId: number, attainmentPercent: number, message: string) {
  const db = await requireDb();
  await db
    .insert(coachingReports)
    .values({ repId, weeklyResultId, attainmentPercent, message })
    .onDuplicateKeyUpdate({ set: { attainmentPercent, message } });
  const result = await db.select().from(coachingReports).where(eq(coachingReports.weeklyResultId, weeklyResultId)).limit(1);
  return result[0];
}

export async function listCoachingReportsForResults(resultIds: number[]) {
  if (!resultIds.length) return [];
  const db = await requireDb();
  return db.select().from(coachingReports).where(inArray(coachingReports.weeklyResultId, resultIds));
}

export async function getCrmContactId(userId: number) {
  const db = await requireDb();
  const result = await db.select().from(userCrmLinks).where(eq(userCrmLinks.userId, userId)).limit(1);
  return result[0]?.ghlContactId ?? null;
}

export async function upsertCrmContactLink(userId: number, ghlContactId: string) {
  const db = await requireDb();
  await db
    .insert(userCrmLinks)
    .values({ userId, ghlContactId })
    .onDuplicateKeyUpdate({ set: { ghlContactId, updatedAt: new Date() } });
}

export async function createCrmSyncEvent(input: {
  repId: number;
  weeklyGoalId?: number | null;
  weeklyResultId?: number | null;
  eventType: "weekly_plan_saved" | "weekly_result_submitted";
  externalContactId?: string | null;
  payloadJson: string;
}) {
  const db = await requireDb();
  const result = await db.insert(crmSyncEvents).values({ ...input, deliveryStatus: "disabled" });
  return Number(result[0].insertId);
}

export async function updateCrmSyncEvent(
  eventId: number,
  deliveryStatus: "delivered" | "failed",
  errorMessage?: string | null,
) {
  const db = await requireDb();
  await db
    .update(crmSyncEvents)
    .set({ deliveryStatus, errorMessage: errorMessage ?? null, deliveredAt: deliveryStatus === "delivered" ? new Date() : null })
    .where(eq(crmSyncEvents.id, eventId));
}

export async function getCrmConnection(provider: string) {
  const db = await requireDb();
  const result = await db.select().from(crmConnections).where(eq(crmConnections.provider, provider)).limit(1);
  return result[0] ?? null;
}

export async function setCrmConnection(provider: string, enabled: boolean, updatedByUserId: number) {
  const db = await requireDb();
  await db
    .insert(crmConnections)
    .values({ provider, enabled, updatedByUserId })
    .onDuplicateKeyUpdate({ set: { enabled, updatedByUserId, updatedAt: new Date() } });
  return getCrmConnection(provider);
}

export async function listManagerRepIds(managerId: number) {
  const db = await requireDb();
  const assignments = await db.select({ repId: managerAssignments.repId }).from(managerAssignments).where(eq(managerAssignments.managerId, managerId));
  return assignments.map((assignment) => assignment.repId);
}

export async function listRepsByIds(repIds: number[]) {
  if (!repIds.length) return [];
  const db = await requireDb();
  return db.select().from(users).where(inArray(users.id, repIds));
}

export async function listAllReps() {
  const db = await requireDb();
  return db.select().from(users).where(inArray(users.role, ["user", "rep"]));
}

export async function assignRepToManager(managerId: number, repId: number) {
  const db = await requireDb();
  await db.insert(managerAssignments).values({ managerId, repId }).onDuplicateKeyUpdate({ set: { managerId } });
}
