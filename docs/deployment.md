# Déploiement — Quivibe

**Version :** 1.0
**Statut :** Draft — Sprint 0
**Dernière mise à jour :** 30 juillet 2026
**Documents liés :** `docs/architecture.md`, `README.md`

---

## 1. Vue d'ensemble

Ce document décrit la procédure de déploiement de Quivibe en phase MVP : environnements, variables d'environnement, pipeline CI/CD, et étapes de mise en production. L'objectif en MVP est un déploiement simple, automatisé, sans gestion d'infrastructure manuelle.

---

## 2. Environnements

| Environnement | Branche | URL | Objectif |
|---|---|---|---|
| Développement local | — | `localhost:3000` | Développement quotidien |
| Preview | `feature/*` (via PR) | URL générée automatiquement par pull request | Revue de chaque feature avant merge |
| Staging | `develop` | `staging.quivibe.app` (à confirmer) | Validation avant mise en production |
| Production | `main` | `quivibe.app` (à confirmer) | Environnement public |

Chaque environnement dispose de sa propre base de données PostgreSQL, pour ne jamais faire de test sur les données de production.

---

## 3. Variables d'environnement

Fichier de référence : `apps/web/.env.example`, à copier vers `.env` en local et à configurer dans les secrets de la plateforme d'hébergement pour staging/production.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `NEXTAUTH_URL` | URL publique de l'application (requis par Auth.js) |
| `NEXTAUTH_SECRET` | Secret de signature des sessions |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Identifiants du fournisseur OAuth Google (si activé) |
| `CLOUDINARY_CLOUD_NAME` | Nom du compte Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary |
| `NEXT_PUBLIC_MAP_TILE_URL` | URL des tuiles OpenStreetMap utilisées par Leaflet |

Aucun secret ne doit être committé dans le dépôt. Le fichier `.env` est listé dans `.gitignore`.

---

## 4. Pipeline CI/CD

Défini dans `.github/workflows/` :

### `ci.yml`
Déclenché sur chaque pull request vers `develop` ou `main` :
1. Installation des dépendances (`pnpm install`).
2. Vérification des types (`tsc --noEmit`).
3. Lint (`pnpm lint`).
4. Build de l'application (`pnpm build`).

Une pull request ne peut être mergée que si ce pipeline passe.

### `lint.yml`
Peut être fusionné avec `ci.yml` ou conservé séparé selon la granularité souhaitée des checks GitHub.

### Déploiement automatique
- Toute pull request génère un déploiement preview (si la plateforme d'hébergement le permet nativement, ex. Vercel).
- Un merge sur `develop` déclenche un déploiement automatique sur staging.
- Un merge sur `main` déclenche un déploiement automatique sur production.

---

## 5. Migrations de base de données

Les migrations Prisma sont versionnées dans `apps/web/prisma/migrations`.

Procédure lors d'un déploiement :
1. Les migrations sont appliquées automatiquement au déploiement via `prisma migrate deploy` (jamais `migrate dev` en production).
2. Toute migration destructive (suppression de colonne/table) doit être revue explicitly en pull request et accompagnée d'un plan de rollback.
3. Aucune migration n'est appliquée manuellement en production hors de ce pipeline, pour garder une trace complète et reproductible.

---

## 6. Procédure de mise en production

1. S'assurer que `develop` est stable (staging validé fonctionnellement).
2. Ouvrir une pull request `develop` → `main`.
3. Vérifier que le pipeline CI passe.
4. Merger la pull request.
5. Le déploiement en production se déclenche automatiquement.
6. Vérifier manuellement les parcours critiques post-déploiement (inscription, recherche, affichage d'une fiche établissement).
7. En cas d'anomalie bloquante, revert immédiat du merge et nouveau déploiement.

---

## 7. Rollback

- Le rollback consiste à redéployer la version précédente stable (revert du commit sur `main` puis redéploiement automatique via le pipeline).
- Les migrations de base de données destructives doivent systématiquement prévoir une procédure de rollback documentée dans la pull request qui les introduit, car un rollback de code ne rétablit pas automatiquement un schéma de base de données antérieur.

---

## 8. Sauvegardes

- Sauvegardes automatiques quotidiennes de la base de données de production, via les outils natifs du fournisseur PostgreSQL managé choisi.
- Rétention minimale recommandée : 7 jours en MVP, à réévaluer selon la criticité des données une fois en production réelle.

---

## 9. Points à trancher avant le premier déploiement

- Choix définitif du fournisseur d'hébergement applicatif et de base de données (impact coût et latence pour les utilisateurs en RDC).
- Nom de domaine définitif (`quivibe.app` à confirmer/réserver).
- Mise en place d'un outil de monitoring d'erreurs (ex. Sentry) avant l'ouverture au public, même en version légère.

---

## 10. Documents liés

- `docs/architecture.md` — Architecture technique globale.
- `README.md` — Instructions d'installation locale.
