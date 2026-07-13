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
tailwind.config.ts
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

## Prochaine etape

Brancher le module Lists frontend:

- lecture des listes,
- creation/suppression,
- integration token bearer,
- ecran dashboard enrichi.

## Dependance ajoutee a cette etape

- `@nuxtjs/tailwindcss` (module Nuxt d'integration Tailwind).

## Contrat backend Auth utilise

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Le refresh token reste gere en cookie `HttpOnly` cote backend. Le frontend conserve uniquement l'access token en etat applicatif.
