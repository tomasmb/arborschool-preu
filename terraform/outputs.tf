output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.preu.uri
}

output "artifact_registry_url" {
  description = "URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/preu"
}

# ------------------------------------------------------------------------------
# DATABASE OUTPUTS
# ------------------------------------------------------------------------------

output "db_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.preu.name
}

output "db_connection_name" {
  description = "Cloud SQL connection name for Cloud SQL Auth Proxy"
  value       = google_sql_database_instance.preu.connection_name
}

output "db_public_ip" {
  description = "Cloud SQL public IP (for local development with Cloud SQL Auth Proxy)"
  value       = google_sql_database_instance.preu.public_ip_address
}

output "db_name" {
  description = "Database name"
  value       = google_sql_database.preu.name
}

output "db_user" {
  description = "Database user"
  value       = google_sql_user.preu.name
}

output "db_password_secret" {
  description = "Secret Manager secret ID for database password"
  value       = google_secret_manager_secret.db_password.secret_id
}