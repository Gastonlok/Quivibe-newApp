import { InfoPage } from "@/components/info-page";

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Conditions d’utilisation"
      title="Règles essentielles du service"
      introduction="L’utilisation de Quivibe implique des informations exactes, un comportement respectueux et l’usage loyal des fonctions de réservation et d’avis."
      sections={[
        { title: "Réservations", content: "L’utilisateur doit respecter l’horaire et le nombre de personnes annoncés. Toute indisponibilité doit conduire à une annulation dans l’espace Mes réservations." },
        { title: "Avis", content: "Les avis doivent relater une expérience réelle, rester pertinents et ne pas contenir de propos illicites, discriminatoires ou diffamatoires." },
        { title: "Établissements", content: "Chaque propriétaire reste responsable de l’exactitude de sa fiche, de ses disponibilités et du traitement des demandes reçues." },
      ]}
    />
  );
}
