# Quivibe AI — analyse et modifications

## Analyse de l’existant

Le parcours était `/map` → `POST /api/quivibe-ai` → Prisma → classement local → reformulation facultative par OpenAI Responses. Le modèle configuré par défaut est `gpt-5-mini`, remplaçable avec `OPENAI_MODEL`. Aucun outil de recherche ou de réservation n’était confié au modèle : les recherches étaient réalisées par le serveur.

La page chargeait tous les établissements approuvés avant même une conversation. L’API chargeait également les établissements, leurs catégories, photos et notes. Le classement utilisait uniquement le dernier message, tandis que six messages d’historique étaient transmis pour la reformulation. Le modèle ne recevait ni le classement détaillé ni les descriptions complètes. Les données utilisateur, instructions et historique étaient assemblés dans un même texte.

Conséquences : « Pas trop cher » perdait le contexte romantique ; les mots « romantique » et « date » augmentaient artificiellement la préférence pour des lieux chers ; les notes pouvaient faire remonter des lieux sans correspondance ; une seule prestation demandée était filtrée ; trois résultats étaient proposés même si une seule adresse correspondait vraiment. Le navigateur recalculait des recommandations sans contexte en cas d’erreur.

Les disponibilités utilisaient une deuxième implémentation, distincte de `getAvailableSlotsAction`, avec des valeurs implicites pour la date et le groupe. Les cartes n’avaient pas de bouton direct de réservation. La réservation réelle reste gérée par `ReservationWidget`, Auth.js et les actions serveur existantes, avec contrôle des capacités et transaction Prisma.

Le schéma fournit une gamme de prix, pas un budget par repas. Les horaires de réservation ne sont pas des horaires d’ouverture. Cuisine et ambiance ne sont pas des champs dédiés : leur prise en compte dépend des descriptions. Menus et événements existent, mais ne sont pas exploités par ce parcours ; aucune information les concernant n’est inventée.

## Modifications

| Fichier | Changement |
| --- | --- |
| `apps/web/features/ai/conversation.ts` | Contexte validé : type de lieu, quartier, budget, montant, occasion, ambiance, cuisine, équipements, groupe, date, heure, proximité et contraintes. Mise à jour cumulative et interprétation locale de secours. |
| `apps/web/features/ai/model.ts` | Extraction structurée via Responses, puis rédaction à partir des seules justifications disponibles. Instructions séparées des données, `store: false`, délais limités, validation des réponses et repli local. |
| `apps/web/features/ai/recommend.ts` | Filtres de quartier, catégorie, gamme de prix et ensemble des équipements ; classement par correspondance avant la note ; raisons fondées sur les descriptions ; limites visibles ; jusqu’à trois résultats, sans remplissage obligatoire. |
| `apps/web/features/ai/types.ts` | Coordonnées, taille de groupe acceptée pour la réservation en ligne et indication de correspondance partielle. |
| `apps/web/features/ai/booking.ts` | Dates non ambiguës au fuseau de Kinshasa et lien vers le formulaire avec date et groupe. |
| `apps/web/app/api/quivibe-ai/route.ts` | Validation de l’entrée, réponses simples sans recherche, contexte cumulatif, revalidation des IDs précédents, comparaison, recherche géographique dans un rayon annoncé de 5 km, consultation du service réel de disponibilités si date et groupe sont connus. |
| `apps/web/app/map/page.tsx` | Suppression du chargement du catalogue à l’ouverture du dialogue. |
| `apps/web/app/map/quivibe-ai-content.tsx` | Transmission du contexte et des IDs précédents, géolocalisation volontaire, état de génération, prévention des doubles envois, retours à la ligne, défilement du dialogue, gestion honnête des erreurs et bouton Réserver. |
| `apps/web/features/reservations/components/reservation-widget.tsx` | Ancre `reservation` et préremplissage validé de la date et du groupe ; les actions authentifiées existantes conservent le contrôle de la réservation. |
| `apps/web/vitest.config.mts` | Résolution de l’alias `@` pour tester le parcours serveur. |
| `apps/web/features/ai/{conversation,booking,model,route}.test.ts` | Tests de contexte, classement, dates, API, réponses du modèle invalides et réservation. |
| `apps/web/e2e/quivibe-ai.spec.ts` | Deux tests Chromium du dialogue, du contexte transmis, du lien de réservation et du comportement mobile en cas d’échec. |

La structure Next.js/Prisma/Auth.js et la palette visuelle sont conservées. Aucun changement de schéma, migration, réservation réelle ou modification de `.env` n’a été effectué.

Le contexte est conservé pendant la conversation ouverte, indépendamment de la fenêtre de douze messages envoyée au modèle. Il n’est pas persisté après rechargement de la page. Les IDs d’adresses renvoyés par le navigateur sont systématiquement confrontés aux établissements approuvés, jamais utilisés comme source de faits.

## Conversation : exemples avant/après

Exemples illustratifs à partir des fixtures synthétiques des tests ; ce ne sont pas des adresses réelles ni des transcriptions d’un appel OpenAI en direct.

| Message | Avant | Après |
| --- | --- | --- |
| « Un endroit romantique », puis « Pas trop cher » | Classement recalculé uniquement sur le budget ; romantique favorisait aussi le haut de gamme. | Romantique reste mémorisé, gamme de prix basse appliquée. Une description réellement romantique justifie la proposition. |
| « Je suis à Gombe », puis « On est 6 » | Le quartier disparaissait de la recherche. | Gombe est conservé. Six personnes est transmis au formulaire ; la capacité de réservation en ligne est distinguée de la capacité physique du lieu. |
| « Un endroit avec une belle vue » | Une bonne note pouvait suffire à apparaître. | Une vue décrite est privilégiée. Sinon, la carte indique « À confirmer : vue ». |
| « Chic mais pas trop cher » | Deux bonus opposés pouvaient favoriser une adresse chère. | Le filtre budget s’applique ; chic est recherché dans la description, pas déduit du prix. |
| « Tu me conseilles lequel ? » | Une nouvelle recherche sur ces seuls mots. | Comparaison limitée aux adresses précédentes encore approuvées, avec leurs justifications. |
| « Non, quelque chose de plus calme » | Le nouveau message seul influençait le classement. | Calme remplace animé ; quartier, budget et occasion restent présents. |
| « J’ai seulement 30 dollars » | Aucun traitement fiable du montant. | Montant conservé, avec l’indication que la gamme de prix ne garantit pas ce budget exact. |
| « Je veux réserver » | Recherche de créneaux avec date et groupe implicites. | « Choisis Réserver sur l’adresse qui te plaît… » ouvre le vrai formulaire. Date et groupe sont transmis lorsqu’ils sont connus. Aucune confirmation simulée. |

Le modèle, lorsqu’il est configuré, reformule ces éléments avec un ton naturel et une question au maximum. Les cartes restent générées à partir de données serveur. En son absence, les explications restent déterministes et plus simples.

## Tests et résultats

Commandes lancées depuis `apps/web`, avec les exécutables installés :

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/vitest/vitest.mjs run
node node_modules/prisma/build/index.js generate
node node_modules/next/dist/bin/next build
$env:E2E_BASE_URL = 'http://127.0.0.1:3100'
node node_modules/@playwright/test/cli.js test --output test-results-ai --workers 1
```

- TypeScript : succès.
- ESLint : succès.
- Vitest : **31 tests réussis dans 6 fichiers**, incluant les tests préexistants et les dix messages demandés.
- Prisma generate : succès après arrêt du serveur de test qui verrouillait initialement la DLL Windows.
- Chromium : **4 réussis, 3 échoués**. Les **2 nouveaux tests AI passent**, dont le test mobile à 390 px. Les tests existants de protection du profil et de recherche passent aussi.
- Les deux tests de connexion administrateur échouent car `prisma.user.findUnique()` ne peut joindre `localhost:5434`. Le test d’accueil échoue sur le même problème avec `prisma.place.findMany()`.
- Build : compilation réussie ; génération de `/sitemap.xml` bloquée par PostgreSQL indisponible sur `localhost:5434`. Le build complet n’est donc pas validé.
- `git diff --check` : succès.

Le lanceur `pnpm --filter web type-check` a échoué avant exécution lors de sa vérification de téléchargement de pnpm 9. Les commandes directes ci-dessus utilisent les versions déjà installées, sans désactiver ce contrôle.

La configuration locale n’a pas de `OPENAI_API_KEY`. Les appels OpenAI sont donc testés avec des réponses simulées, notamment sorties structurées, erreur réseau, résultat incomplet ou invalide, préservation du contexte et rejet d’une confirmation de réservation. Les données Prisma sont simulées dans les tests API. La qualité conversationnelle du modèle en direct, la recherche sur le catalogue réel et une réservation de bout en bout restent à valider avec les services configurés.

Référence consultée pour le format des sorties structurées : [documentation officielle OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs).

## Recommandations

1. Rétablir la base configurée sur `localhost:5434`, puis relancer build et tests navigateur existants. Un autre service PostgreSQL local existe, mais sa base et ses accès n’ont pas été substitués à ceux du projet.
2. Configurer `OPENAI_API_KEY` côté serveur pour activer l’interprétation et la rédaction naturelles, puis évaluer les dix scénarios sur les données réelles. Le modèle configurable reste `gpt-5-mini` par défaut.
3. Enrichir les descriptions des lieux sur les ambiances, cuisines et occasions. Les heuristiques ne peuvent pas déduire fiablement ces propriétés d’une note ou d’un prix.
4. Ajouter ensuite une consultation ciblée des menus visibles et événements approuvés quand une question le nécessite, en conservant leur provenance et sans assimiler un prix de plat au coût complet d’une sortie.
5. Pour un catalogue important, déplacer davantage de filtrage vers Prisma et agréger les notes en base. Le serveur sélectionne les champs utiles, mais classe encore le catalogue approuvé en mémoire.
6. Évaluer une mémoire persistante avec consentement et une mesure de qualité conversationnelle. Le texte généré reste probabiliste : les instructions de source, les validations et les cartes contrôlées réduisent les risques d’hallucination sans constituer une garantie formelle sur toute phrase du modèle.
