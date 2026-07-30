<<<<<<< HEAD
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
| [`docs/roadmap.md`](./docs/roadmap.md) | Roadmap détaillée par sprint |
| [`docs/backlog.md`](./docs/backlog.md) | Backlog produit |

---

## 🧱 Stack technique

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **UI** : shadcn/ui + Tailwind CSS
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

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp apps/web/.env.example apps/web/.env
# renseigner DATABASE_URL, secrets Auth.js, clés Cloudinary...

# Appliquer les migrations Prisma
pnpm --filter web prisma migrate dev

# Lancer le serveur de développement
pnpm dev
```

L'application est ensuite disponible sur `http://localhost:3000`.

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

## 🗺️ Roadmap

Voir [`docs/roadmap.md`](./docs/roadmap.md) pour le détail sprint par sprint. Aperçu général dans [`docs/prd.md`](./docs/prd.md#12-roadmap-aperçu).

---

## 📜 Licence

À définir.
=======
# Quivibe-newApp
>>>>>>> 7739a9c458a60d7c990a985c706c3c5c86cff6a9
