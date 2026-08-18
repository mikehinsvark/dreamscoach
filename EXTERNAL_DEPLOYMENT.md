# External Deployment Guide

## Hosting model

This is a **full-stack application**. GitHub stores source and CI; Railway runs the Express service and MySQL-compatible database. Do not deploy it as GitHub Pages: that would remove authenticated procedures, database persistence, and server-side GoHighLevel Dreams Cloud delivery.

## Required Railway variables

| Variable | Required | Value source | Notes |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Railway MySQL private reference | Set to `${{MySQL.MYSQL_URL}}`. |
| `NODE_ENV` | Yes | Railway | `production`. |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk Dashboard → API Keys | Used by Express Clerk middleware. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk Dashboard → API Keys | Same publishable key; embedded in the browser build. |
| `CLERK_SECRET_KEY` | Yes | Clerk Dashboard → API Keys | Server-only; never commit or expose it. |
| `CLERK_ADMIN_EMAIL` | Yes | Administrator’s Clerk sign-in email | The matching user receives the first administrator role. |
| `GHL_DREAMS_CLOUD_WEBHOOK_URL` | Optional | GoHighLevel Dreams Cloud inbound workflow | Required only for CRM delivery; rotate if ever exposed. |
| `GHL_DREAMS_CLOUD_SHARED_SECRET` | Optional | Shared internal secret | Sent as `X-Prospect-Webhook-Secret` if configured. |

## Database migration

Railway should execute this pre-deploy migration command after `DATABASE_URL` is present:

```bash
pnpm drizzle-kit migrate
```

The committed Drizzle migrations create the secure user, manager-assignment, plan, results, coaching, CRM ledger, and connection-control tables.

## Clerk configuration

Create a Clerk production instance and enable the intended email and Google sign-in methods. Add the temporary Railway domain first, then add `https://dreamscoach.pro` and `https://www.dreamscoach.pro` as allowed origins/redirect URLs before the DNS cutover. Do not use development Clerk keys in production.

## Media portability

The hero explainer video must be copied to `client/public/media/prospect-explainer-v4.mp4` in the exported repository and referenced as `/media/prospect-explainer-v4.mp4`. The original `/manus-storage/` URL is host-bound and must not remain in the Railway build.

## Domain cutover

The existing `dreamscoach.pro` A records and `www` CNAME point to GitHub Pages. When Railway generates its exact domain records, replace **only** those web-routing records after user approval. Preserve existing MX, SPF, DKIM, and other email records. Railway’s provided verification records and target values supersede any guessed values.

## Validation sequence

1. Confirm the temporary Railway URL returns the public home page.
2. Confirm the hero video loads from the exported public media path.
3. Sign in using a controlled Clerk test user; verify the user record persists.
4. Confirm a test rep can save a plan and submit a review.
5. Confirm a manager sees only assigned representatives and an administrator can manage CRM settings.
6. Confirm GoHighLevel Dreams Cloud sync remains paused until the administrator enables it.
7. Connect the custom domain, verify HTTPS, and repeat the sign-in and saved-plan checks on both apex and `www`.
