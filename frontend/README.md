# Frontend - Tasks Manager (Nuxt 4)

Ce frontend est la couche presentation du projet Tasks Manager.
Il demarre par une fondation UI claire, responsive et maintenable, avant integration progressive des flux metier.

## Etat actuel

- Socle Nuxt 4 operationnel.
- Layout global en place.
- Page d'accueil de fondation frontend.
- Tailwind CSS active avec UI dark mode par defaut.
- Pinia active pour la gestion d'etat global frontend.
- Toggle de theme sombre/clair avec persistence locale.
- Module Auth frontend en place (register/login/logout/refresh).
- Dashboard protege par middleware d'authentification.
- Module Lists frontend en place (lecture/creation/suppression).
- Module Tasks frontend en place (lecture/creation/completion/reouverture/suppression).
- Temps reel Tasks via WebSocket (Socket.IO) en place.
- Hardening realtime: reconnect/resubscribe et statut socket visible en UI.
- Observabilite realtime: metriques de reconnexion + horodatages de sante socket.
- Fondations offline-first UX: statut reseau frontend + garde-fous sur ecritures hors ligne.
- Retries metier sur conflits de synchronisation pour les mutations Tasks.
- File locale write-behind pour creation de taches hors ligne + flush auto au retour reseau.
- Dashboard restructure en 3 zones (left/main/right) avec left sidebar retractable.
- Right sidebar detail de tache activee sur selection d'une tache.
- Modales de confirmation de suppression (liste et tache) implementees.
- Section dediee Mes taches terminees implementee (repliee par defaut, depliable).
- Intercepteur HTTP centralise via client API Nuxt: refresh transparent sur 401 + retry + redirection login en cas d'echec refresh.
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
		connectivity/
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
- E2E multi-onglets: verification de coherence des donnees entre clients.
- Integration realtime: verification des metriques d'observabilite.
- Integration offline: verification des blocages metier lists/tasks hors ligne.
- Integration sync conflicts: verification du retry metier sur erreur 409.
- Integration write-behind: verification de la file offline et de la synchronisation differee.

## Prochaine etape

Prochaine evolution suggeree:

- gestion explicite des conflits metier multi-utilisateurs.

## Audit Frontend vs Technical Test

Statut global:

- Base frontend solide (auth, listes, taches, realtime, offline, retries) en place.
- Plusieurs exigences fonctionnelles/UI du cahier sont encore a finaliser.

### Deja couvert cote frontend

- Authentification register/login + bootstrap session au chargement.
- Etat global auth/listes/taches migre sur Pinia (fondation P0.1).
- Route protegee via middleware Nuxt.
- Flux listes/taches principal (creation, suppression, completion, reouverture).
- Synchronisation temps reel Socket.IO sur les taches.
- Tests unitaires/integration/e2e deja operationnels.

### Restant a faire par priorite

P0 - Critique (alignement direct cahier)

1. Pinia store global: fait pour auth/listes/taches. Reste a finaliser la migration complete de la couche presentation en composants dedies (TaskCard/TaskForm/Sidebar/TaskDetail) pour supprimer les derniers couplages page-usecase.
2. Page principale 3 zones: fait (left sidebar retractable + main content + right sidebar detail).
3. Right sidebar detail tache: fait (selection, details complets, action suppression sans modale).
4. Modales de confirmation suppression: fait (liste avec warning cascade + tache).
5. Ajouter la section "Mes taches terminees" dediee, repliee par defaut et depliable: fait.

P1 - Important (qualite produit / robustesse)

1. Mettre en place un intercepteur HTTP Nuxt pour refresh transparent centralise et gestion uniforme des 401 (refresh puis redirection login si echec), au lieu d'une logique principalement au bootstrap: fait.
2. Finaliser le mode offline write-behind pour toutes les mutations (pas seulement creation), avec strategie de retry/exponential backoff et remontes d'etat utilisateur claires.
3. Renforcer les tests e2e sur les exigences UI du cahier:
	detail sidebar, section terminees, modales, cas token expire et redirection login.

P2 - Livrable / industrialisation

1. Ajouter le Dockerfile frontend (actuellement absent) et verifier l'integration docker-compose end-to-end.
2. Completer la section README "avec plus de temps" sur priorites de tests et choix d'architecture frontend (Pinia, realtime, offline queue).
3. Ajouter une check-list de conformite finale frontend pour valider chaque point du cahier avant livraison.

## Dependance ajoutee a cette etape

- `@nuxtjs/tailwindcss` (module Nuxt d'integration Tailwind).
- `@pinia/nuxt` et `pinia` (etat global frontend).

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
