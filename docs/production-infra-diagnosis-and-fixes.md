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

Concrete changes to make:

- Update `.github/workflows/deploy.yml` to run migrations before `terraform apply`.
- Remove startup migrations from `app/Dockerfile`.

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

#### F) Pin supply-chain inputs

**Problem**:

- GitHub Actions use version tags (e.g. `@v2`, `@v4`) rather than commit SHAs.
- `migrate.yml` downloads Cloud SQL proxy without checksum verification.
- Docker base image is tag-based (not digest-pinned).

**Fix**:

- Pin GitHub Actions to commit SHAs.
- Verify `cloud-sql-proxy` download with a checksum (or use an official action).
- Consider pinning `node:20-alpine` by digest for reproducibility.

### P2 — reliability / operability improvements

#### G) Deploy by image digest (optional but recommended)

**Problem**: tags are mutable and can complicate rollbacks/audits.

**Fix**:

- After pushing the image, resolve the **digest** and pass it to Terraform as
  `cloud_run_image=...@sha256:...`.

#### H) Add an explicit Terraform plan step in CI

**Fix**:

- Run `terraform fmt -check`, `terraform validate`, and `terraform plan` in CI.
- Store plan output in job logs to improve change review.

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

