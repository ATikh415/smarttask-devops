# SmartTask

Application de gestion de tâches - Backend NestJS + Prisma + PostgreSQL, Frontend Next.js.

## Structure
- `backend/` : API REST NestJS (CRUD tâches)
- `frontend/` : Interface Next.js

## Lancer en local (sans Docker)
1. Démarrer une instance PostgreSQL locale
2. `cd backend && cp .env.example .env` (ajuster DATABASE_URL)
3. `npm install && npx prisma generate && npx prisma migrate dev --name init`
4. `npm run start:dev` (port 3001)
5. `cd frontend && cp .env.example .env && npm install && npm run dev` (port 3000)
