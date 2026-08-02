// apps/web/features/places/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 1. Schéma de validation
const getPlacesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  neighborhood: z.string().optional(),
});

// 2. Fonction getPlaces (corrigée pour SQLite)
export async function getPlaces(input: z.infer<typeof getPlacesSchema>) {
  const validated = getPlacesSchema.parse(input);

  const where: any = {
    status: "APPROVED",
  };

  if (validated.search) {
    // ✅ SQLite : contains est insensible à la casse par défaut
    // Pas besoin de mode: "insensitive"
    where.OR = [
      { name: { contains: validated.search } },
      { description: { contains: validated.search } },
    ];
  }

  if (validated.neighborhood) {
    // ✅ SQLite : equals est insensible à la casse par défaut
    where.neighborhood = { equals: validated.neighborhood };
  }

  if (validated.category) {
    where.categories = {
      some: {
        category: {
          slug: validated.category,
        },
      },
    };
  }

  const places = await prisma.place.findMany({
    where,
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      media: true,
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return places.map((place) => ({
    ...place,
    averageRating: place.reviews.length > 0
      ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
      : null,
  }));
}

// 3. Fonction getPlaceBySlug
export async function getPlaceBySlug(slug: string) {
  const place = await prisma.place.findUnique({
    where: {
      slug,
      status: "APPROVED",
    },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
      media: true,
      reviews: {
        where: {
          status: "APPROVED",
        },
        include: {
          author: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      events: {
        where: {
          status: "APPROVED",
          startDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          startDate: "asc",
        },
        take: 5,
      },
    },
  });

  if (!place) {
    return null;
  }

  const averageRating = place.reviews.length > 0
    ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
    : null;

  return {
    ...place,
    averageRating,
  };
}

// 4. Fonction getPlaceReviews
export async function getPlaceReviews(placeId: string) {
  return prisma.review.findMany({
    where: {
      placeId,
      status: "APPROVED",
    },
    include: {
      author: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });
}

// 5. Fonction getPlaceEvents
export async function getPlaceEvents(placeId: string) {
  return prisma.event.findMany({
    where: {
      placeId,
      status: "APPROVED",
      startDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      startDate: "asc",
    },
    take: 5,
  });
}
