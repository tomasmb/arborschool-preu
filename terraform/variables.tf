variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "arbor-school-473319"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "db_tier" {
  description = "Cloud SQL instance tier (db-f1-micro is cheapest ~$9/mo)"
  type        = string
  default     = "db-f1-micro"
}

variable "cloud_run_image" {
  description = "Full container image reference for Cloud Run (tag or digest)."
  type        = string
  default     = "us-central1-docker.pkg.dev/arbor-school-473319/preu/preu:latest"
}
