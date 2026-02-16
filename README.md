# Arbor PreU

Plataforma de preparación para la PAES con aprendizaje personalizado basado en dominio de habilidades.

**Live:** https://preu.arbor.school

## Estructura del proyecto

```
.
├── web/              # Next.js 15 application
├── design-system/    # Brand assets and design tokens
└── docs/             # Technical documentation
```

## Desarrollo local

```bash
cd web
npm install
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## Stack tecnológico

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Database:** PostgreSQL (Neon)
- **Hosting:** Vercel
- **Code Quality:** ESLint, Prettier, Husky, lint-staged

## Deployment

Push to `main` triggers automatic deployment via Vercel.

See [web/README.md](./web/README.md) for detailed setup instructions.
