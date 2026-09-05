import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const FEATURES = [
  "Fiche établissement et visibilité publique",
  "Réception et gestion des réservations",
  "Suivi des avis et indicateurs essentiels",
  "Création d’événements liés à l’établissement",
];

export default function OwnerPricingPage() {
  return (
    <main className="bg-[#f7f7f5] px-4 py-14 sm:px-6">
      <section className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">
          Espace professionnel
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
          Développez les réservations de votre établissement
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
          L’accès professionnel est activé après validation de l’établissement
          par l’équipe Quivibe.
        </p>
        <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-primary-200 bg-white p-8 text-left shadow-medium">
          <h2 className="text-2xl font-extrabold text-gray-950">
            Pilote gratuit
          </h2>
          <p className="mt-2 text-gray-600">
            Accès gratuit et sans commission pendant la période pilote. Toute
            future offre payante fera l’objet d’une proposition distincte.
          </p>
          <ul className="mt-6 space-y-4">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-gray-700"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/owners#contact"
            className="mt-8 flex w-full justify-center rounded-full bg-primary-700 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary-800"
          >
            Déposer une demande
          </Link>
        </div>
      </section>
    </main>
  );
}
