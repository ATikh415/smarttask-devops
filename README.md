# SmartTask — DevOps/Cloud

Application de gestion de tâches développée dans le cadre de l'examen **Microservices, Docker, Jenkins** (M1 ISI 2025-2026, filière Ingénieur DevOps/Cloud).

Projet réalisé pour la société fictive **SmartTech**, dans le but de moderniser le processus de développement et de déploiement de l'application **SmartTask**.

## Contexte

SmartTech souhaite mettre en place une démarche DevOps complète autour de son application de gestion de tâches, en s'appuyant sur :
- la conteneurisation des services avec Docker,
- l'automatisation des builds,
- la gestion du code source avec GitHub,
- le déploiement local via Docker Compose,
- une chaîne d'intégration et de déploiement continu (CI/CD) avec Jenkins.

## Architecture

L'application est composée de 3 services :

| Service    | Technologie                  | Port  | Rôle                          |
|------------|-------------------------------|-------|--------------------------------|
| Frontend   | Next.js (React)               | 3000  | Interface utilisateur          |
| Backend    | NestJS + Prisma                | 3001  | API REST (CRUD tâches)         |
| Base de données | PostgreSQL (`postgres:18-alpine`) | 5432 | Persistance des données   |

```
[ Frontend (Next.js) ] --HTTP--> [ Backend (NestJS API REST) ] --Prisma--> [ PostgreSQL ]
```

Le backend expose les routes suivantes :
- `GET /tasks` — lister les tâches
- `POST /tasks` — créer une tâche
- `PATCH /tasks/:id/toggle` — basculer l'état terminé/non terminé
- `DELETE /tasks/:id` — supprimer une tâche

## Structure du dépôt

```
smarttask-devops/
├── backend/                # API NestJS
│   ├── src/
│   ├── prisma/              # Schéma et migrations Prisma
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/                # Interface Next.js
│   ├── app/
│   ├── public/
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml       # Orchestration des 3 services
├── Jenkinsfile               # Pipeline CI/CD
└── README.md
```

## Prérequis

- Docker et Docker Compose
- Node.js 20+ (pour un développement local hors conteneur)
- Un compte Docker Hub (pour le pipeline CI/CD)
- Jenkins avec l'agent Docker configuré (pour le Projet 4)

## Démarrage rapide avec Docker Compose (méthode recommandée)

À la racine du projet :

```bash
docker compose up --build
```

Cette commande :
- construit les images `backend` et `frontend` à partir de leurs Dockerfiles respectifs,
- démarre PostgreSQL avec un volume persistant,
- attend que la base de données soit prête (`healthcheck`) avant de démarrer le backend,
- exécute automatiquement les migrations Prisma (`prisma migrate deploy`) au démarrage du backend,
- démarre le frontend une fois le backend disponible.

Accès à l'application : **http://localhost:3000**
API accessible sur : **http://localhost:3001/tasks**

Pour arrêter :
```bash
docker compose down
```

Pour arrêter et supprimer les volumes (réinitialiser la base) :
```bash
docker compose down -v
```

## Démarrage manuel (conteneurs individuels)

### 1. Base de données
```bash
docker network create smarttask-net

docker run --name smarttask-db \
  --network smarttask-net \
  -e POSTGRES_USER=smarttask \
  -e POSTGRES_PASSWORD=smarttask \
  -e POSTGRES_DB=smarttask \
  -p 5432:5432 \
  -v smarttask-data:/var/lib/postgresql/data \
  -d postgres:18-alpine
```

### 2. Backend
```bash
cd backend
docker build -t smarttask-backend:1.0 .
docker run --name smarttask-backend \
  --network smarttask-net \
  -e DATABASE_URL="postgresql://smarttask:smarttask@smarttask-db:5432/smarttask?schema=public" \
  -e PORT=3001 \
  -p 3001:3001 \
  -d smarttask-backend:1.0
```

### 3. Frontend
```bash
cd frontend
docker build -t smarttask-frontend:1.0 --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
docker run --name smarttask-frontend \
  --network smarttask-net \
  -p 3000:3000 \
  -d smarttask-frontend:1.0
```

## Développement local (sans Docker)

### Backend
```bash
cd backend
cp .env.example .env   # ajuster DATABASE_URL si nécessaire
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Variables d'environnement

**backend/.env**
```
DATABASE_URL="postgresql://smarttask:smarttask@localhost:5432/smarttask?schema=public"
PORT=3001
```

**frontend/.env**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Gestion du code source (Git)

Le dépôt suit un modèle à deux branches principales :
- **`Dev`** — branche de développement
- **`Prod`** — branche de production, utilisée pour les déploiements

## CI/CD avec Jenkins

Le `Jenkinsfile` définit un pipeline Multibranch qui, à chaque push sur une branche détectée :
1. récupère le code depuis GitHub,
2. construit les images Docker du backend et du frontend,
3. tague les images (numéro de build + `latest`),
4. se connecte à Docker Hub,
5. publie les images sur Docker Hub.

Le pipeline échoue proprement en cas d'erreur à n'importe quelle étape et affiche les journaux d'exécution correspondants.

