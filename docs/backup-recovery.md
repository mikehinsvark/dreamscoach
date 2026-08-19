# Dreams Coach Encrypted Backup and Recovery Runbook

## Purpose

Dreams Coach creates one encrypted production MySQL archive each day and retains it in the private `mikehinsvark/dreamscoach-backups` repository. The exported archive contains the eight application tables required for a complete coaching workspace recovery: users, manager assignments, CRM links, weekly goals, weekly results, coaching reports, CRM sync events, and CRM connections.

The daily workflow runs at **08:15 UTC** and uses an authenticated `POST` request to the production export endpoint. The endpoint compresses and encrypts the database export before it leaves Railway. The private archive repository stores only encrypted files and SHA-256 checksum companions; database content is never stored in plain text.

## Normal Operating Checks

| Check | Expected result |
|---|---|
| Daily workflow | The **Daily Encrypted Production Backup** workflow completes successfully. |
| Archive repository | A new `.enc.json` archive and matching `.sha256` file appear in `archives/`. |
| Archive content | The encrypted envelope declares `dreamscoach.encrypted-backup.v1`; it does not reveal user email, plan, or results data in clear text. |
| Retention | Archives older than 30 days are removed by the scheduled workflow. |

## Tested Recovery Procedure

> **Never restore into the live Railway production database.** Create or select an isolated MySQL database first.

1. Obtain the desired encrypted `.enc.json` archive from the private backup repository. Verify its `.sha256` checksum before use.
2. Create the isolated MySQL database and apply `scripts/restore-schema.sql` from the Dreams Coach source repository.
3. Supply the archive encryption key and the isolated MySQL connection string only as temporary environment variables. Set `ALLOW_BACKUP_RESTORE=yes` as an explicit safety gate.
4. Run `node scripts/restore-backup.mjs <path-to-archive>`. The script decrypts, decompresses, and restores the saved rows without touching production.
5. Verify all eight core tables exist. Check at least one user/workspace record and, when present in production, representative weekly goal, weekly result, coaching report, and CRM records.

The recovery script was validated against a real retained encrypted archive in an isolated MariaDB database. The validation restored the live user record successfully and confirmed that all eight expected tables were present. Tables that were empty in production remained empty after the restore, which is the correct result.

## Secret Handling and Rotation

The backup request secret and archive encryption key are stored as secure environment variables in Railway and as GitHub Actions secrets. The private backup repository is accessed by a repository-scoped SSH deploy key rather than a personal access token. Rotate the request secret, encryption key, and deploy key together at least annually or immediately if any secret may have been exposed; after rotating the encryption key, preserve the previous key securely until all archives encrypted with it have aged out of retention.

## Recovery-Time Checks

| Table or workflow area | What to confirm after an isolated restore |
|---|---|
| `users` | Expected workspace accounts, roles, and Clerk identity mappings are present. |
| `managerAssignments` | Existing manager-to-representative relationships are present. |
| `weeklyGoals` and `weeklyResults` | Plans, actuals, reflections, and commitments are available. |
| `coachingReports` | Saved coaching reports are available for corresponding results. |
| `userCrmLinks`, `crmSyncEvents`, and `crmConnections` | Dreams Cloud CRM references and delivery controls are restored. |
