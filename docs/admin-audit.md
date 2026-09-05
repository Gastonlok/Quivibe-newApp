# Audit et extension de l’administration Quivibe

Le code fournit désormais un espace d’administration avec délégation de modération, suspension des comptes et messages individuels ou groupés dans Quivibe et par e-mail. La connexion locale sur `localhost:5434` a été rétablie : les 10 migrations sont appliquées et le build complet réussit.

## Constats et corrections

| Constat dans le code initial | Correction apportée |
| --- | --- |
| L’accès administrateur reposait en partie sur un rôle conservé dans le JWT. | Lecture du rôle, des permissions et de la suspension en base à chaque session serveur ; contrôle de chaque domaine côté serveur. |
| Aucune délégation de modération. | Permissions indépendantes pour les établissements, avis et signalements, événements et demandes propriétaires. |
| Aucun moyen de suspendre un compte. | Suspension et réactivation ; les sessions suspendues ou supprimées perdent leur accès dès la prochaine requête serveur. |
| La validation d’une demande propriétaire pouvait transformer un ADMIN en OWNER. | Seuls les comptes USER passent à OWNER lors de l’approbation. |
| Pas de messagerie administrative. | Composition, sélection des destinataires, prévisualisation, boîte de réception privée et file d’e-mails persistante. |
| La route publique de test d’e-mail pouvait envoyer un message via GET. | POST réservé à l’administrateur connecté, vers sa propre adresse ; résultat réel du prestataire. GET renvoie 405. |
| Le changement d’adresse e-mail conservait sa vérification antérieure. | Vérification remise à zéro et demande de confirmation de la nouvelle adresse. |
| La suppression d’un établissement pouvait échouer sur ses liens aux catégories. | Suppression des liens dans la transaction de suppression de l’établissement. |
| Aucun journal des opérations administratives. | Journal enregistré dans la même transaction que les mutations des routes d’administration concernées. |

## Accès et possibilités

Point d’entrée : `/admin/dashboard`. Les collaborateurs utilisent le même espace et voient uniquement les rubriques correspondant à leurs permissions.

| Domaine | Administrateur | Collaborateur délégué |
| --- | --- | --- |
| Comptes | Recherche, rôles, suspension, réactivation, permissions et suppression encadrée | Aucun accès |
| Établissements | Création, modération, édition complète via l’espace propriétaire, réaffectation et suppression | Modération si permission PLACES |
| Avis et signalements | Modération et suppression | Modération si permission REVIEWS |
| Événements | Modération, modification des informations principales, réaffectation et suppression ; création depuis l’éditeur d’établissement existant | Modération si permission EVENTS |
| Demandes propriétaires | Consultation et décision | Traitement si permission OWNER_REQUESTS |
| Catégories | Création, modification, suppression des catégories inutilisées | Aucun accès |
| Réservations et statistiques | Accès global déjà présent dans l’espace propriétaire, désormais lié depuis l’administration | Aucun accès global ajouté |
| Messages aux utilisateurs | Messages personnels, sélection de plusieurs comptes, tous les comptes actifs ou groupe par rôle | Aucun accès à l’envoi administratif |
| Journal | Consultation des 100 dernières opérations enregistrées | Aucun accès |

Dans **Comptes et collaborateurs**, cocher les missions d’un compte existant puis enregistrer. Il n’est pas nécessaire de lui donner le rôle ADMIN. Retirer une permission révoque son accès serveur au domaine concerné. La délégation porte sur un domaine de modération, pas sur l’attribution nominative de dossiers individuels.

Un administrateur ne peut pas supprimer, suspendre ou rétrograder son propre compte. Le dernier administrateur actif est protégé par une transaction sérialisable. Un compte possédant des établissements ou événements doit être réaffecté avant suppression ; sa suspension reste disponible. Les droits de collaboration propres à un établissement restent distincts des permissions de modération de la plateforme.

## Messages dans Quivibe et par e-mail

1. Ouvrir **Envoyer des messages**, ou **Message** depuis un compte.
2. Choisir les destinataires, saisir le sujet et le texte, et conserver **Envoyer aussi par e-mail** pour les deux canaux.
3. Prévisualiser le contenu, le nombre de comptes actifs et le nombre d’adresses vérifiées. Une sélection personnelle affiche aussi les noms et adresses retenus.
4. Confirmer : le message et les entrées de boîte de réception sont créés dans une transaction. Les e-mails sont ensuite traités par lots pendant que la page reste ouverte.

Chaque destinataire retrouve uniquement ses messages dans `/messages`, avec un état lu/non lu. Le contenu est du texte simple ; les e-mails échappent le HTML. Chaque e-mail a un destinataire unique, sans exposer les autres adresses.

Les comptes suspendus sont exclus. Une adresse non vérifiée reçoit le message dans Quivibe, mais aucun e-mail. L’état du compte et la vérification sont contrôlés à nouveau au moment de l’envoi. Les notifications sont descendantes : une conversation avec réponses des utilisateurs n’a pas été ajoutée.

La file conserve les états en attente, en cours, acceptés, ignorés et en échec. Le bouton **Traiter les e-mails en attente** reprend les travaux disponibles. Chaque appel traite au plus 20 destinataires, avec une limite de temps et un verrou par destinataire ; l’interface peut enchaîner plusieurs lots. Après un échec, une nouvelle tentative devient possible après cinq minutes, dans la limite de trois tentatives.

Une clé de requête et une empreinte du contenu évitent de créer deux campagnes lors d’une répétition de la même requête. Chaque e-mail possède aussi une clé d’idempotence Resend. Les reprises sont arrêtées 23 heures après la première tentative pour rester dans la fenêtre de déduplication de 24 heures du prestataire. Un échec dépassant cette fenêtre demande une vérification chez Resend avant une nouvelle campagne. [Documentation Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).

L’état « accepté par Resend » ne prouve pas la réception dans la boîte e-mail. Le suivi des rebonds et des livraisons par webhook n’est pas implémenté. L’historique de l’interface affiche les 50 dernières campagnes avec leurs compteurs ; il ne fournit pas encore le diagnostic détaillé par destinataire.

## Activation

La migration ajoutée est `apps/web/prisma/migrations/20260906000000_admin_control/migration.sql`. Elle ajoute les permissions et la suspension à `users`, ainsi que les tables des messages, destinataires et opérations administratives. Son application a été confirmée sur la base locale. En production, le build Vercel commence par `prisma migrate deploy`.

Une fois la base configurée disponible, exécuter depuis `apps/web` :

```powershell
node node_modules/prisma/build/index.js migrate deploy
node node_modules/prisma/build/index.js generate
```

Redémarrer ensuite l’application. Les comptes ADMIN existants conservent leurs droits. Les permissions des autres comptes sont vides par défaut.

La variable `RESEND_API_KEY` est présente dans la configuration locale. Vérifier la validité de cette clé, le domaine expéditeur utilisé par `lib/email.ts` et l’URL publique de l’application dans l’environnement de déploiement. Aucun envoi réel n’a été effectué pendant les tests.

Définir également un `CRON_SECRET` aléatoire dans l’environnement de déploiement. Il était absent localement. Sans lui, `/api/cron/admin-messages` refuse toutes les requêtes. L’ordonnanceur doit fournir l’en-tête `Authorization: Bearer <CRON_SECRET>` ; conserver cette valeur côté serveur.

`apps/web/vercel.json` ajoute un passage de secours quotidien à 08:00 UTC. Ce choix respecte la fréquence quotidienne permise sur Vercel Hobby. Un seul lot est traité par passage : cette fréquence ne garantit pas un traitement rapide d’un grand volume laissé en attente. Pour des reprises automatiques fréquentes, configurer un ordonnanceur autorisé ou une offre permettant une fréquence supérieure. Les nouvelles tentatives doivent intervenir dans les 23 heures ; une reprise seulement le lendemain peut donc nécessiter une vérification manuelle. [Documentation Vercel Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Le projet Vercel de production est `quivibe`, avec `apps/web` comme répertoire racine. La configuration Vercel est placée dans ce répertoire pour inclure les tâches planifiées lors des déploiements Git. Les noms de variables `DATABASE_URL`, `DIRECT_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` et `CRON_SECRET` sont présents dans l’environnement de production. [Configuration des projets Vercel](https://vercel.com/docs/project-configuration/project-settings).

## Vérifications et limites

- Vitest : **64 tests réussis**, répartis dans 14 fichiers. Les tests administratifs couvrent les permissions, sessions révoquées, protections des comptes, confidentialité de la boîte de réception, déduplication, verrouillage des envois et erreurs du prestataire. La base et le service e-mail sont simulés dans ces tests.
- Playwright : **5 tests réussis**, dont 3 sur les accès anonymes aux routes administratives, à la boîte de réception et au cron, et 2 tests de non-régression de l’assistant Quivibe.
- TypeScript et ESLint : réussis. Schéma Prisma validé et client généré.
- Build Next.js : réussi après rétablissement de PostgreSQL, y compris la génération de `/sitemap.xml` et des 45 pages statiques.
- Les parcours authentifiés complets et la livraison réelle d’e-mails restent à vérifier. L’application locale des migrations et la présence des nouvelles tables et colonnes ont été confirmées.
- Le journal couvre les routes administratives modifiées ou ajoutées. Il ne reconstitue pas les opérations passées et ne couvre pas encore toutes les actions historiques de l’espace propriétaire.
- Le contrôle décrit concerne les fonctions métier de l’application. Les secrets, le déploiement, les sauvegardes et la facturation des prestataires restent gérés dans leur infrastructure respective.

Les modifications précédentes de l’assistant IA sont conservées. L’activation payante d’OpenAI reste reportée conformément à la demande.
