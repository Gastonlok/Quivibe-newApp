import { InfoPage } from "@/components/info-page";

export default function CookiesPage() {
  return (
    <InfoPage
      eyebrow="Cookies"
      title="Cookies et sessions"
      introduction="Quivibe utilise des mécanismes de session nécessaires à la connexion et au fonctionnement sécurisé du compte."
      sections={[
        { title: "Mesure d'audience", content: "Lors de la consultation d'une fiche d'etablissement, Quivibe enregistre un identifiant aleatoire dans le cookie qv_visitor. Il sert uniquement a compter des visites anonymisees pour le proprietaire de la fiche, au plus une fois toutes les 30 minutes. Il ne contient ni nom, ni e-mail, ni localisation." },
        { title: "Cookies nécessaires", content: "Ils permettent notamment de maintenir la session, de protéger les accès et de mémoriser certaines interactions indispensables." },
        { title: "Paramétrage", content: "Le blocage des cookies nécessaires dans le navigateur peut empêcher la connexion, les favoris ou la gestion des réservations." },
      ]}
    />
  );
}
