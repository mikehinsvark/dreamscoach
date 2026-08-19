import { createDecipheriv, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import mysql from "mysql2/promise";

const archivePath = process.argv[2];
const restoreUrl = process.env.BACKUP_RESTORE_DATABASE_URL;
const secret = process.env.BACKUP_ENCRYPTION_KEY;

if (!archivePath || !restoreUrl || !secret || process.env.ALLOW_BACKUP_RESTORE !== "yes") {
  throw new Error(
    "Usage: ALLOW_BACKUP_RESTORE=yes BACKUP_RESTORE_DATABASE_URL=<isolated database URL> BACKUP_ENCRYPTION_KEY=<key> node scripts/restore-backup.mjs <archive>",
  );
}

const archive = JSON.parse(await readFile(archivePath, "utf8"));
if (archive.format !== "dreamscoach.encrypted-backup.v1") throw new Error("Unsupported backup format");

const key = createHash("sha256").update(secret, "utf8").digest();
const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(archive.iv, "base64"));
decipher.setAuthTag(Buffer.from(archive.tag, "base64"));
const compressed = Buffer.concat([decipher.update(Buffer.from(archive.ciphertext, "base64")), decipher.final()]);
const backup = JSON.parse(gunzipSync(compressed).toString("utf8"));

const tableOrder = [
  "users",
  "managerAssignments",
  "userCrmLinks",
  "weeklyGoals",
  "weeklyResults",
  "coachingReports",
  "crmSyncEvents",
  "crmConnections",
];
const connection = await mysql.createConnection(restoreUrl);
try {
  for (const tableName of tableOrder) {
    const rows = backup.tables[tableName] ?? [];
    if (!rows.length) continue;
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => "?").join(", ");
    const statement = `INSERT INTO \`${tableName}\` (${columns.map(column => `\`${column}\``).join(", ")}) VALUES (${placeholders})`;
    for (const row of rows) {
      await connection.execute(statement, columns.map(column => row[column]));
    }
  }
  console.log(`Restored encrypted archive created ${backup.createdAt} into the isolated database.`);
} finally {
  await connection.end();
}
