# Railway Deployment Status

## Current Environment

The Railway project **exquisite-charm** now has the `dreamscoach` application service and a managed MySQL service in the production environment. The app is running in **US West (California, USA)**. The application is linked to the MySQL service with a private `DATABASE_URL` reference, and Railway reports the current deployment as successful.

The application has not yet been pointed at `dreamscoach.pro`. A temporary Railway domain is being generated first so the service can be tested before any public DNS cutover.

## Runtime Configuration Notes

Railway supports a `railway.toml` or `railway.json` configuration file for builder, start command, pre-deploy migration command, and health check settings. Config-as-code overrides dashboard build and deploy settings for each deployment. The production Drizzle migration pattern uses a Railway pre-deploy command so migrations run before a new application version receives traffic.

The production service requires these protected variables: `DATABASE_URL`, `NODE_ENV`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `CLERK_ADMIN_EMAIL`. GoHighLevel Dreams Cloud webhook variables should remain absent until the inbound CRM workflow is ready, which keeps CRM delivery disabled.

## Sources

- [Railway Config as Code](https://docs.railway.com/config-as-code)
- [Railway Config Reference](https://docs.railway.com/config-as-code/reference)
- [Drizzle: Node.js and Railway](https://orm.drizzle.team/docs/tutorials/node-railway-pg)
# Clerk Production Keys Active - 2026-08-19T01:44:08Z
