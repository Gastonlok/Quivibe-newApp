"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/utils/slugify";
import {
  createPlaceSchema,
  listPlacesFilterSchema,
  type ListPlacesFilter,
} from "@/features/places/schema";
import type { Place, Prisma } from "@prisma/client";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

const PAGE_SIZE = 12;

export async function createPlaceAction(
  input: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await auth();

  if (!session?.user || session.user.role !== "OWNER") {
    return { success: false, error: "Action non autorisée" };
  }

  const parsed = createPlaceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Champs invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { categoryIds, ...placeData } = parsed.data;

  const baseSlug = slugify(placeData.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.place.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const place = await prisma.place.create({
    data: {
      ...placeData,
      slug,
      ownerId: session.user.id,
      categories: {
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });

  return { success: true, data: { id: place.id, slug: place.slug } };
}

export async function listPlacesAction(
  rawFilter: unknown
): Promise<
  ActionResult<{ places: Place[]; total: number; page: number; pageSize: number }>
> {
  const parsed = listPlacesFilterSchema.safeParse(rawFilter ?? {});
  if (!parsed.success) {
    return { success: false, error: "Filtres invalides" };
  }

  const filter: ListPlacesFilter = parsed.data;

  const where: Prisma.PlaceWhereInput = {
    status: "APPROVED",
    ...(filter.neighborhood ? { neighborhood: filter.neighborhood } : {}),
    ...(filter.priceRange ? { priceRange: filter.priceRange } : {}),
    ...(filter.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { description: { contains: filter.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filter.categorySlug
      ? { categories: { some: { category: { slug: filter.categorySlug } } } }
      : {}),
  };

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.place.count({ where }),
  ]);

  return {
    success: true,
    data: { places, total, page: filter.page, pageSize: PAGE_SIZE },
  };
}

export async function getPlaceBySlugAction(slug: string) {
  const place = await prisma.place.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      categories: { include: { category: true } },
      media: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return place;
}
