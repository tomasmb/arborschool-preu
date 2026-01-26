terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "gcs" {
    bucket = "arbor-school-terraform-state"
    prefix = "preu/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ------------------------------------------------------------------------------
# DATABASE - Cloud SQL PostgreSQL
# ------------------------------------------------------------------------------

# Generate a random password for the database
resource "random_password" "db_password" {
  length  = 32
  special = false
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "preu" {
  name             = "preu-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    edition           = "ENTERPRISE"
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled = true
      # Cloud SQL Auth Proxy Unix socket connections don't use PostgreSQL-level SSL
      # (the proxy provides encryption). Must allow unencrypted for Auth Proxy to work.
      ssl_mode = "ALLOW_UNENCRYPTED_AND_ENCRYPTED"
      # TODO: Add your dev IP here if needed: authorized_networks { name = "dev" value = "x.x.x.x/32" }
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = true
}

# Create the main database
resource "google_sql_database" "preu" {
  name     = "preu"
  instance = google_sql_database_instance.preu.name
}

# Create the database user
resource "google_sql_user" "preu" {
  name     = "preu_app"
  instance = google_sql_database_instance.preu.name
  password = random_password.db_password.result
}

resource "google_artifact_registry_repository" "preu" {
  location      = var.region
  repository_id = "preu"
  description   = "Docker repository for Arbor PreU"
  format        = "DOCKER"
}

# ------------------------------------------------------------------------------
# IAM & SECRETS
# ------------------------------------------------------------------------------

# Service account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "preu-cloud-run"
  display_name = "PreU Cloud Run Service Account"
}

# Grant Cloud Run SA access to Cloud SQL
resource "google_project_iam_member" "cloud_run_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Grant Cloud Run SA access to Secret Manager
resource "google_project_iam_member" "cloud_run_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Store database password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "preu-db-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

resource "google_cloud_run_v2_service" "preu" {
  name     = "preu"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = var.cloud_run_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        # cpu_idle = false keeps CPU allocated, preventing connection issues
        # Cost: ~$30/month more, but much more reliable for DB connections
        cpu_idle = false
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      # Database connection via Cloud SQL Auth Proxy (built into Cloud Run)
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.preu.connection_name}"
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.preu.name
      }
      env {
        name  = "DB_USER"
        value = google_sql_user.preu.name
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      # Email service
      env {
        name = "RESEND_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "preu-resend-api-key"
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.preu.connection_name]
      }
    }

    scaling {
      # min_instance_count = 1 keeps one container warm, avoiding cold starts
      # This prevents DB connection issues when the service is idle
      min_instance_count = 1
      max_instance_count = 10
    }

    service_account = google_service_account.cloud_run.email
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_artifact_registry_repository.preu,
    google_sql_database_instance.preu,
    google_secret_manager_secret_version.db_password
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.preu.name
  location = google_cloud_run_v2_service.preu.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "preu" {
  location = var.region
  name     = "preu.arbor.school"

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.preu.name
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [metadata, spec]
  }
}