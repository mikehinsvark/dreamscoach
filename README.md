# Prospect Accountability Coach

Prospect Accountability Coach is a React and Express application for weekly sales-accountability planning. Representatives save weekly PROSPECT goals, submit results, record commitments, and review progress. Managers see only authorized team activity; administrators control the GoHighLevel Dreams Cloud handoff.

## Architecture

| Layer | Technology | Purpose |
|---|---|---|
| Client | React, Vite, TypeScript | Public coaching framework and protected workspace |
| Authentication | Clerk | Email and Google sign-in, portable from the original host |
| API | Express and tRPC | Role-checked planning, result, dashboard, and CRM procedures |
| Data | MySQL-compatible database and Drizzle | Users, goals, results, assignments, coaching, and CRM delivery ledger |
| CRM | GoHighLevel Dreams Cloud inbound webhook | Optional, administrator-enabled handoff for saved plans and submitted reviews |

## Local development

Install dependencies with `pnpm install`, configure the environment variables listed in `EXTERNAL_DEPLOYMENT.md`, then run `pnpm dev`.

Run validation with:

```bash
pnpm check
pnpm test
pnpm build
```

## Role model

New authenticated users enter as representatives. The email configured in `CLERK_ADMIN_EMAIL` is elevated to administrator on first sign-in. Administrators assign managers and representatives through the protected controls; existing role records are retained when legacy users sign into Clerk using the same email address.

## Operational safeguards

The GoHighLevel Dreams Cloud webhook is not activated merely because a URL is configured. An administrator must enable weekly CRM sync from the in-app CRM Settings page. The application records delivery attempts internally and marks failed requests for review.

See `EXTERNAL_DEPLOYMENT.md` for Railway, database, media, and domain cutover requirements.
