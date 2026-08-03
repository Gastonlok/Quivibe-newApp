// apps/web/features/places/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const getPlacesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  neighborhood: z.string().optional(),
});

export async function getPlaces(input: z.infer<typeof getPlacesSchema>) {
  const validated = getPlacesSchema.parse(input);

  const where: any = {
    status: "APPROVED",
  };

  if (validated.search) {
    where.OR = [
      { name: { contains: validated.search } },
      { description: { contains: validated.search } },
    ];
  }

  if (validated.neighborhood) {
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
              // ✅ Supprimer avatarUrl car il n'existe pas dans le modèle
              // image: true, // Utiliser image à la place si disponible
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
          // ✅ Supprimer avatarUrl
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });
}

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

export async function getTopRatedPlaces() {
  const places = await prisma.place.findMany({
    where: {
      status: "APPROVED",
    },
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
      reviews: {
        _count: "desc",
      },
    },
    take: 6,
  });

  return places.map((place) => ({
    ...place,
    averageRating: place.reviews.length > 0
      ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
      : null,
  }));
}

export async function getRecommendations() {
  const places = await prisma.place.findMany({
    where: {
      status: "APPROVED",
    },
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
    take: 6,
  });

  return places.map((place) => ({
    ...place,
    averageRating: place.reviews.length > 0
      ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
      : null,
  }));
}
