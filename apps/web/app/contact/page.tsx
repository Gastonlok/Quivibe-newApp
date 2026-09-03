import { InfoPage } from "@/components/info-page";

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      title="Parlons de votre expérience Quivibe"
      introduction="Pour une question, un signalement ou une demande professionnelle, utilisez l’espace propriétaire ou les coordonnées officielles configurées par l’administrateur de la plateforme."
      sections={[
        { title: "Assistance utilisateurs", content: "Indiquez votre adresse de compte, la référence de réservation et le nom de l’établissement concerné afin de faciliter le traitement." },
        { title: "Établissements", content: "Les restaurateurs peuvent déposer une demande depuis la page Espace pro. Une validation administrative est requise avant l’accès aux outils propriétaires." },
      ]}
    />
  );
}
