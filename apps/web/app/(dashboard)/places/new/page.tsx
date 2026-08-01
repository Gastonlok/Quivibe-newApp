import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreatePlaceForm } from "@/features/places/components/create-place-form";

export default async function NewPlacePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="px-6 py-10 flex flex-col gap-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Ajouter mon établissement</h1>
        <p className="text-gray-600 text-sm mt-1">
          Ta fiche sera visible publiquement une fois validée par l&apos;équipe
          Quivibe.
        </p>
      </div>

      <CreatePlaceForm categories={categories} />
    </main>
  );
}
