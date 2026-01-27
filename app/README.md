# Arbor PreU - App

Next.js application for PAES preparation with adaptive diagnostic testing.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local dev) or Neon account (production)

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
│   └── resultados/     # Results page
├── db/                  # Database layer
│   ├── migrations/     # SQL migration files
│   └── schema/         # Drizzle schema definitions
├── lib/                 # Shared utilities
│   └── diagnostic/     # MST engine configuration
└── public/             # Static assets
```

## Deployment (Vercel + Neon)

### Initial Setup

1. **Create Neon Database**:
   - Go to [console.neon.tech](https://console.neon.tech)
   - Create a new project
   - Copy the **pooled** connection string

2. **Deploy to Vercel**:
   - Import your GitHub repo at [vercel.com/new](https://vercel.com/new)
   - Set root directory to `app`
   - Add environment variables (see below)
   - Deploy

3. **Run Migrations**:

   ```bash
   # Set your Neon connection string
   export DATABASE_URL="postgresql://..."

   # Run migrations
   npm run db:migrate
   ```

4. **Configure Domain** (optional):
   - In Vercel dashboard → Settings → Domains
   - Add your custom domain

### Environment Variables (Vercel)

| Variable                   | Description                    |
| -------------------------- | ------------------------------ |
| `DATABASE_URL`             | Neon pooled connection string  |
| `RESEND_API_KEY`           | Resend API key for emails      |
| `NEXT_PUBLIC_POSTHOG_KEY`  | PostHog project API key        |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL               |
| `NEXT_PUBLIC_BASE_URL`     | Your app URL (for email links) |

### Deploying Updates

Just push to `main`. Vercel automatically builds and deploys.

### Running Migrations

Before deploying schema changes:

```bash
# Generate migration from schema changes
npm run db:generate

# Apply to production (set DATABASE_URL to Neon)
DATABASE_URL="postgresql://..." npm run db:migrate

# Then push code changes
git add . && git commit -m "Add migration" && git push
```
