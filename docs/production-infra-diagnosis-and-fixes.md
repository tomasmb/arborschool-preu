# Production infrastructure diagnosis & fixes

This document is a pragmatic checklist of **prod risks** and the **fixes** to
apply. It covers Terraform, GitHub Actions, Cloud Run, Cloud SQL, and secrets.

## Current architecture (as implemented)

- **Runtime**: Next.js app on **Cloud Run**.
- **Container image**: built in GitHub Actions and pushed to **Artifact
  Registry**.
- **Database**: **Cloud SQL Postgres 15**.
- **Secrets**: **Secret Manager** injected into Cloud Run.
- **Terraform state**: **GCS backend** (`arbor-school-terraform-state`).

## Fixes already implemented in this repo

### 1) Terraform is the only source of truth for Cloud Run

**Problem**: GitHub Actions ran `gcloud run deploy` while Terraform also managed
Cloud Run, causing drift and hard-to-debug rollouts.

**Fix**:

- Terraform now uses `var.cloud_run_image` for the Cloud Run container image.
- Deploy workflow builds/pushes the image and runs `terraform apply` to update
  the image via Terraform (no more `gcloud run deploy`).
- Deploy workflow has concurrency to prevent overlapping deploys.

Files:

- `terraform/variables.tf` (new `cloud_run_image` variable)
- `terraform/main.tf` (Cloud Run image now uses `var.cloud_run_image`)
- `.github/workflows/deploy.yml` (now applies Terraform)

### 2) GitHub Actions permissions verified and granted

**Goal**: the deploy workflow must be able to:

- authenticate via GitHub OIDC (Workload Identity Federation),
- push the app image to Artifact Registry,
- run `terraform init/plan/apply` against the GCS backend state bucket,
- manage the resources declared in `terraform/` (Cloud Run, Cloud SQL, secrets,
  IAM bindings, etc.).

**What we verified in GCP**:

- Workload Identity Pool: `github-actions`
- Provider: `github-provider`
- GitHub repo binding: `tomasmb/arborschool-preu`
- Service account used by CI: `github-actions@arbor-school-473319.iam.gserviceaccount.com`

**Permissions granted to the CI service account**:

- Project roles:
  - `roles/run.admin`
  - `roles/iam.serviceAccountUser`
  - `roles/artifactregistry.admin`
  - `roles/cloudsql.admin`
  - `roles/secretmanager.admin`
  - `roles/iam.serviceAccountAdmin`
  - `roles/resourcemanager.projectIamAdmin`
- State bucket roles on `gs://arbor-school-terraform-state`:
  - `roles/storage.objectAdmin`
  - `roles/storage.bucketViewer`

**What we verified in GitHub** (repo secrets exist):

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

### 3) Migrations run in CI (not in the runtime container)

**Fix**:

- Deploy workflow runs `db:migrate` before `terraform apply`.
- The container starts the app server only (no startup migrations).
- The manual migrations workflow only supports `db:migrate` (no `db:push`).

### 4) Secret Manager access scoped per-secret

**Fix**:

- Removed project-wide `roles/secretmanager.secretAccessor` from the Cloud Run
  service account.
- Added per-secret IAM bindings for:
  - `preu-db-password`
  - `preu-resend-api-key`

### 5) Cloud SQL encrypted connections enforced

**Fix**:

- Set Cloud SQL `ssl_mode` to `ENCRYPTED_ONLY`.

### 6) CI/CD hardening improvements

**Fix**:

- Deploy uses immutable `image@sha256` digest references.
- Deploy runs `terraform fmt`, `terraform validate`, and `terraform plan` before
  applying.
- Deploy/migrate workflows pin third-party GitHub Actions to commit SHAs.
- CI verifies the sha256 of the downloaded Cloud SQL Proxy binary.

### 7) DB connection saturation controls

**Fix**:

- Cloud Run limits per-instance request concurrency (`max_instance_request_concurrency = 20`).
- Database pool size is configurable and set in Cloud Run (`DB_POOL_MAX=5`).

### 8) Fail-fast production env validation

**Fix**:

- In production, DB config is required explicitly (no silent defaults). Missing
  vars cause a clear startup error instead of latent runtime failures.

### 9) Basic uptime monitoring

**Fix**:

- Terraform provisions an uptime check for `preu.arbor.school` and an alert
  policy tied to that check.

### 10) Long-term fix for Drizzle migration drift

**Problem**:

- Drizzle records applied migrations by **hash** in `drizzle.__drizzle_migrations`.
- If schema changes were applied via another path (e.g. `db:push`, manual SQL,
  or older custom migration scripts), the DB can have changes that Drizzle
  doesn't recognize as applied.
- Then `drizzle-kit migrate` attempts to re-apply migrations and can fail with
  "already exists" errors.

**Fix**:

- Use the manual workflow `Reconcile Drizzle Migration History` to mark
  migrations as applied **only when the schema changes already exist**.
- After reconciliation, `drizzle-kit migrate` stops re-running those migrations.

## Remaining fixes (prioritized)

### P0 — must fix to avoid outages / unsafe changes

#### A) Stop running migrations on every container startup

**Problem**:

- Running migrations inside the app container is unsafe:
  - scale-out can cause concurrent migration runs,
  - failures can be hidden,
  - app can start with a schema mismatch.

**Fix**:

- Run migrations as a **separate CI job step** before `terraform apply`.
- Make migrations **fail the workflow** on error.
- Ensure migrations are **serialized** (one runner at a time).

**Status**: done.

#### B) Remove the `push` migration option for production

**Problem**: `drizzle-kit push` is a schema sync tool, not a migration history.
It can make prod state drift from migrations and is risky for real data.

**Fix**:

- Remove the `push` option from `.github/workflows/migrate.yml` or restrict it
  to non-prod environments.

### P1 — security hardening / blast-radius reduction

#### C) Disable Cloud SQL public IPv4 (if not required)

**Problem**: `ipv4_enabled = true` increases attack surface.

**Fix**:

- In `terraform/main.tf`, set `ipv4_enabled = false` unless you truly need
  public access.
- If you do need public access, add `authorized_networks` and enforce SSL-only.

#### D) Require encrypted DB connections (if using TCP)

**Problem**: `ssl_mode = "ALLOW_UNENCRYPTED_AND_ENCRYPTED"` allows plaintext
connections when using TCP.

**Fix**:

- Prefer Unix socket / Cloud SQL connector (already used by Cloud Run).
- If TCP is needed, switch to an SSL-only mode (e.g. `ENCRYPTED_ONLY`).

**Note**:

- If your CI migrations run from GitHub-hosted runners using Cloud SQL Proxy,
  disabling public IPv4 may break migrations. The clean path is to run
  migrations inside GCP (e.g. Cloud Run Job / Cloud Build) and then disable
  public IPv4.

**Status**: done (Cloud SQL `ssl_mode` is `ENCRYPTED_ONLY`).

#### E) Reduce Secret Manager permissions to per-secret bindings

**Problem**: Cloud Run service account has `roles/secretmanager.secretAccessor`
at the project level (can read all secrets).

**Fix**:

- Replace project-level IAM with per-secret IAM:
  - allow access only to `preu-db-password` and `preu-resend-api-key`.

**Important (ongoing maintenance)**:

- Any time you add a new Secret Manager secret that the app needs, you must:
  - reference it in the Cloud Run service `env.value_source.secret_key_ref`, and
  - add a matching `google_secret_manager_secret_iam_member` granting the Cloud
    Run service account `roles/secretmanager.secretAccessor` for that secret.

**Status**: done.

#### F) Pin supply-chain inputs

**Problem**:

- GitHub Actions use version tags (e.g. `@v2`, `@v4`) rather than commit SHAs.
- `migrate.yml` downloads Cloud SQL proxy without checksum verification.
- Docker base image is tag-based (not digest-pinned).

**Fix**:

- Pin GitHub Actions to commit SHAs.
- Verify `cloud-sql-proxy` download with a checksum (or use an official action).
- Consider pinning `node:20-alpine` by digest for reproducibility.

**Status**: partially done (Actions pinned, proxy checksum verified).

### P2 — reliability / operability improvements

#### G) Deploy by image digest (optional but recommended)

**Problem**: tags are mutable and can complicate rollbacks/audits.

**Fix**:

- After pushing the image, resolve the **digest** and pass it to Terraform as
  `cloud_run_image=...@sha256:...`.

**Status**: done.

#### H) Add an explicit Terraform plan step in CI

**Fix**:

- Run `terraform fmt -check`, `terraform validate`, and `terraform plan` in CI.
- Store plan output in job logs to improve change review.

**Status**: done.

#### I) Align docs with real production config

**Problem**: `app/README.md` implies `DATABASE_URL` is required in prod, but the
runtime uses `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD`.

**Fix**:

- Update `app/README.md` to reflect the production env var model used by
  Terraform/Cloud Run.

## Operational checklist (non-code, but important)

- **Terraform state bucket**:
  - enable bucket **versioning**,
  - restrict access to the CI identity and a small operator group.
- **Runbook**:
  - rollback procedure (use a previous image digest + `terraform apply`),
  - how to run migrations safely,
  - how to rotate secrets.
- **Monitoring**:
  - alert on 5xx rate and latency for Cloud Run,
  - alert on DB CPU/connections/storage,
  - verify backups and test restore periodically.

## Summary

The biggest remaining production risks are **startup migrations** (and
non-blocking failures) and **Cloud SQL exposure / IAM blast radius**. Fixing
those will substantially reduce both outage probability and security risk.

