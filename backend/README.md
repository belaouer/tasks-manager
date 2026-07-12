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

1. Intégrer le flux Auth <-> Users (création du profil Users lors de l'inscription Auth).

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
