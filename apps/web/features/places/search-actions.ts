"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restaurantSearchSchema, type SearchInput } from "./search-params";
import { searchRestaurants } from "./search-service";

export async function searchRestaurantsAction(input: SearchInput) {
  const parsed = restaurantSearchSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      error:
        "Certains critères sont invalides. Vérifiez la date, l’heure et les filtres sélectionnés.",
    };
  try {
    const session = await auth();
    const data = await searchRestaurants(
      prisma,
      parsed.data,
      session?.user?.id,
    );
    return { success: true as const, data };
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message.startsWith("Choisissez un créneau")
        ? error.message
        : "La recherche est momentanément indisponible. Réessayez.";
    return { success: false as const, error: message };
  }
}

export async function restaurantSearchOptions() {
  const [neighborhoods, categories] = await Promise.all([
    prisma.place.findMany({
      where: { status: "APPROVED" },
      distinct: ["neighborhood"],
      select: { neighborhood: true },
      orderBy: { neighborhood: "asc" },
    }),
    prisma.category.findMany({
      where: { places: { some: { place: { status: "APPROVED" } } } },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    neighborhoods: neighborhoods.map((p) => p.neighborhood),
    categories,
  };
}

export async function restaurantSuggestions(query: string) {
  if (
    typeof query !== "string" ||
    query.trim().length < 2 ||
    query.length > 100
  )
    return [];
  return prisma.place.findMany({
    where: {
      status: "APPROVED",
      name: { contains: query.trim(), mode: "insensitive" },
    },
    select: { id: true, name: true, neighborhood: true },
    take: 5,
    orderBy: { name: "asc" },
  });
}
