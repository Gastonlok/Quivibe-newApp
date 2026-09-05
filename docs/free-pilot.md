# Pilote gratuit Quivibe

Le pilote prépare la mesure de la valeur apportée aux restaurants. Aucun paiement,
abonnement payant, prélèvement, publicité sponsorisée ou facture n'est activé.

## Réservations

- Le créneau, les capacités et le propriétaire sont lus dans la transaction de création.
  Les transactions PostgreSQL `Serializable` sont reprises en cas de conflit.
- Chaque soumission possède une clé UUID. Une nouvelle tentative avec la même clé et
  les mêmes données renvoie la réservation existante. Changer les données avec cette
  clé provoque un conflit. Le formulaire conserve la clé pendant ses tentatives ;
  fermer ou recharger la page crée un nouveau formulaire. Consulter les réservations
  après une réponse réseau incertaine, avant de lancer une autre demande.
- La réservation, le premier événement et les notifications sont enregistrés ensemble.
  Les changements de statut contrôlent l'accès dans la transaction et ajoutent un
  événement avec l'ancien statut, le nouveau statut, l'auteur et son rôle à cet instant.
- Le client annule uniquement sa propre réservation, avant l'heure prévue. Le
  propriétaire, ses collaborateurs et l'administration gèrent les statuts. Les statuts
  terminaux ne peuvent pas être rouverts. `COMPLETED` et `NO_SHOW` sont refusés avant
  l'heure prévue ; les résultats sont déclaratifs, pas une preuve de paiement.
- `ownerIdAtBooking` conserve l'identifiant du propriétaire lors de la création,
  même après un transfert. `source=QUIVIBE` est fixé côté serveur. Les réservations
  historiques conservent un propriétaire de création inconnu (`NULL`). Aucun historique
  rétroactif n'est inventé. Les écrans indiquent l'absence des anciens changements.
- La suppression d'un compte client ou d'un établissement continue de supprimer ses
  réservations et leur historique par cascade. Avant une monétisation réelle, définir
  les règles de conservation et d'archivage nécessaires au modèle commercial retenu.

## Données commerciales minimales

`Place.commercialStatus=PILOT` et `pilotStartedAt` marquent le pilote. Pour les fiches
existantes, la date de début correspond à l'application de la migration.

À la clôture, le restaurant peut déclarer `totalAmount` et `currency` (CDF ou USD).
Un montant inconnu reste `NULL`, avec une devise `NULL`. Un vrai zéro est accepté.
Les montants sont des chaînes décimales validées, puis des `Decimal(12,2)` PostgreSQL.
Les contraintes de base interdisent les montants négatifs ou sans devise.
`commissionRate` (fraction, `Decimal(5,4)`) et `commissionAmount` (`Decimal(12,2)`)
restent à zéro. `paymentStatus=NOT_TRACKED` signifie qu'aucun paiement n'est suivi.
Aucun montant déclaré n'est présenté comme du revenu Quivibe ni additionné entre devises.

## Notifications dans Quivibe et par e-mail

Les messages automatiques réutilisent la boîte de réception et la file persistante
existantes (`AdminMessage.kind=RESERVATION`). Les campagnes administratives restent
filtrées sur `kind=ADMIN`. Le client et le propriétaire reçoivent des messages séparés
à la création et lors des changements de statut. Une demande `PENDING` demande
explicitement d'attendre la confirmation du restaurant.

L'envoi est lancé après la réponse via `after`, avec une durée maximale de 60 secondes
sur les pages concernées. La file conserve le travail si l'envoi est interrompu.
Chaque destinataire est revendiqué avant envoi, avec une clé d'idempotence stable,
3 tentatives maximum et une fenêtre de reprise inférieure à celle de Resend.
Les comptes suspendus sont exclus ; les comptes sans e-mail vérifié gardent le message
dans Quivibe, avec l'envoi e-mail `SKIPPED`. `SENT` signifie accepté par Resend,
pas livré dans la boîte du destinataire. Aucune adresse n'est exposée aux autres clients.

Les rappels sont mis en file pour les réservations confirmées du lendemain (Kinshasa),
au plus 100 candidats par exécution. `reminderQueuedAt` marque cette mise en file,
distincte de l'ancien `reminderSentAt`. Un rappel expiré ou dont la réservation a changé
de statut n'est plus envoyé par e-mail. Les messages de changement de statut sont des
événements datés ; le statut actuel est toujours disponible dans les réservations.
Après annulation, les trois premières inscriptions en attente du jour peuvent recevoir
une alerte de disponibilité. `NOTIFIED` signifie que l'alerte est disponible dans Quivibe.

Le worker traite au plus 20 destinataires par appel, avec un budget de 40 secondes.
Les créations et changements lancent leur propre envoi ciblé ; le cron des messages
reprend les messages restants quotidiennement. Une file importante ou une panne du
prestataire peut donc retarder les e-mails, notamment les rappels au-delà de ce lot.
Avant d'augmenter le volume du pilote, adapter la fréquence et la capacité du worker.
Le réglage actuel ne promet pas de livraison immédiate ou garantie.

## Indicateurs

Les statistiques sont accessibles dans `/owner/analytics`. Un propriétaire voit ses
établissements et ceux où il collabore ; l'administration voit l'ensemble.
Les périodes commencent à minuit à Kinshasa et incluent aujourd'hui jusqu'à maintenant.

| Indicateur                                         | Définition                                                                                                                                                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demandes reçues / 30 jours                         | Réservations selon `createdAt`, tous statuts, y compris les annulations.                                                                                                                                               |
| Réalisées / 30 ou 7 jours                          | Statut `COMPLETED`, selon `dateTime` entre le début de période et maintenant.                                                                                                                                          |
| Personnes accueillies                              | Somme de `partySize` des réservations réalisées de cette période.                                                                                                                                                      |
| Annulations                                        | `CANCELLED` parmi toutes les réservations arrivées à échéance dans la période.                                                                                                                                         |
| Absences                                           | `NO_SHOW / (NO_SHOW + COMPLETED)`, sur les dates prévues de la période.                                                                                                                                                |
| Résultats à renseigner                             | Réservations arrivées à échéance, encore `PENDING` ou `CONFIRMED`.                                                                                                                                                     |
| Restaurants ayant traité une réservation / 7 jours | Restaurants actuellement publiés, ouverts aux réservations et en pilote, avec au moins un changement de statut par leur propriétaire/collaborateur pendant la période. Les actions ADMIN et CUSTOMER sont exclues.     |
| Favoris actuels                                    | Relations Favorite existantes au moment de la consultation ; ce n'est pas un flux de 30 jours.                                                                                                                         |
| Conversion suivie                                  | Navigateurs distincts avec une visite suivie de période reliée à au moins une réservation du même restaurant, créée après la visite et avant la fin de période / navigateurs distincts des visites suivies de période. |

L'attribution est faite côté serveur à la dernière visite de la même fiche, avec le
même cookie HttpOnly `qv_visitor`, dans les 30 minutes avant la création. Le canal
enregistré est `SEARCH`, `MAP`, `AI` ou `DIRECT` d'après le lien suivi. Ces canaux sont
des indices de navigation déclarés par le navigateur, pas une preuve commerciale.
`UNKNOWN` signifie historique, suivi indisponible, cookie absent ou visite trop ancienne.

Les anciennes visites `UNKNOWN` sont exclues du dénominateur de conversion, mais restent
dans les visites totales. L'écran montre la couverture et les demandes sans attribution.
Un navigateur qui réserve plusieurs fois compte une fois ; une annulation ne supprime
pas le fait d'avoir généré une demande. Un dénominateur vide donne « — », pas 0 %.
L'agrégat dédoublonne les navigateurs entre établissements ; les conversions par
établissement les dédoublonnent à l'intérieur de chaque fiche.

Les visites et interactions sont dédoublonnées par navigateur et établissement sur
30 minutes (par type pour les interactions). L'ajout d'un favori depuis une liste
ne crée pas de visite de fiche. Les interactions sans cookie sont ignorées, tandis
que les favoris actuels sont toujours comptés. Les visites/interactions des
administrateurs et de l'équipe connectée du restaurant sont exclues depuis ce lot.
Les anciennes interactions ne sont pas corrigées rétroactivement.
Le cookie pseudonyme ne représente pas forcément une personne unique : changement de
navigateur/appareil, suppression de cookie et visites automatisées limitent la précision.

## Vérification et mise en service

- Migration additive : `20260909000000_free_pilot` ; aucune suppression de données.
- `pnpm --filter web test` : schémas, transitions, indicateurs, notifications et suite existante.
- Depuis `apps/web`, `node scripts/test-reservation-db.cjs` crée un schéma temporaire
  sur PostgreSQL local, applique toutes les migrations, teste les transactions
  concurrentes puis supprime uniquement ce schéma. Aucun fournisseur e-mail n'est appelé.
- La CI active ces mêmes tests transactionnels dans sa base PostgreSQL jetable.
- Appliquer `prisma migrate deploy` avant le nouveau code et générer le client Prisma.
  Le build Vercel existant applique les migrations avant de compiler l'application.

Références techniques : [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after),
[nombres exacts PostgreSQL](https://www.postgresql.org/docs/16/datatype-numeric.html),
[idempotence Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
