# Seguridad v79 · pruebas locales

- `sql/base.sql`: réplica mínima del servidor (solo estructura). `sql/sec.sql`: migración PENDIENTE de aprobación. `sql/sec_corte.sql`: corte del día de publicación.
- `node t_sql.js`: 71 pruebas del SQL real sobre PostgreSQL local (PGlite).
- `TZ=America/Santiago SITE=/ruta/ascenso node t_e2e.js`: 72 pruebas con varios navegadores (cada uno con su llave virtual) contra `shim.js`, que imita Supabase con el SQL real.
- Instalar: `npm install @electric-sql/pglite @simplewebauthn/server@13` (Playwright global).
- Rama de la app: `seg-20261126` (no publicada).
