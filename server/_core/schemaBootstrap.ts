import { sql } from "drizzle-orm";

type SqlExecutor = {
  execute(statement: unknown): Promise<unknown>;
};

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS \`coachingReports\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`weeklyResultId\` int NOT NULL,
    \`repId\` int NOT NULL,
    \`attainmentPercent\` int NOT NULL,
    \`message\` text NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`coachingReports_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`result_coaching_unique\` UNIQUE(\`weeklyResultId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`crmConnections\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`provider\` varchar(32) NOT NULL,
    \`enabled\` boolean NOT NULL DEFAULT false,
    \`updatedByUserId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`crmConnections_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`crmConnections_provider_unique\` UNIQUE(\`provider\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`crmSyncEvents\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`repId\` int NOT NULL,
    \`weeklyGoalId\` int,
    \`weeklyResultId\` int,
    \`crmEventType\` enum('weekly_plan_saved','weekly_result_submitted') NOT NULL,
    \`crmDeliveryStatus\` enum('disabled','delivered','failed') NOT NULL DEFAULT 'disabled',
    \`externalContactId\` varchar(128),
    \`payloadJson\` text NOT NULL,
    \`errorMessage\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`deliveredAt\` timestamp,
    CONSTRAINT \`crmSyncEvents_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`managerAssignments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`managerId\` int NOT NULL,
    \`repId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`managerAssignments_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`manager_rep_unique\` UNIQUE(\`managerId\`,\`repId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`userCrmLinks\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`ghlContactId\` varchar(128) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`userCrmLinks_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`user_crm_link_unique\` UNIQUE(\`userId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`openId\` varchar(64) NOT NULL,
    \`name\` text,
    \`email\` varchar(320),
    \`loginMethod\` varchar(64),
    \`role\` enum('user','rep','manager','admin') NOT NULL DEFAULT 'rep',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`weeklyGoals\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`repId\` int NOT NULL,
    \`weekStart\` varchar(10) NOT NULL,
    \`phoneHours\` int NOT NULL,
    \`recruits\` int NOT NULL,
    \`outreachContacts\` int NOT NULL,
    \`submittedApplications\` int NOT NULL,
    \`pipelineAppointments\` int NOT NULL,
    \`engagements\` int NOT NULL,
    \`closedGcv\` int NOT NULL,
    \`targetProspects\` int NOT NULL,
    \`goalStatus\` enum('saved','finalized') NOT NULL DEFAULT 'saved',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`weeklyGoals_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`rep_week_goal_unique\` UNIQUE(\`repId\`,\`weekStart\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`weeklyResults\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`weeklyGoalId\` int NOT NULL,
    \`repId\` int NOT NULL,
    \`phoneHours\` int NOT NULL,
    \`recruits\` int NOT NULL,
    \`outreachContacts\` int NOT NULL,
    \`submittedApplications\` int NOT NULL,
    \`pipelineAppointments\` int NOT NULL,
    \`engagements\` int NOT NULL,
    \`closedGcv\` int NOT NULL,
    \`targetProspects\` int NOT NULL,
    \`reflection\` text,
    \`commitment\` text,
    \`resultStatus\` enum('draft','submitted') NOT NULL DEFAULT 'draft',
    \`submittedAt\` timestamp,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`weeklyResults_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`goal_result_unique\` UNIQUE(\`weeklyGoalId\`)
  )`,
];

export async function ensureProspectCoachSchema(db: SqlExecutor) {
  for (const statement of schemaStatements) {
    await db.execute(sql.raw(statement));
  }
}

export { schemaStatements };
