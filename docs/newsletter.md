# Newsletter Quivibe

Le formulaire du footer accepte les visiteurs sans compte. Il normalise l’adresse, exige un consentement explicite et conserve une inscription `PENDING`. Un lien signé, valable 72 heures, permet de confirmer l’adresse. Une simple visite du lien ne confirme rien : le visiteur clique sur le bouton de confirmation.

Dans **Administration → Newsletter** (`/admin/newsletter`), un administrateur peut consulter les abonnés, enregistrer un brouillon, vérifier son aperçu puis lancer la campagne. Les collaborateurs de modération n’ont pas accès à cette liste. Une campagne lancée est figée et son identifiant empêche un double envoi lors d’une répétition de la requête. La liste des destinataires comprend uniquement les abonnés confirmés au lancement.

Les envois utilisent Resend, avec les variables déjà utilisées par les notifications :

- `RESEND_API_KEY` et `RESEND_FROM_EMAIL` : clé et expéditeur autorisé chez Resend.
- `AUTH_SECRET` : signature des liens. Une rotation invalide les anciens liens.
- `NEXT_PUBLIC_APP_URL` : URL publique utilisée dans les e-mails, à renseigner avant le build.
- `CRON_SECRET` : protège le traitement quotidien des files.

Chaque e-mail est adressé à une seule personne. Une désinscription authentifiée par son lien retire l’abonné des prochains envois ; une nouvelle inscription nécessite une nouvelle confirmation. Les anciens liens ne peuvent pas réactiver ce nouveau consentement. Les newsletters contiennent un lien visible et les en-têtes de désinscription en un clic. Un GET affiche la page de confirmation ; un POST valide la désinscription, sans compte.

La file est persistée dans PostgreSQL. Les requêtes d’inscription et de lancement démarrent un traitement après la réponse. L’interface d’administration poursuit les lots et propose également « Poursuivre les envois ». Le cron existant `/api/cron/admin-messages` traite les deux files à 08:00 UTC, sans nouvelle tâche Vercel. Un échec peut être retenté après cinq minutes, trois fois au maximum. La même clé d’idempotence est réutilisée ; au-delà de 23 heures après la première tentative, les reprises sont arrêtées pour éviter les doublons. Vérifier alors le résultat chez Resend. « Accepté » désigne l’acceptation par le service d’e-mail, pas la réception ni l’ouverture.

Le formulaire dispose d’un champ piège, d’une vérification d’origine et d’une limitation persistante à huit demandes par source réseau et par heure. Les demandes répétées pour une même adresse sont espacées de dix minutes et les réponses publiques ne révèlent pas son statut. Les adresses IP ne sont pas enregistrées en clair.

La migration additive `20260910000000_newsletter` crée les abonnés, campagnes, livraisons et compteurs de limitation. Elle n’inscrit aucun utilisateur existant. Le déploiement Vercel applique les migrations avec la commande déjà configurée.

Validation : `pnpm --filter web test` pour les tests unitaires et `pnpm --filter web test:reservations:db` pour les tests PostgreSQL. Ce dernier crée un schéma local isolé, applique les migrations et supprime uniquement ce schéma après les tests. Les envois de test sont simulés.

Référence du prestataire : [désinscription en un clic](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails).
