# AGENTS.md — AI Agent Guidelines

## Database (CRITICAL — READ THIS FIRST)

**ALL database changes go through drizzle. No exceptions. No raw SQL. No shortcuts.**

### What you MUST NOT do

- Run raw SQL (`psql`, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, etc.)
- Use `drizzle-kit push` / `db:push` (doesn't create migration files)
- Write migration `.sql` files by hand
- Modify the database schema or data outside of drizzle
- Modify `meta/_journal.json` or snapshot files by hand

### What you MUST do

1. Edit `web/db/schema/*.ts` for schema changes
2. Tell the user to run `npx drizzle-kit generate --name <name>` (it's interactive)
3. Tell the user to run `npx drizzle-kit migrate` to apply locally
4. Update `docs/data-model-specification.md` to match

### Why

- `node scripts/migrate.js` runs on every Vercel deploy
- It reads `.sql` files from `web/db/migrations/` and applies pending ones
- No migration file = deploy has no idea about the change = production breaks
- `drizzle-kit generate` has interactive prompts (rename disambiguation) that cannot be automated

## General Rules

- Files < 500 lines, lines < 150 chars
- Reuse functions, remove unused code
- No fallbacks unless explicitly requested
- Respect existing project structure and naming
- Don't run tests unless asked
