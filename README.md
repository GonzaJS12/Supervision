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

Si aparecen nombres con caracteres raros (`AcuÃ±a` en vez de `Acuña`), corra `npm run db:reparar:texto` y en la app pulse **Sincronizar**.

PDF en el celular: Inicio y Mis supervisiones exportan el reporte; el detalle de una supervisión exporta esa ficha.
