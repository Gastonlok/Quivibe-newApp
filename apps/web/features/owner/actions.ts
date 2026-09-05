"use server";

import { priceToMinor } from "@/features/reservations/pricing";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageCollaborators, getPlaceAccess } from "./access";
import { isMenuImageForPlace } from "./menu-image";
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
  if (!session?.user?.id) {
    return { error: "Acces reserve aux proprietaires." } as const;
  }

  const access = await getPlaceAccess(placeId);
  if (!access)
    return { error: "Etablissement introuvable ou non autorise." } as const;

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true, slug: true },
  });

  if (!place)
    return { error: "Etablissement introuvable ou non autorise." } as const;
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
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Informations invalides.",
    } satisfies ActionError;
  }

  const managed = await getManagedPlace(parsed.data.placeId);
  if ("error" in managed)
    return {
      success: false,
      error: managed.error || "Acces refuse.",
    } satisfies ActionError;

  const categoryIds = [...new Set(parsed.data.categoryIds)];
  const categoryCount = await prisma.category.count({
    where: { id: { in: categoryIds } },
  });
  if (categoryCount !== categoryIds.length) {
    return {
      success: false,
      error: "Une categorie selectionnee n'existe plus.",
    } satisfies ActionError;
  }

  const {
    placeId: _placeId,
    categoryIds: _categoryIds,
    phone,
    reservationPrice,
    ...data
  } = parsed.data;
  await prisma.place.update({
    where: { id: managed.place.id },
    data: {
      ...data,
      reservationPriceMinor: priceToMinor(reservationPrice),
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

export async function updateOwnerPlaceMenuAction(
  raw: OwnerPlaceMenuUpdateInput,
) {
  const parsed = ownerPlaceMenuUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Menu invalide.",
    } satisfies ActionError;
  }

  const managed = await getManagedPlace(parsed.data.placeId);
  if ("error" in managed)
    return {
      success: false,
      error: managed.error || "Acces refuse.",
    } satisfies ActionError;

  if (
    parsed.data.items.some(
      (item) =>
        item.imageUrl && !isMenuImageForPlace(item.imageUrl, managed.place.id),
    )
  ) {
    return {
      success: false,
      error: "Ajoutez les photos depuis le menu de cet établissement.",
    } satisfies ActionError;
  }

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
        imageUrl: item.imageUrl || null,
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
    return {
      success: false,
      error: "Lien d'image invalide.",
    } satisfies ActionError;
  }

  const managed = await getManagedPlace(parsed.data.placeId);
  if ("error" in managed)
    return {
      success: false,
      error: managed.error || "Acces refuse.",
    } satisfies ActionError;

  const existing = await prisma.media.findFirst({
    where: { placeId: managed.place.id, url: parsed.data.url },
    select: { id: true },
  });
  if (existing)
    return {
      success: false,
      error: "Cette image est deja dans votre galerie.",
    } satisfies ActionError;

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

export async function uploadOwnerPlaceImageAction(
  placeId: string,
  formData: FormData,
) {
  const managed = await getManagedPlace(placeId);
  if ("error" in managed)
    return {
      success: false,
      error: managed.error || "Acces refuse.",
    } satisfies ActionError;

  const image = formData.get("image");
  const altText = String(formData.get("altText") || "")
    .trim()
    .slice(0, 160);
  if (!(image instanceof File) || image.size === 0) {
    return {
      success: false,
      error: "Choisissez une image a envoyer.",
    } satisfies ActionError;
  }
  if (!image.type.startsWith("image/")) {
    return {
      success: false,
      error: "Seuls les fichiers image sont acceptes.",
    } satisfies ActionError;
  }
  if (image.size > 10 * 1024 * 1024) {
    return {
      success: false,
      error: "L'image ne doit pas depasser 10 Mo.",
    } satisfies ActionError;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      error:
        "Configurez Cloudinary dans .env pour envoyer un fichier, ou ajoutez une image par lien.",
    } satisfies ActionError;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  const buffer = Buffer.from(await image.arrayBuffer());
  const upload = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "quivibe/places", resource_type: "image" },
        (error, result) =>
          error || !result
            ? reject(error || new Error("Upload impossible."))
            : resolve(result),
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

export async function deleteOwnerPlaceImageAction(
  placeId: string,
  mediaId: string,
) {
  const managed = await getManagedPlace(placeId);
  if ("error" in managed)
    return {
      success: false,
      error: managed.error || "Acces refuse.",
    } satisfies ActionError;

  const media = await prisma.media.findFirst({
    where: { id: mediaId, placeId: managed.place.id },
    select: { id: true },
  });
  if (!media)
    return {
      success: false,
      error: "Image introuvable.",
    } satisfies ActionError;

  await prisma.media.delete({ where: { id: media.id } });
  refreshOwnerPlace(managed.place);
  return { success: true as const };
}

export async function invitePlaceCollaboratorAction(
  placeId: string,
  email: string,
  role: "MANAGER" | "EDITOR",
) {
  const access = await getPlaceAccess(placeId);
  if (!canManageCollaborators(access))
    return {
      success: false as const,
      error: "Seul le proprietaire ou un responsable peut gerer l'equipe.",
    };

  const collaborator = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true },
  });
  if (!collaborator)
    return {
      success: false as const,
      error: "Ce compte Quivibe est introuvable.",
    };

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { ownerId: true, slug: true },
  });
  if (!place || place.ownerId === collaborator.id)
    return {
      success: false as const,
      error: "Ce compte est deja proprietaire de cet etablissement.",
    };

  await prisma.placeCollaborator.upsert({
    where: { placeId_userId: { placeId, userId: collaborator.id } },
    create: { placeId, userId: collaborator.id, role },
    update: { role },
  });
  refreshOwnerPlace({ id: placeId, slug: place.slug });
  return { success: true as const };
}

export async function removePlaceCollaboratorAction(
  placeId: string,
  collaboratorId: string,
) {
  const access = await getPlaceAccess(placeId);
  if (!canManageCollaborators(access))
    return { success: false as const, error: "Acces refuse." };

  const collaborator = await prisma.placeCollaborator.findFirst({
    where: { id: collaboratorId, placeId },
    select: { id: true },
  });
  if (!collaborator)
    return { success: false as const, error: "Collaborateur introuvable." };
  await prisma.placeCollaborator.delete({ where: { id: collaborator.id } });
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { slug: true },
  });
  if (place) refreshOwnerPlace({ id: placeId, slug: place.slug });
  return { success: true as const };
}

export async function saveOwnerReviewResponseAction(
  reviewId: string,
  body: string,
) {
  const session = await auth();
  const text = body.trim();
  if (!session?.user?.id || text.length < 2 || text.length > 1_000) {
    return {
      success: false as const,
      error: "La reponse doit contenir entre 2 et 1 000 caracteres.",
    };
  }
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { placeId: true, place: { select: { slug: true } } },
  });
  if (!review || !(await getPlaceAccess(review.placeId)))
    return {
      success: false as const,
      error: "Avis introuvable ou non autorise.",
    };

  await prisma.ownerReviewResponse.upsert({
    where: { reviewId },
    create: { reviewId, authorId: session.user.id, body: text },
    update: { body: text, authorId: session.user.id },
  });
  refreshOwnerPlace({ id: review.placeId, slug: review.place.slug });
  return { success: true as const };
}

export async function createOwnerEventAction(raw: {
  placeId: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
}) {
  const access = await getPlaceAccess(raw.placeId);
  if (!access) return { success: false as const, error: "Acces refuse." };
  const title = raw.title.trim();
  const description = raw.description.trim();
  const startDate = new Date(raw.startDate);
  const endDate = raw.endDate ? new Date(raw.endDate) : null;
  if (
    title.length < 3 ||
    description.length < 10 ||
    Number.isNaN(startDate.getTime()) ||
    (endDate && (Number.isNaN(endDate.getTime()) || endDate <= startDate))
  ) {
    return {
      success: false as const,
      error: "Verifiez le titre, la description et les dates de l'evenement.",
    };
  }
  const place = await prisma.place.findUnique({
    where: { id: raw.placeId },
    select: { slug: true },
  });
  if (!place)
    return { success: false as const, error: "Etablissement introuvable." };
  const session = await auth();
  await prisma.event.create({
    data: {
      placeId: raw.placeId,
      organizerId: session!.user.id,
      title,
      description,
      startDate,
      endDate,
      status: "APPROVED",
    },
  });
  refreshOwnerPlace({ id: raw.placeId, slug: place.slug });
  revalidatePath("/events");
  return { success: true as const };
}

export async function deleteOwnerEventAction(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, placeId: true, place: { select: { slug: true } } },
  });
  if (!event || !(await getPlaceAccess(event.placeId)))
    return {
      success: false as const,
      error: "Evenement introuvable ou non autorise.",
    };

  await prisma.event.delete({ where: { id: event.id } });
  refreshOwnerPlace({ id: event.placeId, slug: event.place.slug });
  revalidatePath("/events");
  return { success: true as const };
}
