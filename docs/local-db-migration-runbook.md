# Local DB Migration Runbook

## Goal
Keep local database state aligned with repository migrations and deploy behavior.

## Required Workflow
1. Edit schema in `web/db/schema/*.ts`.
2. Generate migration:
   - `cd web`
   - `npx drizzle-kit generate --name <descriptive_name>`
3. Apply locally with deploy-aligned runner:
   - `node scripts/migrate.js`
4. Validate:
   - `npm run db:check-migrations`
   - `npm run typecheck`

## Why `scripts/migrate.js` locally
This repo has historical duplicate migration prefixes (`0003_*`, `0004_*`).
Using the same runner in local/dev and deploy avoids divergence in applied state.

## If Migration State Drifts
1. Back up local DB:
   - `pg_dump -Fc -d preu -f web/db/backups/preu-<timestamp>.dump`
2. Create clean DB and run migrations:
   - `createdb -O preu_app preu_clean`
   - `DATABASE_URL=postgresql://preu_app@localhost:5432/preu_clean node web/scripts/migrate.js`
3. Copy compatible data:
   - `SOURCE_DATABASE_URL=postgresql://preu_app@localhost:5432/preu TARGET_DATABASE_URL=postgresql://preu_app@localhost:5432/preu_clean npx tsx web/scripts/cloneLegacyDataToCleanDb.ts`
4. Swap DB names if needed so app keeps using `preu`.

## Never Do
- Never hand-edit migration SQL files.
- Never run raw DDL directly against local dev DB.
- Never use `drizzle-kit push` for this project workflow.
