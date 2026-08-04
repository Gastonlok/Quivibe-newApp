// apps/web/features/favorites/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(placeId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    const userId = session.user.id;

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: {
          userId_placeId: {
            userId,
            placeId,
          },
        },
      });

      revalidatePath(`/places/${placeId}`);
      return { success: true, action: "removed" };
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          placeId,
        },
      });

      revalidatePath(`/places/${placeId}`);
      return { success: true, action: "added" };
    }
  } catch (error) {
    console.error("Erreur toggleFavorite:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

// ✅ Exporté comme getFavorites (pour compatibilité)
export async function getFavorites() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Non authentifié", favorites: [] };
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        place: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const favoritesWithRating = favorites.map((fav) => {
      const place = fav.place;
      const averageRating = place.reviews.length > 0
        ? place.reviews.reduce((acc, r) => acc + r.rating, 0) / place.reviews.length
        : null;

      return {
        ...fav,
        place: {
          ...place,
          averageRating,
        },
      };
    });

    return { success: true, favorites: favoritesWithRating };
  } catch (error) {
    console.error("Erreur getFavorites:", error);
    return { success: false, error: "Une erreur est survenue", favorites: [] };
  }
}

// ✅ Alias pour listFavoritesAction (même fonction)
export async function listFavoritesAction() {
  const result = await getFavorites();
  return result.success ? result.favorites : [];
}

export async function getFavoriteCount() {
  try {
    const session = await auth();
    if (!session?.user) {
      return 0;
    }

    const count = await prisma.favorite.count({
      where: {
        userId: session.user.id,
      },
    });

    return count;
  } catch (error) {
    console.error("Erreur getFavoriteCount:", error);
    return 0;
  }
}

export async function isFavorite(placeId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return false;
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId: session.user.id,
          placeId,
        },
      },
    });

    return !!favorite;
  } catch (error) {
    console.error("Erreur isFavorite:", error);
    return false;
  }
}
