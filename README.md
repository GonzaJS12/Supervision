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

La web queda escuchando en `0.0.0.0:3000` para poder entrar desde otro equipo o el celular en la misma red (`http://IP-LAN:3000`). En desarrollo, Expo toma la IP del bundler si no hay `EXPO_PUBLIC_API_URL`. En producción configure `CORS_ORIGINS` (orígenes separados por coma); el Bearer del móvil no usa cookie.

```bash
npm run ci
```

Ese comando corre las pruebas de dominio y `tsc` de la web.

## Despliegue en Vercel (solo la web)

Expo no se despliega en Vercel. El proyecto es un monorepo: en el dashboard deje **Root Directory** en `apps/web` para que Next.js detecte `next.config.ts`.

1. Cree un PostgreSQL (Neon, Supabase u otro) y aplique el esquema **antes** del primer deploy:

   ```bash
   npm run db:migrate:deploy
   ```

   (con `DATABASE_URL` y, si usa pooler, `DIRECT_URL` apuntando a producción).

2. En Vercel: **Add New Project** → el repositorio de Git → **Root Directory:** `apps/web`.
3. **Node.js Version:** 20.x.
4. Variables de entorno (Production y Preview): `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGINS`.
5. Deploy. La URL pública es la web y la API (`https://….vercel.app/api/v1/health`).
6. En el móvil, `EXPO_PUBLIC_API_URL` debe ser esa URL (sin barra final).

Si aparecen nombres con caracteres raros (`AcuÃ±a` en vez de `Acuña`), corra `npm run db:reparar:texto` y en la app pulse **Sincronizar**.

PDF en el celular: Inicio y Mis supervisiones exportan el reporte; el detalle de una supervisión exporta esa ficha.
