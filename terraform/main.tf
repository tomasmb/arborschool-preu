terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
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

resource "google_artifact_registry_repository" "preu" {
  location      = var.region
  repository_id = "preu"
  description   = "Docker repository for Arbor PreU"
  format        = "DOCKER"
}

resource "google_cloud_run_v2_service" "preu" {
  name     = "preu"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/preu/preu:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_artifact_registry_repository.preu]
}

resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_v2_service.preu.name
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
}