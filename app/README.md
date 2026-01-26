# Arbor PreU - App

Next.js application for PAES preparation with adaptive diagnostic testing.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+

## Local Development Setup

### 1. Database Setup

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database and user
createdb preu
createuser preu_app

# Grant permissions
psql -d preu -c "GRANT ALL PRIVILEGES ON DATABASE preu TO preu_app;"
psql -d preu -c "GRANT ALL ON SCHEMA public TO preu_app;"
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env.local
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
# Apply all pending migrations
npm run db:migrate

# Or push schema directly (development only)
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Commands

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run db:generate` | Generate migration from schema changes   |
| `npm run db:migrate`  | Apply pending migrations                 |
| `npm run db:push`     | Push schema directly (no migration file) |
| `npm run db:studio`   | Open Drizzle Studio GUI                  |

## Project Structure

```
app/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── diagnostico/    # Diagnostic test feature
│   └── graph/          # Knowledge graph visualization
├── db/                  # Database layer
│   ├── migrations/     # SQL migration files
│   └── schema/         # Drizzle schema definitions
├── lib/                 # Shared utilities
│   └── diagnostic/     # MST engine configuration
└── public/             # Static assets
```

## Deployment

Deployed automatically to Google Cloud Run on push to `main`.

### Migration Workflow

- **Automatic**: Migrations run in CI before Terraform deploy
- **Manual**: Run migrations manually via GitHub Actions → "Run Database Migrations"

### Environment Variables (Production)

Set via Cloud Run env vars + secrets:

- `DB_HOST` - Cloud SQL Unix socket path (from Terraform)
- `DB_NAME` - Database name (from Terraform)
- `DB_USER` - Database user (from Terraform)
- `DB_PASSWORD` - Database password (Secret Manager)
