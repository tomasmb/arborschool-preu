# CLAUDE.md — Instructions for AI Assistants

## Database (CRITICAL — READ THIS FIRST)

**ALL database changes go through drizzle. No exceptions. No raw SQL. No shortcuts.**

### Forbidden

- Raw SQL (`psql`, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, etc.)
- `drizzle-kit push` / `db:push` (doesn't create migration files, breaks deploys)
- Hand-writing migration `.sql` files or snapshot `.json` files
- Any database modification outside of drizzle's workflow

### Required Workflow

1. Edit `web/db/schema/*.ts` for schema changes
2. Ask the user to run `npx drizzle-kit generate --name <name>` (interactive prompt)
3. Ask the user to run `npx drizzle-kit migrate` to apply locally
4. Update `docs/data-model-specification.md` to match

### Context

- `node scripts/migrate.js` runs on every Vercel deploy (`vercel-build` script)
- It reads `.sql` migration files from `web/db/migrations/`
- No migration file = deploy doesn't know about the change = production breaks
- `drizzle-kit generate` has interactive prompts that cannot be automated from a shell

## General Rules

- Files < 500 lines, lines < 150 chars
- Reuse functions, remove unused code
- No fallbacks unless explicitly requested
- Respect existing project structure and naming
- Don't run tests unless asked
