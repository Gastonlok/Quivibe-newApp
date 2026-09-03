# Installation de Quivibe sous Windows

## 1. Prérequis

- Node.js 22 ;
- Docker Desktop pour la base PostgreSQL locale ;
- PowerShell ouvert dans le dossier du projet.

## 2. Démarrer PostgreSQL

```powershell
docker compose up -d postgres
```

## 3. Préparer l’application

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item apps\web\.env.example apps\web\.env
pnpm --filter web prisma generate
pnpm --filter web prisma migrate deploy
```

Le fichier `apps\web\.env` contient déjà l’URL correspondant au conteneur local. Remplacez impérativement `AUTH_SECRET` par une longue valeur aléatoire.

## 4. Charger les données de démonstration, facultatif

```powershell
pnpm --filter web prisma:seed
```

Les identifiants de démonstration sont affichés dans le terminal. Ils ne doivent pas être utilisés en production.

## 5. Lancer Quivibe

```powershell
pnpm dev
```

Ouvrez ensuite l'URL exacte affichée par Next.js.
