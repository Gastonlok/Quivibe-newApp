import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, MapPin, Utensils } from "lucide-react";
import { prisma } from "@/lib/prisma";


export const dynamic = "force-dynamic";
interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await prisma.event.findFirst({
    where: { id, status: "APPROVED" },
    include: {
      media: { take: 1 },
      place: {
        include: {
          media: { take: 1 },
          categories: { take: 1, include: { category: true } },
        },
      },
    },
  });

  if (!event) notFound();

  const image =
    event.media[0]?.url ||
    event.place.media[0]?.url ||
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&h=900&fit=crop";

  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(event.startDate);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container py-8 sm:py-12">
        <div className="relative h-[320px] overflow-hidden rounded-3xl sm:h-[460px]">
          <Image
            src={image}
            alt={event.media[0]?.altText || event.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 max-w-3xl p-6 text-white sm:p-10">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary-100">
              {event.place.categories[0]?.category.name || "Événement"}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-extrabold text-gray-950">À propos</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-gray-700">
              {event.description}
            </p>
          </section>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-medium lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4 text-sm font-semibold text-gray-700">
              <p className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                {date}
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                {event.place.address}, {event.place.neighborhood}
              </p>
              <p className="flex items-start gap-3">
                <Utensils className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                {event.place.name}
              </p>
              {event.endDate && (
                <p className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                  Fin prévue à {new Intl.DateTimeFormat("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Africa/Kinshasa",
                  }).format(event.endDate)}
                </p>
              )}
            </div>

            <Link
              href={`/places/${event.place.slug}`}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-primary-600 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-primary-700"
            >
              Voir l’établissement et réserver
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
