# Backend - Tasks Manager (NestJS)

Ce backend est conçu comme une démonstration professionnelle de DDD + Architecture Hexagonale (Ports & Adapters), avec un découpage orienté domaines.

Etat actuel du développement: phase 1 centrée uniquement sur Authentification.

Avancement actuel: Auth complet + Users (socle Domain + Application).

## Objectifs architecturaux

- Séparer strictement Domain, Application, Infrastructure et Presentation.
- Garder le domaine pur (aucune dépendance NestJS, ORM, framework externe).
- Faire dépendre les use cases uniquement de ports abstraits.
- Permettre l'échange d'adapters techniques sans modifier la logique métier.
- Positionner tous les domaines sous `src/domains`.
- Positionner les éléments non-domaines directement sous `src`.

## Arborescence cible (phase Auth)

```text
src/
  domains/
    auth/
      domain/
        entities/
        value-objects/
        services/
        ports/
        exceptions/
        factories/
      application/
        use-cases/
        dto/
        services/
      infrastructure/
        persistence/
          common/
          typeorm/
          prisma/
        security/
        jwt/
        services/
      presentation/
        controllers/
        dto/
        guards/
        filters/
        mappers/
  shared/
    domain/
      services/
    application/
      services/
    infrastructure/
      services/
```

## Pourquoi ce découpage

- `domain`: coeur métier, invariants, règles, erreurs métier, contrats (ports).
- `application`: orchestration des cas d'usage (login, register, refresh, logout), sans dépendance aux implémentations.
- `infrastructure`: implémentations concrètes (JWT, bcrypt, persistence, horloge, etc.).
- `presentation`: HTTP, DTO d'entrée/sortie, guards et mapping des erreurs.

Ce découpage réduit le couplage, améliore la testabilité et prépare l'évolution vers plusieurs adapters de persistence.

## Ports sous forme de classes abstraites

Tous les ports sont prévus comme classes abstraites (et non interfaces TypeScript) pour trois raisons:

- NestJS a besoin d'un token d'injection présent au runtime.
- Une interface TypeScript est effacée à la compilation.
- Une classe abstraite offre un contrat explicite, injectable, testable et stable.

## Dynamic Module de persistence (prévu)

L'objectif est d'introduire un module dynamique de persistence pour sélectionner l'adapter au démarrage (TypeORM ou Prisma) sans impact sur:

- les use cases
- le domaine
- les contrôleurs

Cela matérialise le bénéfice principal de l'architecture hexagonale: inverser la dépendance vers les ports et rendre l'infrastructure interchangeable.

## Dépendances installées pour la phase Auth

Uniquement les dépendances nécessaires à l'authentification ont été ajoutées.

Runtime:

- `@nestjs/jwt`
- `@nestjs/passport`
- `@nestjs/config`
- `joi`
- `@nestjs/swagger`
- `swagger-ui-express`
- `passport`
- `passport-jwt`
- `passport-local`
- `bcrypt`
- `class-validator`
- `class-transformer`
- `cookie-parser`

Type definitions (dev):

- `@types/passport-jwt`
- `@types/passport-local`
- `@types/bcrypt`
- `@types/cookie-parser`

Non installé volontairement à ce stade:

- WebSocket / Socket.io

## Plan d'implémentation (prochaine étape)

1. Préparer la finalisation de la branche Docker backend (revue finale + merge vers main).

## Etape réalisée: Docker Compose backend + PostgreSQL

Eléments implémentés:

- Ajout d'un `docker-compose.yml` à la racine du workspace avec:
  - service `postgres` (PostgreSQL 16 + volume persistant + healthcheck)
  - service `backend` (build via `backend/Dockerfile`)
- Configuration des variables backend pour l'exécution conteneurisée:
  - `PERSISTENCE_DRIVER=prisma`
  - `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/tasks_manager`

Décisions clés:

- Le compose orchestre backend et base relationnelle dans un même réseau Docker.
- Le backend attend explicitement que PostgreSQL soit healthy avant démarrage.
- La persistance PostgreSQL est conservée via volume nommé `postgres_data`.

Commandes Docker Compose:

- Démarrage:
  - `docker compose up --build`
- Arrêt:
  - `docker compose down`

## Etape réalisée: Dockerisation du backend

Eléments implémentés:

- Ajout d'un `Dockerfile` backend multi-stage:
  - stage `deps` (installation dépendances + `prisma generate`)
  - stage `build` (compilation NestJS + prune des dépendances dev)
  - stage `runtime` (image d'exécution minimale)
- Ajout d'un `.dockerignore` backend pour réduire le contexte de build et accélérer la construction d'image.

Décisions clés:

- Le build multi-stage réduit la taille de l'image finale et isole les responsabilités build/runtime.
- Le client Prisma est généré au build pour garantir la cohérence runtime.
- Le runtime démarre uniquement `dist/main` avec `NODE_ENV=production`.

Commandes Docker backend:

- Build image:
  - `docker build -t tasks-manager-backend ./backend`
- Run conteneur:
  - `docker run --rm -p 3000:3000 --env-file backend/.env.example tasks-manager-backend`

## Etape réalisée: Tests d'intégration WebSocket Tasks

Eléments implémentés:

- Nouveau test d'intégration `tasks.gateway.integration.spec.ts` pour le gateway temps réel.
- Scénarios couverts:
  - connexion WebSocket rejetée sans token JWT,
  - join room par liste (`lists:join`) et leave room (`lists:leave`),
  - réception des événements temps réel côté client:
    - `task:created`
    - `task:completed`
    - `task:updated`
    - `task:deleted`
  - isolation entre rooms: un client sur une autre liste ne reçoit pas l'événement.

Décisions clés:

- Les tests valident le comportement réel Socket.IO contre l'application Nest démarrée en mémoire.
- L'authentification JWT au handshake est vérifiée dans un scénario bout-en-bout.
- La couverture complète le socle temps réel déjà branché dans les use cases Tasks.

## Etape réalisée: Socle WebSocket temps réel Tasks

Eléments implémentés:

- Dépendances WebSocket ajoutées:
  - `@nestjs/websockets`
  - `@nestjs/platform-socket.io`
  - `socket.io`
- Gateway Socket.IO `TasksGateway`:
  - namespace `/tasks`
  - vérification JWT au handshake (`HS256`, issuer, audience)
  - refus des connexions anonymes/invalides
  - gestion des rooms par liste via événements `lists:join` et `lists:leave`
- Emetteur temps réel central `TasksRealtimeEmitterService`.
- Port applicatif `TasksRealtimePublisherPort` + adapter `SocketIoTasksRealtimePublisherAdapter`.
- Emission des événements serveur depuis les use cases Tasks:
  - `task:created` (CreateTaskUseCase)
  - `task:completed` (CompleteTaskUseCase)
  - `task:updated` (ReopenTaskUseCase)
  - `task:deleted` (DeleteTaskUseCase)
- Branchement complet dans `TasksModule` (gateway + emitter + binding du port publisher).
- Tests unitaires Tasks mis à jour pour valider l'émission des événements sur les use cases concernés.

Décisions clés:

- L'émission temps réel est pilotée par un port applicatif pour conserver l'inversion de dépendance.
- Les use cases restent indépendants de Socket.IO: ils publient via contrat abstrait uniquement.
- Le gateway gère uniquement les préoccupations transport/auth/rooms, sans logique métier.

## Etape réalisée: E2E global inter-domaines avec Tasks

Eléments implémentés:

- Le scénario E2E global couvre désormais Auth + Users + Lists + Tasks.
- Extension de `test/app.e2e-spec.ts` avec un parcours complet Tasks:
  - création de deux identités via Auth,
  - création de listes,
  - création de tâches,
  - lecture des tâches par liste,
  - completion/réouverture,
  - vérification d'isolation inter-utilisateurs (403),
  - suppression propriétaire et vérification post-suppression.

Décisions clés:

- Le scénario est construit en mode boîte noire HTTP pour valider le comportement réel inter-domaines.
- L'environnement E2E reste en `in-memory` pour conserver la rapidité et la stabilité des exécutions.
- Le test complète les validations d'intégration module par module avec un flux métier bout-en-bout élargi.

## Etape réalisée: Presentation Tasks + tests d'intégration

Eléments implémentés:

- `TasksController` avec endpoints:
  - `POST /lists/:listId/tasks` (création d'une tâche)
  - `GET /lists/:listId/tasks` (lecture des tâches de la liste)
  - `PATCH /lists/:listId/tasks/:taskId/complete` (marquage terminée)
  - `PATCH /lists/:listId/tasks/:taskId/reopen` (réouverture)
  - `DELETE /lists/:listId/tasks/:taskId` (suppression)
- DTO Presentation:
  - `CreateTaskRequestDto`
  - `TaskSummaryResponseDto`
- `TasksJwtAuthGuard` pour valider le bearer access token (`HS256`, issuer, audience).
- `TasksExceptionFilter` pour mapper exceptions application/domaine Tasks vers des réponses HTTP cohérentes.
- Tests d'intégration `tasks.controller.integration.spec.ts` couvrant:
  - création,
  - validation payload (400),
  - authentification manquante (401),
  - isolation entre utilisateurs/listes,
  - completion/réouverture,
  - accès cross-user interdit (403),
  - suppression propriétaire (204),
  - suppression d'une tâche inexistante (404).

Décisions clés:

- Les routes Tasks sont imbriquées sous `lists/:listId` pour expliciter le contexte de liste au niveau API.
- La sécurité d'accès Tasks est portée par la couche Presentation (guard JWT), sans fuite de dépendances techniques vers le domaine.
- Le mapping d'erreurs est centralisé dans un filter dédié pour garantir un contrat API stable et maintenable.

## Etape réalisée: Infrastructure Tasks (Persistence + Services)

Eléments implémentés:

- Module dynamique `TasksPersistenceModule.register({ driver })`.
- Drivers supportés pour Tasks: `in-memory`, `typeorm`, `prisma`.
- Adapters repository Tasks pour chaque driver derrière le port unique `TasksRepositoryPort`.
- Mapper persistence <-> domaine Tasks + store in-memory.
- Adapters infrastructure de base: `TasksSystemClockAdapter`, `TasksUuidIdGeneratorAdapter`.
- Branchement complet dans `TasksModule` (use cases injectables via ports abstraits).
- Modèle Prisma `Task` ajouté au schema.

Décisions clés:

- La couche Application Tasks reste inchangée: seule l'infrastructure est branchée.
- Le choix du driver reste transparent pour les use cases grâce au port `TasksRepositoryPort`.
- Le pattern est aligné sur Auth, Users et Lists pour garder une architecture homogène et maintenable.

## Etape réalisée: Socle métier Tasks (Domain + Application)

Eléments implémentés:

- Domaine Tasks:
  - Entité `Task` (création, rehydratation, completion, réouverture).
  - Value Objects `TaskId`, `TaskListId`, `TaskOwnerUserId`, `TaskShortDescription`, `TaskLongDescription`, `TaskDueDate`.
  - Exceptions domaine dédiées (id/list/owner/description/date invalides).
  - Ports abstraits: `TasksRepositoryPort`, `TasksClockPort`, `TasksIdGeneratorPort`.
- Application Tasks:
  - Use cases `CreateTaskUseCase`, `GetListTasksUseCase`, `CompleteTaskUseCase`, `ReopenTaskUseCase`, `DeleteTaskUseCase`.
  - Commands/DTOs dédiés (`CreateTaskCommand`, `GetListTasksCommand`, `CompleteTaskCommand`, `ReopenTaskCommand`, `DeleteTaskCommand`, `TaskSummaryDto`).
  - Exceptions applicatives (`TaskNotFoundApplicationException`, `TaskAccessDeniedApplicationException`).
- Tests unitaires Tasks:
  - `create-task.use-case.spec.ts`
  - `get-list-tasks.use-case.spec.ts`
  - `complete-task.use-case.spec.ts`
  - `reopen-task.use-case.spec.ts`
  - `delete-task.use-case.spec.ts`

Décisions clés:

- Le périmètre reste strictement Domain + Application: aucune dépendance ORM/HTTP ajoutée à cette étape.
- L'isolation des données est portée dès l'application via le couple `ownerUserId` + `listId` dans les use cases critiques.
- Les règles d'état d'une tâche (terminée/non terminée) sont encapsulées dans l'entité pour préserver les invariants métier.

## Etape réalisée: Transition vers le domaine Tasks

Eléments implémentés:

- Création du module `TasksModule` sans logique métier.
- Branchement de `TasksModule` dans la composition racine (`AppModule`).
- Mise en place de l'arborescence hexagonale complète `src/domains/tasks`:
  - `domain` (entities, value-objects, services, ports, exceptions, factories)
  - `application` (dto, use-cases, services)
  - `infrastructure` (persistence/common/typeorm/prisma, services)
  - `presentation` (controllers, dto, guards, filters, mappers)

Décisions clés:

- Aucune logique métier Tasks n'est ajoutée à ce jalon pour isoler le changement structurel.
- Les comportements Auth, Users et Lists restent inchangés.
- Le squelette Tasks suit exactement les conventions DDD + Hexagonal déjà établies.

## Etape réalisée: E2E global inter-domaines avec Lists

Eléments implémentés:

- Le scénario E2E global couvre désormais Auth + Users + Lists.
- Extension de `test/app.e2e-spec.ts` avec un parcours complet Lists:
  - création de deux identités via Auth,
  - création de listes,
  - vérification de conflit de nom sur même propriétaire (409),
  - vérification d'isolation des listes entre utilisateurs,
  - vérification de suppression cross-user interdite (403),
  - suppression propriétaire (204) et vérification post-suppression.

Décisions clés:

- Le scénario est construit en mode boîte noire HTTP pour valider le comportement réel inter-domaines.
- L'environnement E2E reste en `in-memory` pour conserver la rapidité et la stabilité des exécutions.
- Le test complète les validations d'intégration module par module en apportant une preuve bout-en-bout.

## Etape réalisée: Presentation Lists + tests d'intégration

Eléments implémentés:

- `ListsController` avec endpoints:
  - `POST /lists` (création d'une liste)
  - `GET /lists` (lecture des listes de l'utilisateur authentifié)
  - `DELETE /lists/:listId` (suppression d'une liste appartenant à l'utilisateur)
- DTO Presentation:
  - `CreateListRequestDto`
  - `ListSummaryResponseDto`
- `ListsJwtAuthGuard` pour valider le bearer access token (`HS256`, issuer, audience).
- `ListsExceptionFilter` pour mapper exceptions application/domaine Lists vers des réponses HTTP cohérentes.
- Tests d'intégration `lists.controller.integration.spec.ts` couvrant:
  - création,
  - conflit de nom sur même propriétaire (409),
  - isolation entre utilisateurs,
  - validation payload (400),
  - authentification manquante (401),
  - suppression propriétaire (204),
  - suppression cross-user interdite (403),
  - suppression d'une liste inexistante (404).

Décisions clés:

- La sécurité d'accès Lists est portée par la couche Presentation (guard JWT), sans fuite de dépendances techniques vers le domaine.
- Les use cases Lists restent découplés de HTTP: le controller orchestre via commands applicatifs uniquement.
- Le mapping d'erreurs est centralisé dans un filter dédié pour garantir un contrat API stable et maintenable.

## Etape réalisée: Infrastructure Lists (Persistence + Services)

Eléments implémentés:

- Module dynamique `ListsPersistenceModule.register({ driver })`.
- Drivers supportés pour Lists: `in-memory`, `typeorm`, `prisma`.
- Adapters repository Lists pour chaque driver derrière le port unique `ListsRepositoryPort`.
- Mapper persistence <-> domaine Lists + store in-memory.
- Adapters infrastructure de base: `ListsSystemClockAdapter`, `ListsUuidIdGeneratorAdapter`.
- Branchement complet dans `ListsModule` (use cases injectables via ports abstraits).
- Modèle Prisma `TaskList` ajouté au schema.

Décisions clés:

- La couche Application Lists reste inchangée: seule l'infrastructure est branchée.
- Le choix du driver reste transparent pour les use cases grâce au port `ListsRepositoryPort`.
- Le pattern est aligné sur Auth et Users pour garder une architecture homogène et maintenable.

## Etape réalisée: Socle métier Lists (Domain + Application)

Eléments implémentés:

- Domaine Lists:
  - Entité `TaskList` (création, rehydratation, renommage).
  - Value Objects `ListId`, `ListName`, `OwnerUserId`.
  - Exceptions domaine de validation (`invalid list name/id/owner user id`).
  - Ports abstraits: `ListsRepositoryPort`, `ListsClockPort`, `ListsIdGeneratorPort`.
- Application Lists:
  - Use cases `CreateListUseCase`, `GetUserListsUseCase`, `DeleteListUseCase`.
  - Commands/DTOs dédiés (`CreateListCommand`, `GetUserListsCommand`, `DeleteListCommand`, `ListSummaryDto`).
  - Exceptions applicatives (`ListNameAlreadyExistsApplicationException`, `ListNotFoundApplicationException`, `ListAccessDeniedApplicationException`).
- Tests unitaires Lists:
  - `create-list.use-case.spec.ts`
  - `get-user-lists.use-case.spec.ts`
  - `delete-list.use-case.spec.ts`

Décisions clés:

- Le périmètre reste strictement Domain + Application: aucune dépendance ORM/HTTP ajoutée à cette étape.
- Les règles critiques sont portées par le domaine (invariants) et l'application (orchestration/autorisations métier).
- Les tests unitaires valident les scénarios principaux avant l'introduction des adapters de persistence.

## Etape réalisée: Transition vers le domaine Lists

Eléments implémentés:

- Création du module `ListsModule` sans logique métier.
- Branchement de `ListsModule` dans la composition racine (`AppModule`).
- Mise en place de l'arborescence hexagonale complète `src/domains/lists`:
  - `domain` (entities, value-objects, services, ports, exceptions, factories)
  - `application` (dto, use-cases, services)
  - `infrastructure` (persistence/common/typeorm/prisma, services)
  - `presentation` (controllers, dto, guards, filters, mappers)

Décisions clés:

- Aucune logique métier Lists n'est ajoutée à ce jalon pour isoler le changement structurel.
- Les comportements Auth/Users restent inchangés.
- Le squelette Lists suit exactement les conventions DDD + Hexagonal établies sur Auth et Users.

## Etape réalisée: Stabilisation E2E croisée Auth + Users

Eléments implémentés:

- Extension du scénario E2E principal vers un flux inter-domaines complet:
  - `register` Auth,
  - lecture profil `GET /users/me`,
  - lecture ciblée `GET /users/:id` pour le propriétaire,
  - vérification d'interdiction cross-user (`403`).
- Conservation des scénarios E2E Auth critiques déjà en place (validation register, refresh, logout).

Décisions clés:

- Les tests E2E valident désormais explicitement la cohérence d'identité entre Auth et Users.
- L'isolation des données utilisateur est vérifiée dans un parcours réel bout en bout.
- Le flux reste déterministe avec `PERSISTENCE_DRIVER=in-memory` pour une exécution rapide et stable.

## Etape réalisée: Autorisation Users par identité authentifiée

Eléments implémentés:

- `UsersJwtAuthGuard` pour valider le bearer access token (`HS256`, issuer, audience).
- Activation du guard sur `UsersController` et documentation Swagger bearer.
- Endpoint `GET /users/me` pour récupérer le profil de l'utilisateur authentifié.
- Contrôle d'appartenance stricte sur `GET /users/:id` et `PATCH /users/:id`.
- Payload `POST /users` aligné sur l'identité authentifiée (email + userId issus du token).
- Alignement Auth -> Users provisioning pour partager le même `userId` entre contextes.
- Tests d'intégration Users étendus: 401 sans token, 403 accès cross-user, lecture/update own profile.

Décisions clés:

- L'isolation par identité est appliquée dans la couche Presentation via un guard dédié.
- Le domaine/application restent inchangés dans leurs responsabilités métier.
- L'alignement `userId` Auth/Users garantit la cohérence de l'identité inter-domaines.

## Etape réalisée: Mise à jour du profil Users (rename)

Eléments implémentés:

- Nouveau use case `UpdateUserProfileUseCase`.
- Nouveau command applicatif `UpdateUserProfileCommand`.
- Endpoint `PATCH /users/:id` dans `UsersController`.
- DTO de payload `UpdateUserProfileRequestDto` avec validation + Swagger.
- Test unitaire du use case de mise à jour (`update-user-profile.use-case.spec.ts`).
- Extension des tests d'intégration Users avec scénarios update:
  - succès (200),
  - utilisateur inconnu (404),
  - payload invalide (400).

Décisions clés:

- Le renommage reste encapsulé dans le domaine (`User.updateName`) pour préserver les invariants.
- Le contrôleur ne contient aucune logique métier: orchestration via use case uniquement.
- Les erreurs applicatives/domaines réutilisent le filtre Users déjà centralisé.

## Etape réalisée: Intégration Auth <-> Users (register)

Eléments implémentés:

- Ajout d'un port Auth dédié `UserProfileProvisioningPort` pour orchestrer la création du profil Users.
- Adapter d'infrastructure Auth vers Users (`UsersProfileProvisioningAdapter`) branché via DI.
- Le `RegisterUseCase` Auth provisionne désormais le profil Users pendant l'inscription.
- Enrichissement du payload `POST /auth/register` avec `firstName` et `lastName`.
- Validation et Swagger alignés sur le nouveau contrat d'inscription.
- Mapping d'erreurs dédié côté Auth (`InvalidUserProfileApplicationException`).

Tests alignés:

- Tests d'intégration Auth mis à jour pour le nouveau payload register.
- Test E2E Auth mis à jour pour couvrir le nouveau contrat.

Décisions clés:

- L'intégration inter-domaines passe par un port abstrait côté Auth pour préserver l'architecture hexagonale.
- Auth ne dépend pas des détails techniques Users: seul l'adapter connaît le use case concret.
- Le contrat register est aligné avec le besoin fonctionnel (création immédiate du profil utilisateur).

## Etape réalisée: Presentation Users + tests d'intégration

Eléments implémentés:

- Controller HTTP `UsersController` avec endpoints:
  - `POST /users` (création profil)
  - `GET /users/:id` (lecture profil)
- DTO de requête/réponse Users avec validation et schéma Swagger.
- `UsersExceptionFilter` pour mapper exceptions applicatives/domaines en HTTP cohérent.
- Tests d'intégration `users.controller.integration.spec.ts` couvrant:
  - création et lecture profil,
  - email en doublon (409),
  - utilisateur inconnu (404),
  - payload invalide (400).

Décisions clés:

- La présentation Users reste découplée des adapters concrets via use cases.
- La gestion des erreurs Users suit la même stratégie centralisée que Auth.
- Les tests d'intégration valident le contrat HTTP réel sans dépendre d'une base externe (driver in-memory).

## Etape réalisée: Infrastructure Users (Persistence + Services)

Eléments implémentés:

- Module dynamique `UsersPersistenceModule.register({ driver })`.
- Drivers supportés pour Users: `in-memory`, `typeorm`, `prisma`.
- Adapters repository Users pour chaque driver derrière le port unique `UsersRepositoryPort`.
- Mapper persistence <-> domaine Users + store in-memory.
- Adapters infrastructure de base: `UsersSystemClockAdapter`, `UsersUuidIdGeneratorAdapter`.
- Branchement complet dans `UsersModule` (use cases injectables via ports abstraits).
- Modèle Prisma `UserProfile` ajouté au schema.

Décisions clés:

- La couche Application Users reste inchangée: seule l'infrastructure est branchée.
- Le choix du driver reste transparent pour les use cases grâce au port `UsersRepositoryPort`.
- Le pattern est volontairement aligné sur Auth pour garder une architecture homogène et maintenable.

## Etape réalisée: Socle métier Users (Domain + Application)

Eléments implémentés:

- Domaine Users:
  - Entité `User` (création, rehydratation, mise à jour du nom).
  - Value Objects `UserId`, `UserEmail`, `FirstName`, `LastName`.
  - Exception domaine dédiée pour validation des noms.
  - Ports abstraits: `UsersRepositoryPort`, `UsersClockPort`, `UsersIdGeneratorPort`.
- Application Users:
  - Use cases `CreateUserUseCase` et `GetUserProfileUseCase`.
  - Commands/DTOs dédiés (`CreateUserCommand`, `GetUserProfileCommand`, `UserProfileDto`).
  - Exceptions applicatives (`UserAlreadyExistsApplicationException`, `UserNotFoundApplicationException`).
- Tests unitaires Users:
  - `create-user.use-case.spec.ts`
  - `get-user-profile.use-case.spec.ts`

Décisions clés:

- Le périmètre reste strictement Domain + Application: aucune dépendance ORM/HTTP ajoutée à cette étape.
- Les use cases dépendent uniquement de ports abstraits, pour préparer des adapters interchangeables ensuite.
- Le modèle Users est découplé d'Auth pour conserver des bounded contexts clairs.

## Etape réalisée: Transition vers le domaine Users

Eléments implémentés:

- Création du module `UsersModule` sans logique métier.
- Branchement de `UsersModule` dans la composition racine (`AppModule`).
- Mise en place de l'arborescence hexagonale complète `src/domains/users`:
  - `domain` (entities, value-objects, services, ports, exceptions, factories)
  - `application` (dto, use-cases, services)
  - `infrastructure` (persistence/common/typeorm/prisma, services)
  - `presentation` (controllers, dto, guards, filters, mappers)

Décisions clés:

- Aucun code métier Users n'est ajouté à cette étape pour isoler le changement structurel.
- Le module Auth reste inchangé, ce qui sécurise la continuité fonctionnelle.
- Le squelette Users suit exactement les conventions DDD + Hexagonal déjà validées sur Auth.

## Etape réalisée: Validation stricte des variables d'environnement

Eléments implémentés:

- Ajout de `ConfigModule` global avec schéma de validation Joi.
- Validation forte de `NODE_ENV`, `PORT`, `PERSISTENCE_DRIVER`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
- Validation conditionnelle de `DATABASE_URL` (obligatoire en `typeorm`/`prisma`).
- Suppression des fallbacks JWT implicites dans les adapters de signature et de vérification.
- Mise à jour de `.env.example` avec contraintes explicites sur les secrets.

Décisions clés:

- L'application échoue au démarrage si une variable critique est absente ou invalide (fail fast).
- Les secrets JWT ne disposent plus de valeur par défaut, évitant les démarrages non sûrs.
- La règle conditionnelle `DATABASE_URL` réduit les erreurs de config selon le driver choisi.

## Etape réalisée: Revue sécurité finale Auth

Durcissements implémentés:

- Ajout de `helmet` pour renforcer les headers HTTP de sécurité.
- Désactivation de `x-powered-by` pour réduire la divulgation d'information technique.
- Exposition Swagger contrôlée par variable `SWAGGER_ENABLED` (désactivable en production).
- Renforcement JWT: ajout/validation stricte de `issuer` et `audience`.
- Vérification du refresh token limitée à l'algorithme attendu (`HS256`).

Variables d'environnement de sécurité ajoutées:

- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `SWAGGER_ENABLED`

Décisions clés:

- Les frontières de confiance des tokens sont explicites (secret + issuer + audience + algorithme).
- La documentation API n'est plus exposée implicitement, ce qui réduit la surface d'attaque en production.
- Les headers de sécurité sont appliqués globalement sans impacter l'architecture hexagonale.

## Etape réalisée: Socle Auth Domain + Application

Eléments implémentés:

- Value Objects: Email, Password, UserId.
- Entity: AuthUser (construction, rehydratation, rotation refresh token).
- Ports abstraits: UserRepositoryPort, PasswordHasherPort, TokenIssuerPort, ClockPort, IdGeneratorPort.
- Exceptions Domain et Application dédiées.
- Use Cases injectables: RegisterUseCase, LoginUseCase.

Décisions clés:

- Les règles de format email et robustesse de mot de passe sont dans le domaine pour garantir les invariants partout.
- Les use cases dépendent uniquement des ports abstraits et ne connaissent aucune implémentation technique.
- Le hash du refresh token est prévu dès les use cases pour éviter tout stockage en clair.

## Etape réalisée: Branchement Infrastructure initial Auth

Eléments implémentés:

- Adapter hash: bcrypt.
- Adapter émission tokens: JWT (access 15m, refresh 7d).
- Adapter horloge: system clock.
- Adapter génération d'identifiants: UUID.
- Adapter repository temporaire: in-memory.
- Module Auth Nest pour relier les ports abstraits vers les adapters.

Décisions clés:

- Le repository in-memory est volontairement transitoire pour permettre d'avancer sans ORM à ce stade.
- Les use cases restent inchangés: seul le wiring DI a été ajouté.
- Les secrets JWT sont lus via variables d'environnement validées strictement au démarrage.

## Etape réalisée: Presentation Auth + Cookies HttpOnly

Eléments implémentés:

- Controller HTTP Auth: register, login, refresh, logout.
- DTO d'entrée avec class-validator.
- ValidationPipe globale (whitelist, transform, forbid unknown/non-whitelisted).
- cookie-parser au bootstrap.
- Ecriture/rotation/clear du refresh token en cookie HttpOnly.
- Exception filter dédié Auth pour mapper les erreurs métier/applicatives en réponses HTTP cohérentes.

Décisions clés:

- Le refresh token n'est jamais renvoyé dans le body HTTP, uniquement en cookie HttpOnly.
- La rotation du refresh token est appliquée à chaque refresh.
- Le logout invalide le refresh token stocké et nettoie le cookie.

## Etape réalisée: Tests unitaires Auth

Fichiers de tests ajoutés:

- `login.use-case.spec.ts`
- `refresh-token.use-case.spec.ts`

Scénarios couverts:

- Login invalide (utilisateur inexistant).
- Login valide avec rotation du hash refresh token.
- Refresh invalide (token non vérifiable).
- Refresh valide avec rotation du hash refresh token.

Résultat d'exécution:

- 2 suites OK
- 4 tests OK

Pourquoi cette priorité:

- `LoginUseCase` et `RefreshTokenUseCase` concentrent les risques de sécurité les plus élevés.
- Ces tests valident le contrat des ports abstraits et l'absence de dépendance aux adapters concrets.

## Etape réalisée: Dynamic Module de persistence

Eléments implémentés:

- `PersistenceModule.register({ driver })` pour choisir l'adapter repository au démarrage.
- Drivers supportés: `in-memory`, `typeorm`, `prisma`.
- Résolution du driver via variable d'environnement `PERSISTENCE_DRIVER`.
- Trois adapters repository distincts, chacun branché via le même port `UserRepositoryPort`.

Décisions clés:

- Les adapters `TypeOrmUserRepositoryAdapter` et `PrismaUserRepositoryAdapter` sont déjà branchables par DI.
- Leur implémentation de stockage est transitoire pour cette étape et repose sur un store partagé en mémoire.
- Les use cases n'ont pas été modifiés: seule la composition root a évolué.

## Etape réalisée: Adapters ORM réels (Prisma + TypeORM)

Eléments implémentés:

- Schema Prisma pour `auth_users`.
- Service Prisma (`PrismaClient`) et adapter repository Prisma.
- Entité TypeORM `auth_users`, service `DataSource` et adapter repository TypeORM.
- Mapper persistence <-> domaine commun aux adapters.
- Fichier `.env.example` avec `PERSISTENCE_DRIVER`, `DATABASE_URL` et secrets JWT.

Configuration de driver:

- `PERSISTENCE_DRIVER=in-memory` (par défaut)
- `PERSISTENCE_DRIVER=prisma`
- `PERSISTENCE_DRIVER=typeorm`

Décisions clés:

- Les adapters ORM sont branchés derrière le même `UserRepositoryPort`.
- Le domaine et les use cases n'ont subi aucun changement pour passer de in-memory à ORM.
- Prisma Client est généré via `npx prisma generate`.

## Etape réalisée: Tests E2E Auth

Fichier de tests ajouté/mis à jour:

- `test/app.e2e-spec.ts`

Scénarios couverts:

- Rejet d'un payload invalide au register (validation globale).
- Flux complet Auth: register -> login -> refresh (rotation cookie) -> logout -> refresh rejeté.

Résultat d'exécution:

- 1 suite E2E OK
- 2 tests E2E OK

Décisions clés:

- Les tests E2E ciblent les contrats HTTP réels (status, body, cookies), pas les détails internes.
- Le driver de persistence est forcé en `in-memory` pour obtenir des tests rapides et déterministes.
- Le test de logout confirme l'invalidation serveur (refresh rejeté après logout) en plus du clear cookie côté client.

## Etape réalisée: Documentation Swagger Auth

Eléments implémentés:

- Intégration OpenAPI dans le bootstrap NestJS.
- Exposition de l'UI Swagger sur `/docs`.
- Documentation des endpoints Auth (`register`, `login`, `refresh`, `logout`).
- Documentation des schémas DTO et des réponses HTTP.
- Déclaration des mécanismes de sécurité: Bearer token (access token) et cookie `refreshToken`.

Dépendances ajoutées:

- `@nestjs/swagger`
- `swagger-ui-express`

Décisions clés:

- Swagger est limité au périmètre Auth de cette phase pour garder une documentation cohérente et focalisée.
- Les contrats HTTP documentés correspondent aux comportements réellement testés en intégration/E2E.
- Le cookie refresh est explicitement documenté pour clarifier le flux de sécurité côté client.

## Commandes utiles

```bash
npm install
npm run start:dev
npm run test
```

## Ce qui viendra plus tard

- Implémentation complète Users, Lists, Tasks.
- WebSocket temps réel avec rooms par liste.
- Dockerfiles + docker-compose.
- Pipeline CI (lint + tests).
