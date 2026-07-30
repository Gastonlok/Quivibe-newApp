# Schéma de Base de Données — Quivibe

**Version :** 1.0
**Statut :** Draft — Sprint 0
**Dernière mise à jour :** 30 juillet 2026
**Documents liés :** `docs/prd.md`, `docs/architecture.md`

---

## 1. Vue d'ensemble

Ce document décrit le modèle de données de Quivibe pour le MVP, implémenté avec **Prisma** sur **PostgreSQL**. Le schéma couvre : utilisateurs et rôles, établissements, catégories, avis, favoris, événements et médias.

Principes de conception :
- Un seul schéma partagé pour tous les types d'utilisateurs (`User`), différenciés par un champ `role`.
- Les relations many-to-many (favoris, catégories) passent par des tables de jointure explicites pour rester lisibles et faciles à étendre.
- Les champs de modération (`status`) sont présents dès le MVP sur `Place`, `Review` et `Event`.

---

## 2. Diagramme entité-relation (vue logique)

```
User ──< Place (owner)
User ──< Review
User ──< Favorite >── Place
User ──< Event (organizer)

Place ──< Review
Place ──< Favorite
Place ──< Event
Place >──< Category   (via PlaceCategory)
Place ──< Media

Event ──< Media
```

---

## 3. Schéma Prisma

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  OWNER
  ADMIN
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id            String     @id @default(cuid())
  name          String
  email         String     @unique
  passwordHash  String?
  role          Role       @default(USER)
  avatarUrl     String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  places        Place[]    @relation("PlaceOwner")
  reviews       Review[]
  favorites     Favorite[]
  events        Event[]    @relation("EventOrganizer")

  @@map("users")
}

model Place {
  id            String            @id @default(cuid())
  name          String
  slug          String            @unique
  description   String
  address       String
  neighborhood  String
  latitude      Float
  longitude     Float
  priceRange    Int               // ex. 1 à 4 (échelle de budget)
  phone         String?
  status        ModerationStatus  @default(PENDING)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  owner         User              @relation("PlaceOwner", fields: [ownerId], references: [id])
  ownerId       String

  categories    PlaceCategory[]
  reviews       Review[]
  favorites     Favorite[]
  events        Event[]
  media         Media[]

  @@index([neighborhood])
  @@map("places")
}

model Category {
  id            String            @id @default(cuid())
  name          String            @unique
  slug          String            @unique

  places        PlaceCategory[]

  @@map("categories")
}

model PlaceCategory {
  place         Place     @relation(fields: [placeId], references: [id])
  placeId       String
  category      Category  @relation(fields: [categoryId], references: [id])
  categoryId    String

  @@id([placeId, categoryId])
  @@map("place_categories")
}

model Review {
  id            String            @id @default(cuid())
  rating        Int               // 1 à 5
  comment       String
  status        ModerationStatus  @default(APPROVED)
  createdAt     DateTime          @default(now())

  author        User              @relation(fields: [authorId], references: [id])
  authorId      String

  place         Place             @relation(fields: [placeId], references: [id])
  placeId       String

  @@index([placeId])
  @@map("reviews")
}

model Favorite {
  user          User      @relation(fields: [userId], references: [id])
  userId        String
  place         Place     @relation(fields: [placeId], references: [id])
  placeId       String
  createdAt     DateTime  @default(now())

  @@id([userId, placeId])
  @@map("favorites")
}

model Event {
  id            String            @id @default(cuid())
  title         String
  description   String
  startDate     DateTime
  endDate       DateTime?
  status        ModerationStatus  @default(PENDING)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  organizer     User              @relation("EventOrganizer", fields: [organizerId], references: [id])
  organizerId   String

  place         Place             @relation(fields: [placeId], references: [id])
  placeId       String

  media         Media[]

  @@index([startDate])
  @@map("events")
}

model Media {
  id            String    @id @default(cuid())
  url           String
  altText       String?
  createdAt     DateTime  @default(now())

  place         Place?    @relation(fields: [placeId], references: [id])
  placeId       String?

  event         Event?    @relation(fields: [eventId], references: [id])
  eventId       String?

  @@map("media")
}
```

---

## 4. Description des entités

### `User`
Représente tout compte sur la plateforme, quel que soit son rôle. Le champ `role` distingue les permissions (`USER`, `OWNER`, `ADMIN`) plutôt que de créer des tables séparées, ce qui simplifie l'authentification et évite la duplication de logique.

### `Place`
Un établissement (restaurant, bar, lounge...). Contient les informations affichées sur la fiche publique, ainsi qu'un `status` de modération : une fiche n'est visible publiquement qu'une fois `APPROVED`.

### `Category`
Catégorie d'établissement (ex. "Restaurant", "Bar", "Lounge", "Rooftop"). Relation many-to-many avec `Place` via `PlaceCategory`, pour permettre à un établissement d'appartenir à plusieurs catégories.

### `Review`
Avis laissé par un utilisateur sur un établissement. Comprend une note (`rating`) et un commentaire. Le `status` permet de gérer le signalement/suppression d'avis abusifs sans les supprimer physiquement dans un premier temps.

### `Favorite`
Table de jointure simple entre `User` et `Place`, avec une clé primaire composite pour éviter les doublons.

### `Event`
Événement organisé, rattaché à un établissement (`Place`) et à un organisateur (`User`). Le `status` permet la modération avant publication, comme pour les établissements.

### `Media`
Table générique pour les images, rattachées soit à un établissement, soit à un événement (les deux relations sont optionnelles, une seule est renseignée selon le contexte). Les fichiers eux-mêmes sont hébergés sur Cloudinary ; `Media` stocke uniquement l'URL et les métadonnées.

---

## 5. Index et performance

- Index sur `Place.neighborhood` pour accélérer les recherches par quartier.
- Index sur `Review.placeId` pour charger rapidement les avis d'un établissement.
- Index sur `Event.startDate` pour trier/filtrer les événements à venir efficacement.
- `slug` unique sur `Place` et `Category` pour des URLs propres (`/etablissements/le-nom-du-lieu`).

---

## 6. Points ouverts à trancher

- **Suppression physique vs logique** : pour le MVP, on part sur des `status` (`REJECTED`) plutôt que des suppressions physiques, pour garder un historique en cas de litige.
- **Note moyenne** : calculée à la volée depuis `Review` au MVP plutôt que stockée en champ dénormalisé sur `Place` — à revisiter si la volume d'avis devient important et impacte les performances.
- **Multi-images établissement** : la relation `Place → Media` est en un-à-plusieurs ; l'ordre d'affichage des photos pourra nécessiter un champ `order` si besoin d'un tri manuel.
- **Horaires d'ouverture** : non modélisés en détail dans ce premier schéma (champ texte libre potentiel dans un premier temps) ; à structurer en V2 si un filtre "ouvert maintenant" est souhaité.

---

## 7. Documents liés

- `docs/prd.md` — Fonctionnalités MVP.
- `docs/architecture.md` — Architecture technique globale.
- `docs/api.md` — À rédiger si une API formelle est introduite.
