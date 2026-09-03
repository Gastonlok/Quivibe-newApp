import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { OwnerPlaceEditor } from "@/features/owner/components/owner-place-editor";
import { OwnerPlaceMenuEditor } from "@/features/owner/components/owner-place-menu-editor";
import { OwnerCollaborationPanel } from "@/features/owner/components/owner-collaboration-panel";
import { OwnerEngagementPanel } from "@/features/owner/components/owner-engagement-panel";
import { OwnerPlaceWorkspace } from "@/features/owner/components/owner-place-workspace";
import { canManageCollaborators, getPlaceAccess } from "@/features/owner/access";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OwnerPlaceEditPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/owner/dashboard");

  const { placeId } = await params;
  const access = await getPlaceAccess(placeId);
  if (!access) redirect("/");
  const [place, categories] = await Promise.all([
    prisma.place.findFirst({
      where: { id: placeId },
      include: {
        categories: { include: { category: true } },
        media: { orderBy: { createdAt: "asc" }, select: { id: true, url: true, altText: true } },
        menuItems: { orderBy: { sortOrder: "asc" } },
        collaborators: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
        reviews: {
          where: { status: "APPROVED" },
          include: { author: { select: { name: true } }, response: { select: { body: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        events: { where: { startDate: { gte: new Date() } }, orderBy: { startDate: "asc" }, take: 10 },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!place) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container py-10">
        <div className="rounded-3xl bg-gray-950 px-6 py-8 text-white shadow-medium sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Link href="/owner/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Retour a l&apos;espace pro
              </Link>
              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-300">Gestion de l&apos;etablissement</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{place.name}</h1>
              <p className="mt-2 text-sm text-gray-300">Modifiez votre fiche, vos images et les conditions de reservation.</p>
            </div>
            <Link href="/owner/analytics" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/20">
              <BarChart3 className="h-4 w-4" /> Voir les statistiques
            </Link>
          </div>
        </div>

        <OwnerPlaceWorkspace
          profile={<OwnerPlaceEditor place={place} categories={categories} />}
          menu={
            <OwnerPlaceMenuEditor
              placeId={place.id}
              initialMenuVisible={place.menuVisible}
              initialItems={place.menuItems}
            />
          }
          activity={<OwnerEngagementPanel placeId={place.id} reviews={place.reviews} events={place.events} />}
          team={
            <OwnerCollaborationPanel
              placeId={place.id}
              collaborators={place.collaborators}
              canManage={canManageCollaborators(access)}
            />
          }
        />
      </div>
    </main>
  );
}
