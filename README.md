# Arbor PreU

Plataforma de preparación para la PAES con aprendizaje personalizado basado en dominio de habilidades.

## Estructura del proyecto

- `app/` - Aplicación Next.js 15
- `terraform/` - Infraestructura como código para GCP
- `.github/workflows/` - CI/CD con GitHub Actions

## Desarrollo local

```bash
cd app
npm install
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## Comandos disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar ESLint
- `npm run format` - Formatear código con Prettier
- `npm run format:check` - Verificar formato del código
- `npm run typecheck` - Verificar tipos con TypeScript

## Despliegue

### Configuración inicial

1. **Crear bucket de Terraform state en GCP:**
```bash
gcloud storage buckets create gs://arbor-school-terraform-state \
  --project=arbor-school-473319 \
  --location=us-central1
```

2. **Configurar Workload Identity Federation para GitHub Actions:**
```bash
# Crear pool de identidad
gcloud iam workload-identity-pools create "github-actions" \
  --project="arbor-school-473319" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Crear proveedor de identidad
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="arbor-school-473319" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Crear cuenta de servicio
gcloud iam service-accounts create github-actions \
  --project=arbor-school-473319 \
  --display-name="GitHub Actions Service Account"

# Otorgar permisos
gcloud projects add-iam-policy-binding arbor-school-473319 \
  --member="serviceAccount:github-actions@arbor-school-473319.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding arbor-school-473319 \
  --member="serviceAccount:github-actions@arbor-school-473319.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding arbor-school-473319 \
  --member="serviceAccount:github-actions@arbor-school-473319.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Permitir que GitHub Actions asuma la cuenta de servicio
gcloud iam service-accounts add-iam-policy-binding github-actions@arbor-school-473319.iam.gserviceaccount.com \
  --project=arbor-school-473319 \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/TU_USUARIO/arborschool-preu"
```

Reemplaza `PROJECT_NUMBER` con el número de proyecto de GCP y `TU_USUARIO` con tu usuario de GitHub.

3. **Configurar GitHub Secrets:**

En tu repositorio de GitHub, ve a Settings > Secrets and variables > Actions y añade:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github-provider`
- `GCP_SERVICE_ACCOUNT`: `github-actions@arbor-school-473319.iam.gserviceaccount.com`

4. **Desplegar infraestructura con Terraform:**
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

5. **Configurar dominio personalizado:**

En tu registrador de dominios (donde compraste arbor.school), añade un registro CNAME:

```
preu.arbor.school -> ghs.googlehosted.com
```

### Despliegue automático

Cada push a la rama `main` que modifique archivos en `app/` disparará automáticamente:
1. Instalación de dependencias
2. Ejecución de linters y verificación de tipos
3. Construcción de imagen Docker
4. Push a Artifact Registry
5. Despliegue a Cloud Run
6. Actualización del mapeo de dominio

## Tecnologías

- **Frontend:** Next.js 15, React 19, TypeScript
- **Estilos:** Tailwind CSS 4
- **Calidad de código:** ESLint, Prettier, Husky, lint-staged
- **Infraestructura:** Terraform, GCP Cloud Run, Artifact Registry
- **CI/CD:** GitHub Actions con Workload Identity Federation