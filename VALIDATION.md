# Rapport de validation — Quivibe final

Date d’assemblage : 26 août 2026  
Archive source : `Quivibe-newApp-develop.zip`  
SHA-256 de la source : `909b56f89ddeef94d0bc62fe8017f042726f5f017f313d51202154702e4f3356`

## Résultats obtenus

- archive source testée : aucune entrée ZIP corrompue ;
- 97 fichiers TypeScript/TSX transpilés pour contrôle syntaxique : 0 échec ;
- 115 imports internes contrôlés : 0 import introuvable ;
- 42 entrées App Router contrôlées : 0 collision de route ;
- 38 destinations de navigation statiques contrôlées : 0 lien interne orphelin ;
- 16 appels API internes rapprochés de leurs route handlers ;
- manifestes `package.json` cohérents avec les importers du `pnpm-lock.yaml` ;
- 13 modèles Prisma rapprochés de la baseline PostgreSQL : tables et colonnes cohérentes ;
- présence du parcours de réservation client et du traitement propriétaire ;
- recherche de secrets de production évidents : aucun secret détecté dans les fichiers versionnés ;
- comparaison avec la source : 28 fichiers ajoutés, 40 modifiés et 7 retirés.

## Limite du contrôle

L’environnement d’assemblage ne disposait pas d’un accès au registre npm. Il n’a donc pas été possible d’exécuter `pnpm install`, `prisma generate`, le contrôle TypeScript complet dépendant des paquets installés, ESLint ou `next build`.

Le verrou pnpm a néanmoins été rendu cohérent avec les deux manifestes. Le contrôle complet doit être exécuté dans un environnement connecté :

```bash
corepack enable
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env
pnpm --filter web prisma generate
pnpm --filter web prisma validate
pnpm type-check
pnpm lint
pnpm build
```

## Base de données

La migration `20260826010000_postgresql_baseline` est destinée à une **base PostgreSQL vide**. Pour une base déjà alimentée, préparer une migration de reprise des données au lieu d’appliquer directement cette baseline.
