# Backend - Tasks Manager (NestJS)

[![backend-ci](https://github.com/belaouer/tasks-manager/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/belaouer/tasks-manager/actions/workflows/backend-ci.yml)

Backend API du projet Tasks Manager, construit avec NestJS, DDD et architecture hexagonale (Ports and Adapters).

## Objectif du backend

Ce backend sert de reference professionnelle pour:

- separer strictement Domain, Application, Infrastructure et Presentation
- conserver un domaine pur, sans dependance framework/ORM
- injecter toutes les dependances techniques via des ports abstraits
- changer de technologie de persistence sans toucher au metier
- fournir une API REST + WebSocket securisee et testee

## Perimetre fonctionnel

Le backend couvre completement les domaines:

- Auth
- Users
- Lists
- Tasks

Fonctionnalites principales:

- JWT access + refresh
- cookie HttpOnly pour refresh token
- rotation des refresh tokens + hash en base
- profils utilisateur
- gestion des listes
- gestion des taches (creation, completion, reouverture, suppression)
- temps reel Socket.IO pour les evenements Tasks

## Architecture

### Couches

- Domain: entites, value objects, exceptions metier, ports
- Application: use cases, DTO applicatifs, orchestration
- Infrastructure: adapters techniques (JWT, bcrypt, DB, clock, ids)
- Presentation: controllers, guards, filters, DTO HTTP, gateway WebSocket

### Ports abstraits (classes)

Tous les ports sont implementes en classes abstraites (pas interfaces TypeScript) pour permettre:

- un token DI disponible au runtime NestJS
- une inversion de dependance explicite et testable
- une substitution simple des adapters

### Drivers de persistence interchangeables

Le choix du driver se fait au demarrage via `PERSISTENCE_DRIVER`:

- `in-memory`
- `typeorm`
- `prisma`

Les use cases et le domaine ne changent pas quand le driver change.

## Structure du code

```text
backend/
  src/
    config/
    domains/
      auth/
      users/
      lists/
      tasks/
    shared/
  test/
```

Chaque domaine suit le meme schema interne:

```text
domain/
application/
infrastructure/
presentation/
```

## Securite

Mesures appliquees:

- `helmet`
- `x-powered-by` desactive
- ValidationPipe globale stricte:
  - whitelist
  - forbidNonWhitelisted
  - forbidUnknownValues
  - transform
- JWT verifies avec issuer + audience + algorithme
- refresh token uniquement en cookie HttpOnly
- hash du refresh token stocke (jamais en clair)
- CORS restreint via `FRONTEND_ORIGINS`

## Variables d'environnement

Fichier exemple: `backend/.env.example`

Variables principales:

- `PORT`
- `NODE_ENV`
- `PERSISTENCE_DRIVER`
- `DATABASE_URL` (obligatoire avec `typeorm` ou `prisma`)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `SWAGGER_ENABLED`
- `FRONTEND_ORIGINS`

## Lancement local (sans Docker)

Depuis `backend/`:

```bash
npm install
npm run start:dev
```

API par defaut: `http://localhost:3000`

## Lancement Docker (recommande)

Depuis la racine du repository:

```bash
docker compose up --build
```

Services exposes:

- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Le compose configure le backend en `PERSISTENCE_DRIVER=prisma`.

## Documentation API

Swagger est disponible sur:

- `/docs` si `SWAGGER_ENABLED=true`

## Contrats API (resume)

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### Users

- `GET /users/me`
- `GET /users/:id`
- `PATCH /users/:id`

### Lists

- `GET /lists`
- `POST /lists`
- `DELETE /lists/:listId`

### Tasks

- `GET /lists/:listId/tasks`
- `POST /lists/:listId/tasks`
- `PATCH /lists/:listId/tasks/:taskId/complete`
- `PATCH /lists/:listId/tasks/:taskId/reopen`
- `DELETE /lists/:listId/tasks/:taskId`

## WebSocket Tasks

Namespace:

- `/tasks`

Rooms:

- `lists:join`
- `lists:leave`

Evenements emis:

- `task:created`
- `task:updated`
- `task:completed`
- `task:deleted`

## Tests

Depuis `backend/`:

```bash
npm run test
npm run test:e2e
```

Le projet inclut:

- tests unitaires de use cases
- tests d'integration controllers/gateway
- tests E2E inter-domaines

## CI

Workflow GitHub Actions: `backend-ci`

Executions:

- `npm ci`
- `npx prisma generate`
- lint
- tests
- build

## Commandes utiles

Depuis `backend/`:

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
npm run start:prod
```

## Notes de conception

Ce backend privilegie la maintenabilite et la testabilite:

- logique metier isolee des details techniques
- adapters remplacables sans impact sur les use cases
- conventions homogenes sur tous les domaines
- couverture de tests orientee contrat et regression
