# Quivibe

> La plateforme qui aide les Congolais à découvrir où sortir.

Quivibe (anciennement KinVibes) est un produit SaaS qui connecte les habitants de Kinshasa aux restaurants, bars, lounges et événements locaux — recommandations fiables, avis, carte interactive et découverte en temps réel.

---

## 📄 Documentation

Toute la documentation produit et technique vit dans `docs/` :

| Document | Contenu |
|---|---|
| [`docs/prd.md`](./docs/prd.md) | Vision produit, personas, fonctionnalités MVP, roadmap |
| [`docs/architecture.md`](./docs/architecture.md) | Architecture technique globale |
| [`docs/database.md`](./docs/database.md) | Schéma de base de données (Prisma) |
| [`docs/design-system.md`](./docs/design-system.md) | Couleurs, typographie, composants UI |
| [`docs/api.md`](./docs/api.md) | Contrat des Server Actions par domaine |
| [`docs/deployment.md`](./docs/deployment.md) | Procédure de déploiement |

---

## 🧱 Stack technique

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **UI** : Tailwind CSS, composants React et identité Manrope/orange Quivibe
- **Auth** : Auth.js
- **Validation** : Zod
- **Formulaires** : React Hook Form
- **Requêtes côté client** : TanStack Query
- **Upload d'images** : Cloudinary
- **Carte** : Leaflet + OpenStreetMap
- **Gestionnaire de paquets** : pnpm
- **Monorepo** : Turborepo
- **Qualité** : ESLint, Prettier, Husky, lint-staged

---

## 📂 Structure du dépôt

```
quivibe/
├── apps/
│   └── web/            # Application Next.js principale
├── docs/                # Documentation produit et technique
├── .github/
│   └── workflows/       # CI (lint, build)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Le détail de la structure de `apps/web` est décrit dans [`docs/architecture.md`](./docs/architecture.md).

---

## 🚀 Installation

### Prérequis
- Node.js 22 LTS
- pnpm
- Une instance PostgreSQL (locale ou hébergée)

### Étapes

```bash
# Cloner le dépôt
git clone https://github.com/<organisation>/quivibe.git
cd quivibe

# Facultatif : démarrer PostgreSQL localement avec Docker
# docker compose up -d postgres

# Activer pnpm avec Corepack
corepack enable

# Installer exactement les versions verrouillées
pnpm install --frozen-lockfile

# Configurer les variables d'environnement
cp apps/web/.env.example apps/web/.env
# renseigner DATABASE_URL, secrets Auth.js, clés Cloudinary...

# Générer le client Prisma et appliquer les migrations
pnpm --filter web prisma generate
pnpm --filter web prisma migrate deploy

# Facultatif : charger les données de démonstration
pnpm --filter web prisma:seed

# Lancer le serveur de développement
pnpm dev
```

L'application est ensuite disponible sur l'URL exacte affichée par Next.js. Une procédure PowerShell détaillée est fournie dans [`INSTALLATION-WINDOWS.md`](./INSTALLATION-WINDOWS.md).

## Tests

```bash
pnpm --filter web test
pnpm --filter web test:e2e
```

Les tests E2E nécessitent Chromium: `pnpm --filter web exec playwright install chromium`. Ils utilisent le compte administrateur de démonstration par défaut; en dehors de cet environnement, renseignez `E2E_ADMIN_EMAIL` et `E2E_ADMIN_PASSWORD`.

---

## 🍽️ Réservations

Le parcours de réservation comprend :

- les créneaux disponibles selon la capacité de l’établissement ;
- une demande ou une confirmation automatique ;
- l’espace client **Mes réservations** ;
- l’annulation des réservations futures ;
- l’espace propriétaire de confirmation, annulation, clôture et suivi des absences.

La migration PostgreSQL de référence se trouve dans `apps/web/prisma/migrations/20260826010000_postgresql_baseline/`.

---

## 🌿 Workflow Git

```
main
│
develop
│
├── feature/auth
├── feature/places
├── feature/events
├── feature/reviews
├── feature/map
├── feature/admin
└── feature/search
```

Aucune fonctionnalité ne part directement sur `main`. Chaque feature part de `develop` et y revient via pull request.

### Convention de commits

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: ajout de la page Discover
fix: correction du filtre des catégories
docs: ajout du PRD
style: amélioration de la navbar
refactor: simplification des Server Actions
test: ajout des tests des services Places
chore: mise à jour des dépendances
```

---

## 🤝 Contribuer

1. Créer une branche depuis `develop` : `feature/nom-de-la-fonctionnalite`.
2. Développer en suivant l'organisation par feature décrite dans `docs/architecture.md`.
3. S'assurer que le lint et le build passent (`pnpm lint`, `pnpm build`).
4. Ouvrir une pull request vers `develop` avec une description claire.

---

## 📜 Licence

À définir.
