# Frontend - Tasks Manager (Nuxt 4)

[![frontend-ci](https://github.com/belaouer/tasks-manager/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/belaouer/tasks-manager/actions/workflows/frontend-ci.yml)

Frontend du projet Tasks Manager, construit avec Nuxt 4, Vue 3, Pinia et Tailwind CSS.

## Objectif du frontend

Fournir une couche presentation claire et robuste, alignee avec une approche DDD frontend:

- UI dans pages/layouts/components
- logique metier dans domains
- infrastructure HTTP/WebSocket isolee
- etat global via stores/composables Pinia

## Perimetre fonctionnel

Fonctionnalites couvertes:

- Auth complete (register/login/logout/refresh)
- protection des routes (`authenticated`, `guest`)
- dashboard principal lists + tasks
- details de tache dans panneau dedie
- modales de confirmation de suppression
- section taches terminees repliable
- synchronisation temps reel Socket.IO
- robustesse offline-first:
  - detection statut reseau
  - write-behind local
  - flush auto au retour reseau
  - retry avec backoff

## Architecture frontend

```text
frontend/
  app/
    components/
      domains/
      shared/
    domains/
      auth/
      lists/
      tasks/
      connectivity/
      theme/
    layouts/
      default.vue
      auth.vue
    middleware/
      authenticated.ts
      guest.ts
    pages/
      auth/
      dashboard.vue
      index.vue
    plugins/
  tests/
    unit/
    integration/
    e2e/
```

Principes appliques:

- pages: composition d'ecrans
- domains: use cases/composables metier
- adapters: appels API/Socket et stockage local
- composants partages: reutilisation UI sans couplage metier fort

## Auth, redirections et layouts

- pages invitees (`/auth/*`) utilisent un layout dedie `auth.vue`
- pages protegees utilisent le middleware `authenticated`
- guard SSR + client pour eviter les artefacts d'affichage lors des redirections

## Variables d'environnement

Fichier exemple: `frontend/.env.example`

Variables principales:

- `HOST`
- `PORT`
- `NUXT_API_BASE_URL`
- `NUXT_PUBLIC_API_BASE_URL`

## Lancement local (sans Docker)

Depuis `frontend/`:

```bash
npm install
npm run dev
```

Frontend par defaut: `http://localhost:3000`

## Build production

Depuis `frontend/`:

```bash
npm run build
npm run preview
```

## Lancement Docker

Depuis la racine du repository:

```bash
docker compose up --build
```

Services exposes:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

## Contrats backend consommes

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

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

### WebSocket Tasks

- namespace: `/tasks`
- rooms: `lists:join`, `lists:leave`
- evenements: `task:created`, `task:updated`, `task:completed`, `task:deleted`

## Tests

Depuis `frontend/`:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Couverture ciblee:

- unitaires: regles metier et etat auth
- integration: domaines lists/tasks/auth + clients/adapters
- e2e: parcours utilisateur principaux

## CI

Workflow GitHub Actions: `frontend-ci`

Executions:

- `npm ci`
- `npm run test:unit`
- `npm run test:integration`
- `npm run build`

## Stack technique

- Nuxt 4
- Vue 3
- Pinia
- Tailwind CSS
- Socket.IO client
- Vitest + Playwright

## Commandes utiles

Depuis `frontend/`:

```bash
npm run dev
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run preview
```

## Notes de conception

Le frontend est structure pour rester evolutif:

- separation nette UI/metier
- flux auth et redirection robustes (SSR + client)
- composabilite des domaines
- resilience reseau pour usage reel (offline/retry/sync)
