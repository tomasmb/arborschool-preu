# Arbor PreU

Plataforma de preparación para la PAES con aprendizaje personalizado basado en dominio de habilidades.

🌐 **Live:** https://preu.arbor.school

## Estructura del proyecto

```
.
├── app/              # Next.js 15 application
├── design-system/    # Brand assets and design tokens
├── terraform/        # Infrastructure as code (GCP)
└── .github/          # CI/CD workflows
```

## Desarrollo local

```bash
cd app
npm install
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## Stack tecnológico

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Infrastructure:** GCP Cloud Run, Artifact Registry
- **CI/CD:** GitHub Actions (automated deployment on push to main)
- **Code Quality:** ESLint, Prettier, Husky, lint-staged