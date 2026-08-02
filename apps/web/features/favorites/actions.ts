"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addFavoriteAction(
  placeId: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Connecte-toi pour ajouter un favori" };
  }

  await prisma.favorite.upsert({
    where: { userId_placeId: { userId: session.user.id, placeId } },
    update: {},
    create: { userId: session.user.id, placeId },
  });

  revalidatePath("/favoris");
  return { success: true, data: null };
}

export async function removeFavoriteAction(
  placeId: string
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Connecte-toi pour gérer tes favoris" };
  }

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, placeId },
  });

  revalidatePath("/favoris");
  return { success: true, data: null };
}

export async function isFavoriteAction(placeId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const favorite = await prisma.favorite.findUnique({
    where: { userId_placeId: { userId: session.user.id, placeId } },
  });

  return !!favorite;
}

export async function listFavoritesAction() {
  const session = await auth();
  if (!session?.user) return [];

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { place: true },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((favorite) => favorite.place);
}
