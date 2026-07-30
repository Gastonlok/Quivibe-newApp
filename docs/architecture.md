# Architecture Technique — Quivibe

**Version :** 1.0
**Statut :** Draft — Sprint 0
**Dernière mise à jour :** 30 juillet 2026
**Document de référence :** `docs/prd.md`

---

## 1. Vue d'ensemble

Quivibe est construit comme une application web full-stack unique (Next.js), organisée dans un monorepo léger. En phase MVP, on privilégie une architecture simple, monolithique et facile à maintenir par une petite équipe, tout en gardant la porte ouverte à une évolution vers plusieurs applications (mobile, back-office séparé) sans réécriture majeure.

### Principes directeurs
- **Simplicité avant tout** en phase MVP : un seul déploiement, une seule base de données.
- **Organisation par feature** plutôt que par type technique, pour limiter le couplage.
- **Server-first** : on exploite les Server Components et Server Actions de Next.js pour réduire le JavaScript envoyé au client (important vu les contraintes de connexion mobile à Kinshasa).
- **Coûts maîtrisés** : choix d'outils avec un palier gratuit ou low-cost généreux (Cloudinary, OpenStreetMap, hébergement PaaS).
- **Évolutivité progressive** : rien n'empêche d'extraire des services séparés plus tard si la charge l'exige.

---

## 2. Schéma d'architecture globale

```
                        ┌─────────────────────────────┐
                        │        Utilisateurs          │
                        │  (navigateur mobile / desktop)│
                        └──────────────┬───────────────┘
                                       │ HTTPS
                                       ▼
                        ┌─────────────────────────────┐
                        │     Next.js 15 (apps/web)    │
                        │  App Router · Server Actions  │
                        │  Server Components · API Rte  │
                        └───────┬───────────┬──────────┘
                                │           │
                     Prisma ORM │           │  SDK / API
                                ▼           ▼
                    ┌────────────────┐  ┌────────────────────┐
                    │  PostgreSQL    │  │  Services externes  │
                    │  (données app) │  │  Cloudinary (images) │
                    └────────────────┘  │  OpenStreetMap/Tiles │
                                        │  Auth.js providers   │
                                        │  Email (transactionnel)│
                                        └────────────────────┘
```

Il n'y a pas de backend séparé en phase MVP : Next.js sert à la fois le rendu des pages et la logique métier (via Server Actions et Route Handlers), ce qui simplifie le déploiement et la maintenance.

---

## 3. Structure du monorepo

```
quivibe/
├── apps/
│   └── web/                 # Application Next.js principale
├── docs/                    # Documentation produit et technique
├── .github/
│   └── workflows/           # CI (lint, build, tests)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

`packages/ui`, `packages/types` et `packages/config` seront introduits uniquement lorsqu'une deuxième application (mobile, back-office) partagera du code avec `apps/web`.

### Structure de `apps/web`

```
apps/web/
├── app/                     # Routes (App Router)
│   ├── (public)/            # Pages publiques : découverte, fiche établissement, événements
│   ├── (auth)/               # Connexion, inscription
│   ├── (dashboard)/          # Espace établissement
│   ├── (admin)/               # Back-office modération
│   └── api/                  # Route Handlers (webhooks, intégrations externes)
│
├── features/                # Logique métier organisée par domaine
│   ├── auth/
│   ├── places/               # Établissements
│   ├── reviews/              # Avis
│   ├── favorites/
│   ├── events/
│   ├── search/
│   ├── users/
│   └── admin/
│
├── components/               # Composants UI partagés (non liés à une feature)
├── actions/                  # Server Actions transverses
├── hooks/                    # Hooks React partagés
├── services/                 # Intégrations externes (Cloudinary, email, maps)
├── lib/                      # Utilitaires, clients (prisma, auth)
├── prisma/                   # Schéma et migrations
├── public/
├── styles/
├── types/
├── utils/
├── middleware.ts             # Protection des routes (auth, rôles)
└── next.config.ts
```

Chaque dossier dans `features/` contient typiquement : ses propres composants, ses Server Actions, ses schémas de validation Zod, et ses hooks TanStack Query si nécessaire. Cela garde la logique d'un domaine encapsulée et facile à faire évoluer indépendamment.

---

## 4. Frontend

- **Framework** : Next.js 15 (App Router), React Server Components par défaut, Client Components uniquement là où l'interactivité l'exige (formulaires, carte, filtres dynamiques).
- **UI Kit** : shadcn/ui, construit sur Radix UI + Tailwind CSS, pour une base de composants accessibles et personnalisables sans dépendance lourde.
- **Style** : Tailwind CSS, avec un fichier de design tokens centralisé (couleurs, typographie, espacements) pour garder une identité visuelle cohérente.
- **Formulaires** : React Hook Form + résolveur Zod pour la validation, cohérente entre client et serveur.
- **Données côté client** : TanStack Query pour le cache, le revalidate et la gestion des états de chargement/erreur sur les données qui nécessitent une interactivité côté client (ex. favoris, filtres dynamiques).
- **Carte interactive** : Leaflet + tuiles OpenStreetMap, chargé en Client Component avec lazy loading pour ne pas alourdir le poids initial des pages.
- **Performance** : images optimisées via `next/image` + Cloudinary, pagination/infinite scroll sur les listes d'établissements, code-splitting automatique par route.

---

## 5. Backend / logique métier

En MVP, il n'y a pas d'API REST exposée publiquement : la logique métier vit dans des **Server Actions** (mutations : créer une fiche, publier un avis, etc.) et des **Route Handlers** (`app/api/...`) pour :
- les webhooks (ex. Cloudinary, provider d'auth),
- d'éventuels appels externes qui nécessitent un point d'entrée HTTP classique.

Une API REST plus formelle (`docs/api.md`) pourra être introduite si une application mobile ou des partenaires tiers ont besoin d'un accès programmatique — pas nécessaire au lancement du MVP.

### Couches applicatives (par feature)
1. **Validation** — schémas Zod partagés entre formulaire client et Server Action.
2. **Server Action** — point d'entrée de la mutation, vérifie l'authentification/autorisation.
3. **Service** — logique métier (ex. calcul de note moyenne, règles de modération).
4. **Accès aux données** — Prisma Client, requêtes typées.

Cette séparation évite d'avoir des Server Actions qui mélangent validation, logique métier et accès base de données dans un seul bloc difficile à tester.

---

## 6. Base de données

- **SGBD** : PostgreSQL, hébergé chez un fournisseur managé (ex. Neon, Supabase ou équivalent — à trancher en fonction du budget et de la latence pour l'Afrique centrale).
- **ORM** : Prisma, avec migrations versionnées dans `prisma/migrations`.
- Le détail du schéma (entités, relations) sera documenté dans `docs/database.md`.
- Entités principales pressenties : `User`, `Place` (établissement), `Category`, `Review`, `Favorite`, `Event`, `Media`.

---

## 7. Authentification et autorisation

- **Auth.js** (NextAuth) pour gérer l'authentification par email/mot de passe et/ou fournisseurs sociaux (Google, Facebook — à confirmer selon l'usage réel des utilisateurs cibles).
- Trois rôles principaux : `user`, `owner` (établissement), `admin`.
- Le contrôle d'accès aux routes (`(dashboard)`, `(admin)`) est géré via `middleware.ts`, qui vérifie le rôle avant d'autoriser l'accès.
- Les Server Actions sensibles revérifient systématiquement les droits côté serveur (ne jamais faire confiance uniquement au routage côté client).

---

## 8. Stockage et médias

- **Cloudinary** pour l'upload, le redimensionnement et l'optimisation des images (photos d'établissements, événements, avatars).
- Les uploads passent par un flux sécurisé : signature générée côté serveur, upload direct depuis le client vers Cloudinary (évite de faire transiter les fichiers par le serveur Next.js).

---

## 9. Cartographie

- **Leaflet** comme librairie de carte côté client.
- **OpenStreetMap** comme fournisseur de tuiles, pour éviter les coûts et quotas de Google Maps en phase MVP.
- Les coordonnées (latitude/longitude) de chaque établissement sont stockées en base et utilisées pour l'affichage sur la carte et les filtres géographiques (par quartier).

---

## 10. Déploiement et infrastructure

- **Hébergement de l'application** : plateforme PaaS compatible Next.js (ex. Vercel ou équivalent), pour bénéficier du déploiement continu et des Server Components sans gestion d'infrastructure manuelle.
- **Base de données** : instance PostgreSQL managée, séparée de l'hébergeur applicatif pour rester flexible.
- **CI/CD** : GitHub Actions (`ci.yml`, `lint.yml`) pour lancer lint, type-check et build à chaque pull request avant merge sur `develop`/`main`.
- **Environnements** : `production` (branche `main`), `preview` (branches de feature, déploiements automatiques par PR), et un environnement local de développement documenté dans le README.

Le détail opérationnel (variables d'environnement, procédure de mise en production) sera précisé dans `docs/deployment.md`.

---

## 11. Sécurité

- Validation systématique des entrées utilisateur (Zod) côté serveur, jamais seulement côté client.
- Autorisations vérifiées à chaque Server Action sensible (pas seulement au niveau du routage).
- Modération manuelle des fiches établissement et des avis avant publication publique, pour limiter le contenu abusif ou frauduleux en phase MVP.
- Variables sensibles (clés API Cloudinary, secrets Auth.js, chaîne de connexion base de données) gérées via variables d'environnement, jamais commit dans le dépôt.
- Limitation du taux de requêtes sur les endpoints publics sensibles (ex. création d'avis) pour limiter le spam.

---

## 12. Performance

Contrainte clé : une partie significative des utilisateurs se connectera depuis des réseaux mobiles à bande passante limitée à Kinshasa. Cela guide plusieurs choix :
- Rendu côté serveur par défaut (moins de JavaScript envoyé au client).
- Images servies via Cloudinary avec formats modernes (WebP/AVIF) et tailles adaptées à l'écran.
- Chargement différé (lazy loading) de la carte interactive et des composants lourds non essentiels au premier rendu.
- Pagination ou scroll infini plutôt que de charger toutes les fiches établissement en une fois.

---

## 13. Observabilité

En phase MVP, on reste volontairement léger :
- Logs applicatifs basiques (erreurs serveur) via les outils natifs de la plateforme d'hébergement.
- Un outil de monitoring d'erreurs (ex. Sentry ou équivalent) pourra être ajouté dès que le trafic le justifie.
- Un tableau de bord admin simple (cf. PRD) donnera une première visibilité sur l'usage (nombre d'utilisateurs, établissements, avis).

---

## 14. Évolutions futures (hors MVP)

- Extraction d'une API REST/GraphQL formelle si une application mobile native est développée.
- Introduction de `packages/ui`, `packages/types`, `packages/config` dans le monorepo à ce moment-là.
- Recommandations personnalisées (nécessiterait probablement un service de traitement de données séparé).
- Système de paiement/billetterie, avec les implications de sécurité et de conformité associées (à traiter comme un chantier à part entière, pas une simple extension).

---

## 15. Documents liés

- `docs/prd.md` — Vision produit et fonctionnalités.
- `docs/database.md` — Schéma de données détaillé (à rédiger).
- `docs/api.md` — Contrats d'API si une API formelle est introduite (à rédiger si nécessaire).
- `docs/deployment.md` — Procédure de déploiement détaillée (à rédiger).
