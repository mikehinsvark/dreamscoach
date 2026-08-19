import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import {
  coachingReports,
  crmConnections,
  crmSyncEvents,
  managerAssignments,
  userCrmLinks,
  users,
  weeklyGoals,
  weeklyResults,
} from "../../drizzle/schema";
import { getDb } from "../db";

const BACKUP_FORMAT = "dreamscoach.encrypted-backup.v1";

type BackupPayload = {
  format: "dreamscoach.mysql-export.v1";
  createdAt: string;
  tables: Record<string, unknown[]>;
};

type EncryptedBackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  algorithm: "aes-256-gcm";
  compression: "gzip";
  createdAt: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

function encryptionKey(secret: string) {
  if (secret.length < 32) throw new Error("BACKUP_ENCRYPTION_KEY must contain at least 32 characters");
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptBackupPayload(payload: BackupPayload, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const compressed = gzipSync(Buffer.from(JSON.stringify(payload), "utf8"));
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const envelope: EncryptedBackupEnvelope = {
    format: BACKUP_FORMAT,
    algorithm: "aes-256-gcm",
    compression: "gzip",
    createdAt: payload.createdAt,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
  return JSON.stringify(envelope);
}

export function decryptBackupPayload(encryptedArchive: string, secret: string): BackupPayload {
  const archive = JSON.parse(encryptedArchive) as EncryptedBackupEnvelope;
  if (archive.format !== BACKUP_FORMAT || archive.algorithm !== "aes-256-gcm" || archive.compression !== "gzip") {
    throw new Error("Unsupported encrypted Dreams Coach backup format");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), Buffer.from(archive.iv, "base64"));
  decipher.setAuthTag(Buffer.from(archive.tag, "base64"));
  const compressed = Buffer.concat([decipher.update(Buffer.from(archive.ciphertext, "base64")), decipher.final()]);
  return JSON.parse(gunzipSync(compressed).toString("utf8")) as BackupPayload;
}

export function hasValidBackupToken(provided: unknown, expected: string | undefined) {
  if (!expected || typeof provided !== "string") return false;
  const received = Buffer.from(provided);
  const configured = Buffer.from(expected);
  return received.length === configured.length && timingSafeEqual(received, configured);
}

export async function createEncryptedDatabaseBackup(secret: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available for backup");
  const [userRows, assignmentRows, crmLinkRows, goalRows, resultRows, coachingRows, syncRows, connectionRows] = await Promise.all([
    db.select().from(users),
    db.select().from(managerAssignments),
    db.select().from(userCrmLinks),
    db.select().from(weeklyGoals),
    db.select().from(weeklyResults),
    db.select().from(coachingReports),
    db.select().from(crmSyncEvents),
    db.select().from(crmConnections),
  ]);
  return encryptBackupPayload(
    {
      format: "dreamscoach.mysql-export.v1",
      createdAt: new Date().toISOString(),
      tables: {
        users: userRows,
        managerAssignments: assignmentRows,
        userCrmLinks: crmLinkRows,
        weeklyGoals: goalRows,
        weeklyResults: resultRows,
        coachingReports: coachingRows,
        crmSyncEvents: syncRows,
        crmConnections: connectionRows,
      },
    },
    secret,
  );
}

export type { BackupPayload };
