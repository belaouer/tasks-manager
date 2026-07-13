# Frontend - Tasks Manager (Nuxt 4)

Ce frontend est la couche presentation du projet Tasks Manager.
Il demarre par une fondation UI claire, responsive et maintenable, avant integration progressive des flux metier.

## Etat actuel

- Socle Nuxt 4 operationnel.
- Layout global en place.
- Page d'accueil de fondation frontend.
- Tailwind CSS active avec UI dark mode par defaut.
- Toggle de theme sombre/clair avec persistence locale.
- Module Auth frontend en place (register/login/logout/refresh).
- Dashboard protege par middleware d'authentification.
- Module Lists frontend en place (lecture/creation/suppression).
- Module Tasks frontend en place (lecture/creation/completion/reouverture/suppression).
- Temps reel Tasks via WebSocket (Socket.IO) en place.
- Strategie de tests frontend en place: unitaires, integration et e2e.

## Arborescence active

```text
app/
	app.vue
	assets/
		css/
			main.css
	domains/
		landing/
			domain/
			application/
		theme/
			domain/
			application/
			infrastructure/
		auth/
			domain/
			application/
			infrastructure/
		lists/
			domain/
			application/
			infrastructure/
		tasks/
			domain/
			application/
			infrastructure/
	layouts/
		default.vue
	pages/
		index.vue
		auth/
			login.vue
			register.vue
		dashboard.vue
middleware/
	authenticated.ts
plugins/
	auth-bootstrap.client.ts
tests/
	unit/
	integration/
	e2e/
tailwind.config.ts
vitest.config.ts
playwright.config.ts
```

Regle DDD frontend appliquee:

- UI dans `app/pages`.
- Metier frontend dans `app/domains`.
- Les pages consomment les use cases frontend sans porter la logique metier.

## Choix techniques

- Nuxt 4 + Vue 3 pour SSR/SPA moderne et conventions de structure robustes.
- Layout centralise pour stabiliser la shell applicative avant ajout des ecrans metier.
- Tailwind CSS pour accelerer une UI coherente, maintenable et responsive.
- Theme sombre par defaut + mode clair via un domaine `theme` dedie.
- Persistance du choix de theme via adapter infrastructure navigateur (`localStorage`).

## Lancer le frontend

```bash
npm install
npm run dev
```

Le serveur dev est disponible sur http://localhost:3000.

## Build production

```bash
npm run build
npm run preview
```

## Tests

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

Niveaux couverts:

- Unitaire: helpers du domaine.
- Integration: use cases/composables avec adapters mockes.
- E2E: parcours dashboard auth + lists + tasks (Playwright).

## Prochaine etape

Ajouter la synchronisation multi-clients et hardening realtime:

- gestion explicite reconnect/resubscribe,
- tests e2e multi-onglets,
- notifications UX de statut socket.

## Dependance ajoutee a cette etape

- `@nuxtjs/tailwindcss` (module Nuxt d'integration Tailwind).

## Contrat backend Auth utilise

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Le refresh token reste gere en cookie `HttpOnly` cote backend. Le frontend conserve uniquement l'access token en etat applicatif.

## Contrat backend Lists utilise

- `GET /lists`
- `POST /lists`
- `DELETE /lists/:listId`

Tous les appels Lists utilisent `Authorization: Bearer <accessToken>`.

## Contrat backend Tasks utilise

- `GET /lists/:listId/tasks`
- `POST /lists/:listId/tasks`
- `PATCH /lists/:listId/tasks/:taskId/complete`
- `PATCH /lists/:listId/tasks/:taskId/reopen`
- `DELETE /lists/:listId/tasks/:taskId`

Tous les appels Tasks utilisent `Authorization: Bearer <accessToken>`.

## Contrat backend WebSocket Tasks utilise

- Namespace Socket.IO: `/tasks`
- Auth handshake: token bearer via `auth.token`
- Rooms: `lists:join` / `lists:leave`
- Evenements serveur:
	- `task:created`
	- `task:updated`
	- `task:completed`
	- `task:deleted`
