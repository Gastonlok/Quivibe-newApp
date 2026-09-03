import { InfoPage } from "@/components/info-page";

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Confidentialité"
      title="Protection des données personnelles"
      introduction="Quivibe traite uniquement les informations nécessaires à la création des comptes, aux avis, aux favoris et aux réservations."
      sections={[
        { title: "Statistiques de frequentation", content: "Les fiches publiques utilisent un identifiant aleatoire de navigateur pour produire des statistiques de visite anonymisees. Cet identifiant n'est pas rapproche de votre compte, de votre nom ou de votre position et aide uniquement les proprietaires a comprendre l'interet suscite par leur fiche." },
        { title: "Données traitées", content: "Nom, adresse électronique, téléphone éventuellement fourni, historique de réservation, avis et préférences enregistrées." },
        { title: "Finalités", content: "Authentification, exécution des réservations, communication avec les établissements, sécurité, modération et amélioration du service." },
        { title: "Vos droits", content: "Vous pouvez demander l’accès, la correction ou la suppression de vos données auprès de l’exploitant de la plateforme, sous réserve des obligations légales de conservation." },
      ]}
    />
  );
}
