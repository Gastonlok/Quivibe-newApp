# Finalisation fonctionnelle Quivibe

## Périmètre intégré

- identité visuelle modernisée : Manrope, palette vert profond, cartes et contrôles arrondis ;
- fiches d’établissements enrichies avec réservation ;
- disponibilité par créneaux de 30 minutes et contrôle de la capacité ;
- page client `Mes réservations` et annulation ;
- espace propriétaire avec réservations réelles et indicateurs Prisma ;
- événements publics et carte alimentés par PostgreSQL ;
- tableaux de bord administrateur et propriétaire alimentés par les données réelles ;
- création et modération des avis ;
- demandes de comptes propriétaires et traitement administratif ;
- pages institutionnelles et légales reliées depuis le pied de page ;
- configuration PostgreSQL, migration baseline et déploiement Vercel/pnpm.

La migration fournie est une **baseline destinée à une base PostgreSQL vide**. Une base déjà alimentée ne doit pas recevoir cette baseline sans plan de reprise de données.

## Mise en route

```bash
corepack enable
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env
pnpm --filter web prisma generate
pnpm --filter web prisma migrate deploy
pnpm --filter web prisma:seed   # facultatif
pnpm dev
```

## Contrôles effectués lors de l’assemblage

- intégrité de l’archive source ;
- absence de collision entre les routes App Router ;
- résolution de tous les imports internes ;
- transpilation syntaxique de tous les fichiers TypeScript/TSX ;
- cohérence structurelle du schéma Prisma et de la migration PostgreSQL ;
- détection des secrets dans les fichiers versionnés ;
- intégrité ZIP et empreinte SHA-256 du livrable final.

Le build Next.js complet doit être lancé après l’installation des dépendances, car l’environnement d’assemblage ne disposait pas d’un accès au registre npm.
