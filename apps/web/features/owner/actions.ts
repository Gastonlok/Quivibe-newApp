"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ownerMediaUrlSchema,
  ownerPlaceMenuUpdateSchema,
  ownerPlaceUpdateSchema,
  type OwnerPlaceMenuUpdateInput,
  type OwnerPlaceUpdateInput,
} from "./schema";

type ActionError = { success: false; error: string };

async function getManagedPlace(placeId: string) {
  const session = await auth();
  if (!session?.user?.id || !["OWNER", "ADMIN"].includes(session.user.role)) {
    return { error: "Acces reserve aux proprietaires." } as const;
  }

  const place = await prisma.place.findFirst({
    where:
      session.user.role === "ADMIN"
        ? { id: placeId }
        : { id: placeId, ownerId: session.user.id },
    select: { id: true, slug: true },
  });

  if (!place) return { error: "Etablissement introuvable ou non autorise." } as const;
  return { place } as const;
}

function refreshOwnerPlace(place: { id: string; slug: string }) {
  revalidatePath("/admin/places");
  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/analytics");
  revalidatePath(`/owner/places/${place.id}/edit`);
  revalidatePath(`/places/${place.slug}`);
}

export async function updateOwnerPlaceAction(raw: OwnerPlaceUpdateInput) {
  const parsed = ownerPlaceUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Informations invalides." } satisfies ActionError;
  }

  const managed = await getManagedPlace(parsed.data.placeId);
  if ("error" in managed) return { success: false, error: managed.error || "Acces refuse." } satisfies ActionError;

  const categoryIds = [...new Set(parsed.data.categoryIds)];
  const categoryCount = await prisma.category.count({ where: { id: { in: categoryIds } } });
  if (categoryCount !== categoryIds.length) {
    return { success: false, error: "Une categorie selectionnee n'existe plus." } satisfies ActionError;
  }

  const { placeId: _placeId, categoryIds: _categoryIds, phone, ...data } = parsed.data;
  await prisma.place.update({
    where: { id: managed.place.id },
    data: {
      ...data,
      phone: phone || null,
      categories: {
        deleteMany: {},
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });

  refreshOwnerPlace(managed.place);
  return { success: true as const };
}

export async function updateOwnerPlaceMenuAction(raw: OwnerPlaceMenuUpdateInput) {
  const parsed = ownerPlaceMenuUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Menu invalide." } satisfies ActionError;
  }

  const managed = await getManagedPlace(parsed.data.placeId);
  if ("error" in managed) return { success: false, error: managed.error || "Acces refuse." } satisfies ActionError;

  await prisma.$transaction([
    prisma.place.update({
      where: { id: managed.place.id },
      data: { menuVisible: parsed.data.menuVisible },
    }),
    prisma.menuItem.deleteMany({ where: { placeId: managed.place.id } }),
    prisma.menuItem.createMany({
      data: parsed.data.items.map((item, sortOrder) => ({
        placeId: managed.place.id,
        name: item.name,
        description: item.description || null,
        price: item.price || null,
        category: item.category || null,
        available: item.available,
        sortOrder,
      })),
    }),
  ]);

  refreshOwnerPlace(managed.place);
  return { success: true as const };
}

export async function addOwnerPlaceImageAction(raw: {
  placeId: string;
  url: string;
  altText?: string;
}) {
  const parsed = ownerMediaUrlSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Lien d'image invalide." } satisfies ActionError;
  }

  const managed = await getManagedPlace(parsed.data.placeId);
  if ("error" in managed) return { success: false, error: managed.error || "Acces refuse." } satisfies ActionError;

  const existing = await prisma.media.findFirst({
    where: { placeId: managed.place.id, url: parsed.data.url },
    select: { id: true },
  });
  if (existing) return { success: false, error: "Cette image est deja dans votre galerie." } satisfies ActionError;

  const media = await prisma.media.create({
    data: {
      placeId: managed.place.id,
      url: parsed.data.url,
      altText: parsed.data.altText || null,
    },
    select: { id: true, url: true, altText: true },
  });

  refreshOwnerPlace(managed.place);
  return { success: true as const, media };
}

export async function uploadOwnerPlaceImageAction(placeId: string, formData: FormData) {
  const managed = await getManagedPlace(placeId);
  if ("error" in managed) return { success: false, error: managed.error || "Acces refuse." } satisfies ActionError;

  const image = formData.get("image");
  const altText = String(formData.get("altText") || "").trim().slice(0, 160);
  if (!(image instanceof File) || image.size === 0) {
    return { success: false, error: "Choisissez une image a envoyer." } satisfies ActionError;
  }
  if (!image.type.startsWith("image/")) {
    return { success: false, error: "Seuls les fichiers image sont acceptes." } satisfies ActionError;
  }
  if (image.size > 10 * 1024 * 1024) {
    return { success: false, error: "L'image ne doit pas depasser 10 Mo." } satisfies ActionError;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      error: "Configurez Cloudinary dans .env pour envoyer un fichier, ou ajoutez une image par lien.",
    } satisfies ActionError;
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  const buffer = Buffer.from(await image.arrayBuffer());
  const upload = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "quivibe/places", resource_type: "image" },
        (error, result) => (error || !result ? reject(error || new Error("Upload impossible.")) : resolve(result)),
      )
      .end(buffer);
  });

  const media = await prisma.media.create({
    data: {
      placeId: managed.place.id,
      url: upload.secure_url,
      altText: altText || `${managed.place.slug} - image`,
    },
    select: { id: true, url: true, altText: true },
  });

  refreshOwnerPlace(managed.place);
  return { success: true as const, media };
}

export async function deleteOwnerPlaceImageAction(placeId: string, mediaId: string) {
  const managed = await getManagedPlace(placeId);
  if ("error" in managed) return { success: false, error: managed.error || "Acces refuse." } satisfies ActionError;

  const media = await prisma.media.findFirst({
    where: { id: mediaId, placeId: managed.place.id },
    select: { id: true },
  });
  if (!media) return { success: false, error: "Image introuvable." } satisfies ActionError;

  await prisma.media.delete({ where: { id: media.id } });
  refreshOwnerPlace(managed.place);
  return { success: true as const };
}
