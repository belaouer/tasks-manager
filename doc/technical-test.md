Test Technique · Lead Developer Application de gestion de Ce test porte sur le développement d'une application de gestion de tâches. Stack imposée : NestJS (back) · Vue.js / Nuxt
(front) · Tailwind CSS.
1. Contexte du projet
Tout comme Wunderlist ou Google Tasks, les listes de tâches font partie du quotidien des professionnels de tous
secteurs. L'application à développer se compose de deux sections principales :
• Page d'authentification
• Page principale
2. Page d'authentification
Page par défaut pour tout utilisateur non connecté. Il peut :
• Se connecter via son adresse email et son mot de passe
• Créer un compte en renseignant : nom, prénom, adresse email (+ confirmation), mot de passe (+ confirmation)
Exigences JWT
• Mettre en place un access token de courte durée (15 min) et un refresh token de longue durée (7 jours),
stocké en cookie httpOnly
• Le rafraîchissement du token doit être transparent pour l'utilisateur (intercepteur côté Nuxt) — aucune
déconnexion intempestive
• Retourner une erreur 401 claire sur token expiré et rediriger vers la page de connexion
• Un utilisateur ne peut accéder qu'à ses propres données (isolation stricte par userId côté service NestJS)
3. Page principale
La page principale regroupe trois zones distinctes :
• Left sidebar
• Main content
• Right sidebar
3.1 Left sidebar
Bandeau vertical rétractable. L'utilisateur doit pouvoir :
• Créer une nouvelle liste de tâches en lui donnant un nom unique
• Retrouver toutes ses listes de tâches
• Sélectionner une liste pour en afficher le contenu
• Supprimer une liste — une modale de confirmation avertit que toutes les tâches associées seront également
supprimées
3.2 Main content
Zone centrale affichant les tâches de la liste sélectionnée. Si aucune liste n'est sélectionnée, un message invite
l'utilisateur à en choisir une. La création d'une tâche nécessite les informations suivantes :
• Description courte (obligatoire)
• Description longue (optionnelle)
• Date d'échéance (obligatoire)
Chaque tâche peut être marquée comme terminée depuis cet écran. Les tâches terminées sont regroupées dans
une section « Mes tâches terminées », masquée par défaut et dépliable. Une tâche terminée peut être remise
dans la liste active.
Synchronisation temps réel — WebSocket
Toute modification sur une liste (création, mise à jour, suppression ou changement de statut d'une tâche) doit
être propagée en temps réel à tous les onglets et clients connectés sur cette même liste, sans rechargement
de page.
3.3 Right sidebar
Cette zone n'est visible que lorsque l'utilisateur clique sur une tâche. Elle affiche le détail complet de la tâche :
toutes les informations saisies à la création, la date de création, ainsi qu'un bouton de suppression. Une modale de
confirmation est affichée avant toute suppression.
4. Implémentation WebSocket
L'ensemble des interactions sur les listes de tâches doit fonctionner en temps réel via WebSocket. Voici les
exigences techniques attendues :
• Implémenter un Gateway WebSocket NestJS (@WebSocketGateway) avec Socket.io
• Sécuriser la connexion WebSocket : le JWT doit être vérifié au moment du handshake — aucune connexion
anonyme acceptée
• Organiser les connexions en rooms par liste (ex : list:{listId}) — les clients rejoignent et quittent les rooms
dynamiquement
• Émettre les événements suivants depuis le serveur : task:created, task:updated, task:deleted, task:completed
• Côté Nuxt/Vue : s'abonner aux événements et mettre à jour le store Pinia sans effectuer de re-fetch HTTP
• Gérer proprement la déconnexion et le nettoyage des rooms côté serveur
5. Architecture & Qualité de code
5.1 Structure back-end NestJS
• Organiser le projet en modules NestJS distincts par domaine : auth, users, lists, tasks
• Respecter une séparation claire Controller / Service / Repository
• Utiliser des DTOs avec validation (class-validator) sur tous les endpoints entrants
• Mettre en place une gestion centralisée des erreurs (filtres d'exception NestJS)
• Générer automatiquement la documentation de l'API via Swagger (@nestjs/swagger)
5.2 Structure front-end Nuxt / Vue.js
• Utiliser Nuxt avec Vue Composition API
• Appliquer Tailwind CSS pour tous les styles — le CSS custom doit rester exceptionnel et justifié
• Gérer l'état global avec Pinia (listes, tâches, utilisateur connecté)
• Découper l'interface en composants clairs et réutilisables (ex : TaskCard, TaskForm, Sidebar, TaskDetail)
• Protéger les routes authentifiées via un middleware Nuxt
5.3 Tests
Exigences minimales
• Tests unitaires sur au moins deux services NestJS critiques (ex : TaskService, AuthService)
• Un test e2e couvrant le flux complet : connexion → création d'une liste → création d'une tâche → suppression
• Les commandes npm run test et npm run test:e2e doivent être documentées et fonctionnelles
Indiquer dans le README ce qui aurait été testé en priorité avec plus de temps.
6. DevOps & Livraison
6.1 Conteneurisation
• Fournir un Dockerfile pour le backend NestJS (build multi-stage recommandé)
• Fournir un Dockerfile pour le frontend Nuxt
• Fournir un docker-compose.yml permettant de démarrer l'ensemble de l'application en une seule commande :
docker-compose up
• Placer les variables d'environnement dans un fichier .env.example — aucun secret ne doit être commité
Bonus — Pipeline CI GitHub Actions
• Workflow déclenché sur chaque push ou pull request : lint + tests unitaires
• Ajouter un badge de statut CI dans le README
Non obligatoire, mais fortement valorisé.
7. README & Décisions techniques
Le README est considéré comme un livrable à part entière et sera lu en priorité avant le code. Il doit contenir :
• Les instructions de lancement en trois commandes maximum (clone → configuration du .env → docker-compose
up)
• Une description de l'architecture globale : modules, couches, organisation des dossiers
• La justification des choix techniques : pourquoi Nuxt plutôt qu'une SPA Vue, pourquoi Pinia, comment est
structuré le WebSocket
• L'approche sécurité : gestion du JWT, stockage du refresh token, isolation des données par utilisateur
• Ce qui aurait été fait différemment avec plus de temps
• Ce qui aurait été testé en priorité avec plus de temps
8. Technologies & Consignes
Front-end
• Vue.js avec Nuxt (obligatoire)
• Tailwind CSS pour tous les styles (obligatoire)
• Pinia pour la gestion d'état
• socket.io-client pour la connexion WebSocket
Back-end
• NestJS (obligatoire)
• Authentification via JWT (access token + refresh token httpOnly)
• Base de données relationnelle : PostgreSQL (recommandé) ou MySQL
• ORM : TypeORM ou Prisma (au choix)
• WebSocket Gateway NestJS avec Socket.io (@nestjs/platform-socket.io)
• Documentation API via Swagger (@nestjs/swagger) — obligatoire
Versioning & Livraison
• Héberger le projet sur un repository GitHub (public ou accès partagé)
• Effectuer des commits réguliers sur des branches dédiées (feature/*, fix/*) — l'historique Git sera analysé
• La version évaluée sera celle du dernier commit disponible sur la branche principale
• Fournir un docker-compose.yml fonctionnel (obligatoire)
• Fournir un README complet avec justification des choix techniques (obligatoire)
Test Technique · Lead Developer · NestJS + Vue.js/Nuxt + Tailwind · 2026