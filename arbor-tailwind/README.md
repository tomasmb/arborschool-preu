# Arbor School — Tailwind Theme

## Archivos
- `tailwind.config.js` — Configuración que lee variables desde `tokens.css`.
- `src/styles/tokens.css` — Design tokens en CSS variables.
- `src/styles/globals.css` — Importa tokens + estilos base y ejemplos de componentes.

## Uso (Next.js)
1. Instala Tailwind según docs.
2. Copia estos archivos dentro de tu proyecto.
3. Importa `src/styles/globals.css` en `src/app/layout.tsx` (Next 13+) o `_app.tsx` (Next 12).

## Ejemplo de botón
```html
<button class="btn-primary">Continuar</button>
<button class="btn-cta">Comenzar ahora</button>
```

## Accesibilidad
Asegura contraste AA/AAA cuando uses nuevas combinaciones de colores.
