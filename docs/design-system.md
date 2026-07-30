# Design System — Quivibe

**Version :** 1.0
**Statut :** Draft — Sprint 0
**Dernière mise à jour :** 30 juillet 2026
**Documents liés :** `docs/prd.md`, `docs/architecture.md`

---

## 1. Objectif

Ce document définit les fondations visuelles de Quivibe : couleurs, typographie, espacements, composants de base. Il sert de référence unique pour garder une identité cohérente sur toute la plateforme, et s'implémente directement via Tailwind CSS + shadcn/ui.

---

## 2. Direction visuelle

Quivibe doit inspirer confiance et donner envie de sortir : une esthétique moderne, chaleureuse et dynamique, pensée mobile-first. On évite le générique "startup SaaS froide" — la marque doit refléter l'énergie de la vie nocturne et culinaire de Kinshasa, sans tomber dans le tape-à-l'œil.

- **Ton** : chaleureux, vivant, digne de confiance.
- **Densité** : aérée sur desktop, compacte et efficace sur mobile (contrainte de bande passante et d'écran).
- **Photographie** : les photos d'établissements sont au cœur de l'expérience — le design doit leur laisser la place principale plutôt que de les concurrencer visuellement.

---

## 3. Couleurs

| Rôle | Usage | Exemple de valeur |
|---|---|---|
| `primary` | Actions principales, liens actifs, éléments de marque | Orange chaud (#F2622E) |
| `secondary` | Accents secondaires, badges, highlights | Bleu nuit (#1B2340) |
| `accent` | Éléments d'événements / mise en avant | Jaune doré (#F5B841) |
| `success` | Confirmations, statut "approuvé" | Vert (#2E9E5B) |
| `warning` | Statuts "en attente" | Ambre (#E8A93B) |
| `destructive` | Suppressions, statut "rejeté", erreurs | Rouge (#D64545) |
| `background` | Fond général | Blanc cassé (#FAFAF8) / Sombre en mode nuit |
| `foreground` | Texte principal | Gris très foncé (#1A1A1A) |
| `muted` | Texte secondaire, placeholders | Gris moyen (#6B7280) |
| `border` | Séparateurs, bordures de carte | Gris clair (#E5E7EB) |

Les valeurs exactes seront définies comme variables CSS (`--primary`, `--secondary`, etc.) dans `apps/web/styles/globals.css`, exploitables directement par la configuration Tailwind (`tailwind.config.ts`) et par shadcn/ui. Un mode sombre est envisageable en V2, l'architecture de variables CSS le permettra sans refonte.

---

## 4. Typographie

- **Police principale** : une sans-serif moderne et lisible (ex. Inter ou Geist), pour les textes courants.
- **Police de titres** : la même famille en graisse plus marquée (Semibold/Bold), pour garder une cohérence et limiter le poids de chargement (une seule famille de police à charger).

| Niveau | Taille (desktop) | Taille (mobile) | Graisse |
|---|---|---|---|
| H1 | 36px | 28px | Bold |
| H2 | 28px | 22px | Semibold |
| H3 | 22px | 18px | Semibold |
| Corps de texte | 16px | 16px | Regular |
| Texte secondaire | 14px | 14px | Regular |
| Petites légendes | 12px | 12px | Regular |

---

## 5. Espacements et grille

- Échelle d'espacement basée sur un multiple de 4px (4, 8, 12, 16, 24, 32, 48, 64), cohérente avec les classes d'espacement natives de Tailwind.
- Grille de contenu : conteneur centré avec largeur max (ex. 1200px sur desktop), marges latérales généreuses sur mobile (16px minimum).
- Cartes établissement : coins arrondis modérés (8–12px), ombre légère pour la profondeur sans surcharger visuellement.

---

## 6. Composants de base (via shadcn/ui)

Composants shadcn/ui à intégrer en priorité pour le MVP :

- `Button` (variantes : primary, secondary, ghost, destructive)
- `Card` (fiche établissement, fiche événement)
- `Input`, `Textarea`, `Select` (formulaires)
- `Badge` (catégories, statut de modération)
- `Avatar` (utilisateur, établissement)
- `Dialog` / `Sheet` (confirmations, formulaires en modale)
- `Tabs` (navigation entre sections d'une fiche établissement)
- `Rating` (composant personnalisé, non natif shadcn, à construire pour les avis en étoiles)
- `Toast` (confirmations d'action, erreurs)
- `Skeleton` (états de chargement, important vu les contraintes de connexion)

Chaque composant personnalisé additionnel (ex. `Rating`, carte d'établissement, carte d'événement) sera documenté avec ses variantes dans ce fichier au fur et à mesure de sa création.

---

## 7. Iconographie

- Bibliothèque : **lucide-react**, cohérente avec l'écosystème shadcn/ui.
- Taille par défaut : 20px pour les icônes inline, 24px pour les icônes autonomes (boutons, navigation).
- Éviter la surcharge d'icônes décoratives : privilégier une icône uniquement quand elle ajoute un repère visuel clair (catégorie, action, statut).

---

## 8. Accessibilité

- Contraste minimum AA (WCAG) sur tous les textes, en particulier `primary` sur fond clair et foncé.
- Tous les composants interactifs doivent être navigables au clavier (héritage naturel de Radix UI via shadcn/ui).
- Textes alternatifs obligatoires sur les images d'établissement (`Media.altText`).
- Tailles de zone tactile minimum de 44x44px sur mobile pour les boutons et liens principaux.

---

## 9. États des composants

Chaque composant interactif doit prévoir explicitement :
- État par défaut
- État hover (desktop)
- État focus (clavier)
- État actif/pressé
- État désactivé
- État de chargement (skeleton ou spinner)
- État d'erreur (formulaires notamment, avec message clair sous le champ concerné)

---

## 10. Prochaines étapes

- Déclinaison de ces tokens dans `tailwind.config.ts` et les variables CSS de `apps/web`.
- Premières maquettes UI (`docs/ui-ux/`) pour les écrans clés : page de découverte, fiche établissement, fiche événement, espace établissement, back-office admin.
- Construction du composant `Rating` personnalisé et de la carte établissement, réutilisés dans plusieurs features.
