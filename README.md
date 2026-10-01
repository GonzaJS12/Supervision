# Supervisión APS

Monorepo del sistema de supervisión de agentes sanitarios.

- `apps/web` — Next.js (web + `/api/v1`)
- `apps/mobile` — Expo (supervisores en terreno + SQLite)
- `packages/database` — Prisma / PostgreSQL
- `packages/domain` — reglas de clasificación y validación
- `packages/api-client` — cliente HTTP para la API

## Arranque

```bash
cd ~/Desktop/F10/supervisionAPS
copy .env.example .env
npm install
npm run db:generate
npm run dev:web
```

Web: http://localhost:3000  
Salud: http://localhost:3000/api/v1/health

Móvil (en otra terminal):

```bash
npm run dev:mobile
```
