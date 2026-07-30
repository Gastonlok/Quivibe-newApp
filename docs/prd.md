# PRD — Quivibe

**Product Requirements Document**
**Version :** 1.0
**Statut :** Draft — Sprint 0
**Dernière mise à jour :** 30 juillet 2026

---

## 1. Résumé exécutif

Quivibe (anciennement KinVibes) est une plateforme SaaS qui aide les Congolais à découvrir où sortir : restaurants, bars, lounges, événements et lieux de divertissement. Elle connecte les utilisateurs aux établissements locaux via des recommandations, des avis, une carte interactive et des événements en temps réel.

L'objectif du MVP est de valider, avec un nombre restreint d'établissements et d'utilisateurs early adopters, que Quivibe résout un vrai problème de découverte locale, avant d'étendre la plateforme à l'échelle nationale.

---

## 2. Vision et objectifs

### Vision
Devenir la référence pour découvrir où sortir en République Démocratique du Congo, en commençant par Kinshasa.

### Objectifs produit (12 mois)
- Lancer un MVP fonctionnel et stable.
- Onboarder les premiers établissements partenaires (restaurateurs, bars, organisateurs d'événements).
- Construire une base d'utilisateurs actifs qui consultent et publient des avis.
- Générer suffisamment de traction pour présenter la plateforme à des investisseurs et partenaires.

### Objectifs business (long terme)
- Devenir un canal de visibilité incontournable pour les établissements locaux.
- Créer un modèle de revenu (mise en avant, abonnements établissements, billetterie événements).
- Étendre à d'autres villes du pays, puis à l'app mobile.

---

## 3. Analyse du problème

### Le problème utilisateur
Il est aujourd'hui difficile pour un habitant de Kinshasa de savoir, de façon fiable et à jour, où sortir :
- Les informations sur les établissements sont dispersées entre WhatsApp, Instagram, Facebook et le bouche-à-oreille.
- Les horaires, prix et évènements changent souvent sans que l'information soit mise à jour.
- Il n'existe pas de plateforme centralisée avec des avis fiables et une recherche par catégorie, quartier ou ambiance.
- Découvrir un nouvel endroit repose presque uniquement sur les recommandations d'amis.

### Le problème établissement
- Les restaurateurs et organisateurs d'événements n'ont pas de vitrine numérique unifiée.
- Ils dépendent des réseaux sociaux pour communiquer, avec une portée organique limitée.
- Ils manquent de retours structurés (avis, notes) pour améliorer leur offre.
- Il n'existe pas d'outil simple pour publier un événement et le rendre visible localement.

### Pourquoi maintenant
- Adoption smartphone et data mobile en forte croissance à Kinshasa.
- Scène culinaire et événementielle en expansion (restaurants, lounges, afterworks).
- Aucun acteur local n'occupe ce positionnement (les solutions existantes sont génériques ou inadaptées au marché local).

---

## 4. Analyse des utilisateurs

Quivibe s'adresse à trois types d'utilisateurs :

1. **Utilisateurs finaux (grand public)** — cherchent où sortir, veulent des recommandations fiables.
2. **Établissements** — restaurants, bars, lounges qui veulent gagner en visibilité.
3. **Organisateurs d'événements** — veulent promouvoir soirées, concerts, activités.

---

## 5. Personas

### Persona 1 — Aline, 27 ans, jeune active à Kinshasa
- Sort 2 à 3 fois par mois avec des amis.
- S'appuie sur Instagram et le bouche-à-oreille pour choisir un endroit.
- Frustration : difficile de savoir si un endroit est encore ouvert, à quel prix, et si l'ambiance lui correspond.
- Attente : une application simple, avec avis fiables, photos récentes et filtres par ambiance/budget.

### Persona 2 — Patrick, 35 ans, propriétaire d'un restaurant
- Gère seul la communication de son établissement (Instagram, WhatsApp Status).
- Frustration : peu de visibilité en dehors de son réseau existant, pas de retour structuré des clients.
- Attente : une vitrine simple à mettre à jour, qui lui amène de nouveaux clients et des avis exploitables.

### Persona 3 — Grace, 30 ans, organisatrice d'événements
- Organise des soirées et afterworks ponctuels.
- Frustration : promouvoir un événement demande beaucoup d'efforts sur plusieurs canaux, sans mesure claire du succès.
- Attente : publier un événement en quelques minutes et suivre l'intérêt généré.

---

## 6. Fonctionnalités MVP

### 6.1 Utilisateur (grand public)
- Inscription / connexion (email + réseaux sociaux via Auth.js).
- Recherche et filtres : catégorie, quartier, budget, ambiance.
- Fiche établissement : photos, description, horaires, localisation carte, menu/tarifs indicatifs.
- Avis et notes (texte + étoiles).
- Favoris.
- Découverte d'événements à venir.
- Carte interactive des établissements (Leaflet + OpenStreetMap).

### 6.2 Établissement
- Création et gestion de fiche établissement.
- Upload de photos (Cloudinary).
- Mise à jour des informations (horaires, menu, contact).
- Consultation des avis reçus.
- Publication d'événements liés à l'établissement.

### 6.3 Administration
- Modération des établissements (validation avant publication).
- Modération des avis (signalement, suppression).
- Tableau de bord basique (nombre d'utilisateurs, établissements, avis).

### 6.4 Transverse
- Recherche full-text.
- Responsive design (mobile-first, la majorité du trafic sera mobile).
- Notifications par email pour les actions clés (nouvel avis, nouvel événement à proximité — si le temps le permet).

---

## 7. Hors périmètre (V2 et au-delà)

- Application mobile native (iOS/Android).
- Billetterie payante intégrée pour les événements.
- Système de réservation de table en ligne.
- Paiement en ligne / abonnements établissements premium.
- Recommandations personnalisées basées sur l'historique utilisateur.
- Programme de fidélité inter-établissements.
- Multi-villes (au-delà de Kinshasa).
- Messagerie interne utilisateur ↔ établissement.

---

## 8. Critères de succès du MVP

Le MVP sera considéré comme un succès si, à l'issue de la phase pilote, on observe :
- Un nombre suffisant d'établissements actifs à jour sur la plateforme.
- Un usage réel et répété par les utilisateurs (recherche, avis, favoris).
- Des retours qualitatifs positifs des établissements pilotes sur la valeur perçue.
- Une base suffisante de contenu (avis, fiches complètes) pour rendre la plateforme crédible face à de futurs partenaires ou investisseurs.

---

## 9. KPIs

| Catégorie | Indicateur |
|---|---|
| Acquisition | Nombre d'utilisateurs inscrits |
| Activation | % d'utilisateurs ayant effectué une recherche dans les 7 jours suivant l'inscription |
| Engagement | Nombre moyen de sessions par utilisateur actif / mois |
| Contenu | Nombre d'établissements actifs avec fiche complète |
| Confiance | Nombre d'avis publiés, note moyenne de la plateforme |
| Rétention | % d'utilisateurs actifs revenant après 30 jours |
| Établissements | Nombre d'établissements ayant publié au moins un événement |

---

## 10. Contraintes techniques

- Stack : Next.js 15, TypeScript, PostgreSQL, Prisma, Tailwind CSS, shadcn/ui.
- Hébergement pensé pour un budget limité en phase MVP.
- Connexions internet mobiles parfois lentes à Kinshasa → prioriser la performance et le poids des pages (images optimisées, lazy loading).
- Support mobile-first indispensable (majorité du trafic attendu sur smartphone).
- Cartographie via OpenStreetMap/Leaflet plutôt que Google Maps (coût).
- Modération manuelle en phase MVP (pas de modération automatisée par IA dans un premier temps).

---

## 11. Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Difficulté à convaincre les premiers établissements de créer/maintenir leur fiche | Élevé | Onboarding assisté manuellement pour les premiers partenaires pilotes |
| Manque de contenu au lancement (effet "plateforme vide") | Élevé | Pré-remplir un socle d'établissements avant l'ouverture publique |
| Faible fiabilité de la connexion internet des utilisateurs | Moyen | Optimisation performance, mode dégradé, poids de page réduit |
| Avis frauduleux ou biaisés | Moyen | Modération manuelle, signalement, vérification basique |
| Concurrence de solutions génériques (Google Maps, réseaux sociaux) | Moyen | Différenciation par la spécialisation locale et la curation |
| Ressources de développement limitées (équipe réduite) | Élevé | Priorisation stricte du scope MVP, sprints courts |

---

## 12. Roadmap (aperçu)

**Sprint 0 — Fondations**
Mise en place du dépôt, documentation (vision, PRD), architecture technique, schéma de base de données, design system.

**Sprint 1 — Cœur de plateforme**
Authentification, création de fiches établissement, recherche et filtres de base.

**Sprint 2 — Expérience utilisateur**
Fiches établissement complètes, carte interactive, avis et notes, favoris.

**Sprint 3 — Événements et administration**
Publication d'événements, back-office de modération, tableau de bord admin.

**Sprint 4 — Polissage et lancement pilote**
Tests, corrections, optimisation performance, onboarding des premiers établissements, déploiement.

*(Le détail sprint par sprint sera affiné dans `docs/roadmap.md`.)*

---

## 13. User stories (échantillon)

- En tant qu'utilisateur, je veux rechercher des établissements par quartier et catégorie afin de trouver rapidement où sortir près de chez moi.
- En tant qu'utilisateur, je veux laisser un avis avec une note afin de partager mon expérience avec la communauté.
- En tant qu'utilisateur, je veux ajouter un établissement à mes favoris afin de le retrouver facilement plus tard.
- En tant qu'établissement, je veux créer et mettre à jour ma fiche afin de présenter une image à jour de mon activité.
- En tant qu'établissement, je veux publier un événement afin d'attirer de nouveaux clients pour une soirée spéciale.
- En tant qu'administrateur, je veux valider les nouvelles fiches établissement afin de garantir la qualité du contenu publié.
- En tant qu'administrateur, je veux pouvoir supprimer un avis signalé afin de préserver la confiance dans la plateforme.

---

## 14. Parcours utilisateurs (aperçu)

### Parcours "Découverte d'un lieu"
1. L'utilisateur ouvre Quivibe et arrive sur la page de découverte.
2. Il filtre par quartier, catégorie et budget.
3. Il consulte une fiche établissement (photos, horaires, avis).
4. Il ajoute l'établissement à ses favoris ou consulte son emplacement sur la carte.
5. Il s'y rend, puis revient laisser un avis.

### Parcours "Établissement rejoint la plateforme"
1. Le propriétaire crée un compte établissement.
2. Il renseigne les informations de base (nom, catégorie, adresse, horaires).
3. Il ajoute des photos et une description.
4. La fiche est soumise à modération.
5. Une fois validée, la fiche devient visible publiquement.
6. Le propriétaire peut ensuite publier un événement.

### Parcours "Découverte d'un événement"
1. L'organisateur crée un événement lié à son établissement.
2. L'événement apparaît dans le fil "Événements à venir".
3. Les utilisateurs consultent l'événement et peuvent le sauvegarder en favori.
4. Le jour J, les utilisateurs se rendent à l'événement.

---

## 15. Prochaines étapes

- Validation de ce PRD.
- Rédaction de `docs/architecture.md` (architecture technique détaillée).
- Rédaction de `docs/database.md` (schéma Prisma).
- Démarrage du design system et des premières maquettes UI.
