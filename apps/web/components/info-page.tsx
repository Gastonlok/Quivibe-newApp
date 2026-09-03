import Link from "next/link";

interface InfoPageProps {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: Array<{ title: string; content: string }>;
}

export function InfoPage({ eyebrow, title, introduction, sections }: InfoPageProps) {
  return (
    <main className="bg-[#f7f7f5] px-4 py-12 sm:px-6 lg:py-16">
      <article className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
          {introduction}
        </p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-extrabold text-gray-950">{section.title}</h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-gray-600">
                {section.content}
              </p>
            </section>
          ))}
        </div>
        <div className="mt-10 border-t border-gray-200 pt-6">
          <Link
            href="/"
            className="inline-flex rounded-full bg-primary-700 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-primary-800"
          >
            Retour à l’accueil
          </Link>
        </div>
      </article>
    </main>
  );
}
