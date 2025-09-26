output "service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.preu.uri
}

output "artifact_registry_url" {
  description = "URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/preu"
}