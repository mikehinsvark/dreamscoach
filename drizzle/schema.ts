import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Identity comes from Manus OAuth. The default role is deliberately a rep;
 * manager and admin access are assigned only by an authorized administrator.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "rep", "manager", "admin"]).default("rep").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** A manager may review only reps explicitly assigned to their team. */
export const managerAssignments = mysqlTable(
  "managerAssignments",
  {
    id: int("id").autoincrement().primaryKey(),
    managerId: int("managerId").notNull(),
    repId: int("repId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("manager_rep_unique").on(table.managerId, table.repId)],
);

/** Maps one secure Prospect Coach identity to its company-account Dreams Cloud contact. */
export const userCrmLinks = mysqlTable(
  "userCrmLinks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    ghlContactId: varchar("ghlContactId", { length: 128 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("user_crm_link_unique").on(table.userId)],
);

/** A single editable planning snapshot for each rep and Monday week-start. */
export const weeklyGoals = mysqlTable(
  "weeklyGoals",
  {
    id: int("id").autoincrement().primaryKey(),
    repId: int("repId").notNull(),
    weekStart: varchar("weekStart", { length: 10 }).notNull(),
    phoneHours: int("phoneHours").notNull(),
    recruits: int("recruits").notNull(),
    outreachContacts: int("outreachContacts").notNull(),
    submittedApplications: int("submittedApplications").notNull(),
    pipelineAppointments: int("pipelineAppointments").notNull(),
    engagements: int("engagements").notNull(),
    closedGcv: int("closedGcv").notNull(),
    targetProspects: int("targetProspects").notNull(),
    status: mysqlEnum("goalStatus", ["saved", "finalized"]).default("saved").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("rep_week_goal_unique").on(table.repId, table.weekStart)],
);

/** Actuals, reflection, and next-week commitment belong only to the matching rep plan. */
export const weeklyResults = mysqlTable(
  "weeklyResults",
  {
    id: int("id").autoincrement().primaryKey(),
    weeklyGoalId: int("weeklyGoalId").notNull(),
    repId: int("repId").notNull(),
    phoneHours: int("phoneHours").notNull(),
    recruits: int("recruits").notNull(),
    outreachContacts: int("outreachContacts").notNull(),
    submittedApplications: int("submittedApplications").notNull(),
    pipelineAppointments: int("pipelineAppointments").notNull(),
    engagements: int("engagements").notNull(),
    closedGcv: int("closedGcv").notNull(),
    targetProspects: int("targetProspects").notNull(),
    reflection: text("reflection"),
    commitment: text("commitment"),
    status: mysqlEnum("resultStatus", ["draft", "submitted"]).default("draft").notNull(),
    submittedAt: timestamp("submittedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("goal_result_unique").on(table.weeklyGoalId)],
);

/** Supportive template-based coaching is persisted with an individual result review. */
export const coachingReports = mysqlTable(
  "coachingReports",
  {
    id: int("id").autoincrement().primaryKey(),
    weeklyResultId: int("weeklyResultId").notNull(),
    repId: int("repId").notNull(),
    attainmentPercent: int("attainmentPercent").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("result_coaching_unique").on(table.weeklyResultId)],
);

/**
 * The sync ledger permits clear auditability and leaves company-account delivery
 * disabled until a GHL Dreams Cloud webhook URL is intentionally configured.
 */
export const crmSyncEvents = mysqlTable("crmSyncEvents", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  weeklyGoalId: int("weeklyGoalId"),
  weeklyResultId: int("weeklyResultId"),
  eventType: mysqlEnum("crmEventType", ["weekly_plan_saved", "weekly_result_submitted"]).notNull(),
  deliveryStatus: mysqlEnum("crmDeliveryStatus", ["disabled", "delivered", "failed"]).default("disabled").notNull(),
  externalContactId: varchar("externalContactId", { length: 128 }),
  payloadJson: text("payloadJson").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
});

/** One company-level delivery control; its webhook URL remains a server-side secret. */
export const crmConnections = mysqlTable("crmConnections", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type WeeklyGoal = typeof weeklyGoals.$inferSelect;
export type WeeklyResult = typeof weeklyResults.$inferSelect;
