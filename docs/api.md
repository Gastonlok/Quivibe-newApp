# API — Quivibe

**Version :** 1.0
**Statut :** Draft — Sprint 0
**Dernière mise à jour :** 30 juillet 2026
**Documents liés :** `docs/architecture.md`, `docs/database.md`

---

## 1. Approche

Comme précisé dans `docs/architecture.md`, Quivibe n'expose pas d'API REST publique en phase MVP. La logique métier est accessible via des **Server Actions** Next.js, appelées directement depuis les composants React côté serveur ou client. Ce document sert de contrat interne : il liste les actions disponibles par domaine, leurs entrées, sorties et règles d'autorisation.

Si une application mobile ou un partenaire externe a besoin d'un accès programmatique en V2, ces Server Actions serviront de base pour définir une API REST/GraphQL formelle, exposée via `app/api/`.

### Convention de nommage
`domaine.action` — ex. `places.create`, `reviews.moderate`.

### Format des réponses
Toutes les Server Actions retournent une structure homogène :

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

---

## 2. Domaine `auth`

| Action | Entrée | Sortie | Accès |
|---|---|---|---|
| `auth.register` | `{ name, email, password }` | `User` | Public |
| `auth.login` | `{ email, password }` | Session | Public |
| `auth.logout` | — | — | Authentifié |
| `auth.requestPasswordReset` | `{ email }` | — | Public |

---

## 3. Domaine `places`

| Action | Entrée | Sortie | Accès |
|---|---|---|---|
| `places.list` | `{ search?, categorySlug?, neighborhood?, priceRange? }` | `Place[]` (paginé) | Public |
| `places.getBySlug` | `{ slug }` | `Place` avec relations (reviews, categories, media) | Public |
| `places.create` | `{ name, description, address, neighborhood, latitude, longitude, priceRange, categoryIds[] }` | `Place` (status `PENDING`) | `OWNER` |
| `places.update` | `{ id, ...champs modifiables }` | `Place` | `OWNER` (propriétaire uniquement) |
| `places.uploadMedia` | `{ placeId, mediaUrl, altText? }` | `Media` | `OWNER` (propriétaire uniquement) |
| `places.moderate` | `{ id, status }` | `Place` | `ADMIN` |

---

## 4. Domaine `reviews`

| Action | Entrée | Sortie | Accès |
|---|---|---|---|
| `reviews.create` | `{ placeId, rating, comment }` | `Review` | Authentifié |
| `reviews.listByPlace` | `{ placeId }` | `Review[]` (paginé) | Public |
| `reviews.report` | `{ reviewId, reason }` | — | Authentifié |
| `reviews.moderate` | `{ id, status }` | `Review` | `ADMIN` |

Règle métier : un utilisateur ne peut laisser qu'un seul avis par établissement (contrainte applicative, à vérifier dans le service avant écriture).

---

## 5. Domaine `favorites`

| Action | Entrée | Sortie | Accès |
|---|---|---|---|
| `favorites.add` | `{ placeId }` | `Favorite` | Authentifié |
| `favorites.remove` | `{ placeId }` | — | Authentifié |
| `favorites.list` | — | `Place[]` | Authentifié |

---

## 6. Domaine `events`

| Action | Entrée | Sortie | Accès |
|---|---|---|---|
| `events.list` | `{ upcomingOnly?, placeId? }` | `Event[]` (paginé) | Public |
| `events.getById` | `{ id }` | `Event` avec relations | Public |
| `events.create` | `{ placeId, title, description, startDate, endDate? }` | `Event` (status `PENDING`) | `OWNER` |
| `events.update` | `{ id, ...champs modifiables }` | `Event` | `OWNER` (organisateur uniquement) |
| `events.moderate` | `{ id, status }` | `Event` | `ADMIN` |

---

## 7. Domaine `search`

| Action | Entrée | Sortie | Accès |
|---|---|---|---|
| `search.places` | `{ query, filters? }` | `Place[]` | Public |

Implémentation MVP : recherche full-text simple sur `name` et `description` via PostgreSQL (`ILIKE` ou `tsvector` selon les besoins de pertinence observés en usage réel).

---

## 8. Domaine `admin`

| Action | Entrée | Sortie | Accès |
|---|---|---|---|
| `admin.dashboardStats` | — | `{ usersCount, placesCount, reviewsCount, eventsCount }` | `ADMIN` |
| `admin.listPendingPlaces` | — | `Place[]` | `ADMIN` |
| `admin.listPendingEvents` | — | `Event[]` | `ADMIN` |
| `admin.listReportedReviews` | — | `Review[]` | `ADMIN` |

---

## 9. Règles d'autorisation transverses

- Toute Server Action modifiant une ressource vérifie systématiquement, côté serveur : (1) que l'utilisateur est authentifié si requis, (2) que son rôle est autorisé, (3) qu'il est bien propriétaire de la ressource concernée le cas échéant (ex. `places.update` ne doit pas permettre à un `OWNER` de modifier l'établissement d'un autre).
- Les actions `moderate` sont réservées à `ADMIN` sans exception.
- Les erreurs d'autorisation renvoient un message générique (`"Action non autorisée"`) plutôt que de révéler la raison précise, pour limiter l'énumération d'informations sensibles.

---

## 10. Évolution vers une API REST (V2, si nécessaire)

Si une application mobile est développée, chaque Server Action listée ci-dessus deviendra naturellement un point d'entrée REST équivalent (ex. `POST /api/places`, `GET /api/places/:slug`), en réutilisant directement la couche `services/` définie dans `docs/architecture.md`. Aucune réécriture de la logique métier ne sera nécessaire, seule la couche d'exposition changera.
