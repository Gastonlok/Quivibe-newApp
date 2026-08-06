// apps/web/features/places/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// ============================================
// TYPES
// ============================================

export interface PlaceWithFavorites {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  priceRange: number;
  phone: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  averageRating: number | null;
  isFavorite: boolean;
  media: {
    id: string;
    url: string;
    altText: string | null;
    placeId: string | null;
    createdAt: Date;
    eventId: string | null;
  }[];
  categories: {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  reviews: {
    rating: number;
  }[];
  favorites?: { userId: string }[];
}

export interface ListPlacesResult {
  success: boolean;
  data?: {
    places: PlaceWithFavorites[];
    total: number;
    page: number;
    totalPages: number;
  };
  error?: string;
}

// ============================================
// SCHÉMAS DE VALIDATION
// ============================================

const getPlacesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  neighborhood: z.string().optional(),
});

const listPlacesSchema = z.object({
  search: z.string().optional(),
  neighborhood: z.string().optional(),
  priceRange: z.string().optional(),
  page: z.string().optional(),
});

// ============================================
// FONCTIONS
// ============================================

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

// ============================================
// LIST PLACES AVEC FAVORIS
// ============================================

export async function listPlacesAction(
  input: z.infer<typeof listPlacesSchema>
): Promise<ListPlacesResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const validated = listPlacesSchema.parse(input);
    const page = parseInt(validated.page || "1");
    const skip = (page - 1) * 12;
    const take = 12;

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

    if (validated.priceRange) {
      where.priceRange = { equals: parseInt(validated.priceRange) };
    }

    const [places, total] = await Promise.all([
      prisma.place.findMany({
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
          favorites: userId
            ? {
                where: {
                  userId: userId,
                },
                select: {
                  userId: true,
                },
              }
            : false,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take,
      }),
      prisma.place.count({ where }),
    ]);

    const placesWithFavorites: PlaceWithFavorites[] = places.map((place) => {
      const averageRating = place.reviews.length > 0
        ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
        : null;

      return {
        ...place,
        averageRating,
        isFavorite: place.favorites && place.favorites.length > 0,
      };
    });

    return {
      success: true,
      data: {
        places: placesWithFavorites,
        total,
        page,
        totalPages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    console.error("Erreur listPlacesAction:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération des établissements",
    };
  }
}

// ============================================
// PLACE BY SLUG
// ============================================

export async function getPlaceBySlug(slug: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

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
        favorites: userId
          ? {
              where: {
                userId: userId,
              },
              select: {
                userId: true,
              },
            }
          : false,
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
      isFavorite: place.favorites && place.favorites.length > 0,
    };
  } catch (error) {
    console.error("Erreur getPlaceBySlug:", error);
    return null;
  }
}

// ============================================
// PLACE REVIEWS
// ============================================

export async function getPlaceReviews(placeId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        placeId,
        status: "APPROVED",
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return reviews;
  } catch (error) {
    console.error("Erreur getPlaceReviews:", error);
    return [];
  }
}

// ============================================
// PLACE EVENTS
// ============================================

export async function getPlaceEvents(placeId: string) {
  try {
    const events = await prisma.event.findMany({
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

    return events;
  } catch (error) {
    console.error("Erreur getPlaceEvents:", error);
    return [];
  }
}

// ============================================
// TOP RATED PLACES
// ============================================
export async function getTopRatedPlaces() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

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
        favorites: userId
          ? {
              where: {
                userId: userId,
              },
              select: {
                userId: true,
              },
            }
          : false,
      },
      orderBy: {
        reviews: {
          _count: "desc",
        },
      },
      take: 12, // Prendre 12 pour le carrousel
    });

    return places.map((place) => ({
      ...place,
      averageRating: place.reviews.length > 0
        ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
        : null,
      isFavorite: place.favorites && place.favorites.length > 0,
    }));
  } catch (error) {
    console.error("Erreur getTopRatedPlaces:", error);
    return [];
  }
}

// ============================================
// RECOMMENDATIONS
// ============================================

export async function getRecommendations() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

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
        favorites: userId
          ? {
              where: {
                userId: userId,
              },
              select: {
                userId: true,
              },
            }
          : false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12, // Prendre 12 pour le carrousel
    });

    return places.map((place) => ({
      ...place,
      averageRating: place.reviews.length > 0
        ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
        : null,
      isFavorite: place.favorites && place.favorites.length > 0,
    }));
  } catch (error) {
    console.error("Erreur getRecommendations:", error);
    return [];
  }
}
