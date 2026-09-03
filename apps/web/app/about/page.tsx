import { InfoPage } from "@/components/info-page";

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="À propos"
      title="Quivibe, les bonnes tables et sorties de Kinshasa"
      introduction="Quivibe facilite la découverte d’établissements, la consultation d’avis et la réservation de tables depuis une interface simple et locale."
      sections={[
        { title: "Notre mission", content: "Rendre les restaurants, cafés, bars et lieux de sortie de Kinshasa plus faciles à découvrir, comparer et réserver." },
        { title: "Pour les clients", content: "Une recherche claire, des fiches détaillées, des avis, une carte et un historique de réservations." },
        { title: "Pour les établissements", content: "Un espace professionnel permettant de présenter son activité et de traiter les réservations reçues." },
      ]}
    />
  );
}
