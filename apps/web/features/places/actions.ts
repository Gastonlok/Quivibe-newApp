"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { slugify } from "@/utils/slugify";

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
  reservationsEnabled: boolean;
  reservationDuration: number;
  reservationCapacity: number;
  maxPartySize: number;
  autoConfirmReservations: boolean;
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
  events?: { id: string }[];
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

// ✅ AJOUTER category dans listPlacesSchema
const listPlacesSchema = z.object({
  search: z.string().optional(),
  neighborhood: z.string().optional(),
  priceRange: z.string().optional(),
  page: z.string().optional(),
  reservationsOnly: z.enum(["true"]).optional(),
  eventsOnly: z.enum(["true"]).optional(),
  category: z.string().optional(), // ✅ ICI
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
        where: {
            status: "APPROVED",
        },
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

    if (validated.reservationsOnly) {
      where.reservationsEnabled = true;
    }

    if (validated.eventsOnly) {
      where.events = { some: { status: "APPROVED", startDate: { gte: new Date() } } };
    }

    // ✅ Filtre par catégorie
    if (validated.category) {
      where.categories = {
        some: {
          category: {
            slug: validated.category,
          },
        },
      };
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
            where: {
                status: "APPROVED",
            },
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
          events: { where: { status: "APPROVED", startDate: { gte: new Date() } }, select: { id: true }, take: 1 },
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
            ownerVerifiedAt: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        media: {
          orderBy: {
            createdAt: "asc",
          },
        },
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
        menuItems: {
          where: { available: true },
          orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
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

    const { menuItems, ...placeData } = place;

    return {
      ...placeData,
      menuItems: place.menuVisible ? menuItems : [],
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
        response: { include: { author: { select: { name: true } } } },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return reviews;
  } catch (error) {
    console.error("Erreur getPlaceRreviews:", error);
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

// CREATE PLACE ACTION
export async function createPlaceAction(data: any) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const name = String(data.name || "").trim();
    const address = String(data.address || "").trim();
    const neighborhood = String(data.neighborhood || "").trim();
    if (name.length < 2 || !address || !neighborhood) {
      return {
        success: false,
        error: "Le nom, l'adresse et le quartier sont obligatoires.",
      };
    }

    const baseSlug = slugify(String(data.slug || name)) || `etablissement-${Date.now()}`;
    const existingSlug = await prisma.place.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });
    const slug = existingSlug
      ? `${baseSlug}-${Date.now().toString(36).slice(-5)}`
      : baseSlug;

    const place = await prisma.place.create({
      data: {
        name,
        slug,
        description: String(data.description || "").trim(),
        address,
        neighborhood,
        latitude: Number.isFinite(Number(data.latitude))
          ? Number(data.latitude)
          : -4.325,
        longitude: Number.isFinite(Number(data.longitude))
          ? Number(data.longitude)
          : 15.322,
        priceRange: Math.min(4, Math.max(1, Number(data.priceRange) || 2)),
        phone: String(data.phone || "").trim() || null,
        ownerId:
          session.user.role === "ADMIN" && data.ownerId
            ? String(data.ownerId)
            : session.user.id,
        status: session.user.role === "ADMIN" ? "APPROVED" : "PENDING",
        categories: data.categoryId
          ? {
              create: {
                category: { connect: { id: String(data.categoryId) } },
              },
            }
          : undefined,
      },
    });

    return { success: true, data: place };
  } catch (error) {
    console.error("Erreur createPlaceAction:", error);
    return { success: false, error: "Erreur lors de la création" };
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
          where: {
              status: "APPROVED",
          },
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
    });

    return places.map((place) => ({
      ...place,
      averageRating: place.reviews.length > 0
        ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
        : null,
      isFavorite: place.favorites && place.favorites.length > 0,
    })).sort((left, right) => {
      const ratingDifference = (right.averageRating ?? -1) - (left.averageRating ?? -1);
      if (ratingDifference !== 0) return ratingDifference;
      return right.reviews.length - left.reviews.length;
    }).slice(0, 12);
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

    const preferredCategories = userId
      ? await prisma.category.findMany({
          where: {
            places: {
              some: {
                place: {
                  OR: [
                    { favorites: { some: { userId } } },
                    { reservations: { some: { customerId: userId } } },
                  ],
                },
              },
            },
          },
          select: { id: true },
        })
      : [];
    const preferredCategoryIds = new Set(preferredCategories.map((category) => category.id));

    const places = await prisma.place.findMany({
      where: {
        status: "APPROVED",
        ...(userId ? { favorites: { none: { userId } } } : {}),
      },
      include: {
        categories: { include: { category: true } },
        media: true,
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        favorites: userId
          ? { where: { userId }, select: { userId: true } }
          : false,
      },
    });

    return places.map((place) => {
      const averageRating = place.reviews.length > 0
        ? place.reviews.reduce((total, review) => total + review.rating, 0) / place.reviews.length
        : null;
      const categoryMatches = place.categories.filter(({ category }) => preferredCategoryIds.has(category.id)).length;

      return {
        ...place,
        averageRating,
        isFavorite: place.favorites && place.favorites.length > 0,
        recommendationScore: categoryMatches * 10 + (averageRating ?? 0),
      };
    }).sort((left, right) => {
      const scoreDifference = right.recommendationScore - left.recommendationScore;
      if (scoreDifference !== 0) return scoreDifference;
      return right.createdAt.getTime() - left.createdAt.getTime();
    }).slice(0, 12).map(({ recommendationScore: _recommendationScore, ...place }) => place);
  } catch (error) {
    console.error("Erreur getRecommendations:", error);
    return [];
  }
}
