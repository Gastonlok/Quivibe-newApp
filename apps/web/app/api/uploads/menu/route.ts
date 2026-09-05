import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlaceAccess } from "@/features/owner/access";
import {
  isMenuImageContent,
  isMenuImageForPlace,
  MENU_IMAGE_MAX_BYTES,
  MENU_IMAGE_TYPES,
} from "@/features/owner/menu-image";

export const maxDuration = 30;
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin)
    return NextResponse.json(
      { error: "Origine non autorisée." },
      { status: 403 },
    );
  const placeId = url.searchParams.get("placeId") || "";
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(placeId))
    return NextResponse.json(
      { error: "Établissement invalide." },
      { status: 400 },
    );
  if (!(await getPlaceAccess(placeId)))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  if (
    !(await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    }))
  )
    return NextResponse.json(
      { error: "Établissement introuvable." },
      { status: 404 },
    );
  const limit = MENU_IMAGE_MAX_BYTES + 65536;
  if (Number(request.headers.get("content-length")) > limit)
    return NextResponse.json(
      { error: "L’image ne doit pas dépasser 3 Mo." },
      { status: 413 },
    );
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME,
    apiKey = process.env.CLOUDINARY_API_KEY,
    apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret)
    return NextResponse.json(
      { error: "L’envoi de photos est momentanément indisponible." },
      { status: 503 },
    );
  try {
    // Bound the multipart body even when Content-Length is absent.
    const reader = request.body?.getReader();
    if (!reader)
      return NextResponse.json(
        { error: "Choisissez une photo." },
        { status: 400 },
      );
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return NextResponse.json(
          { error: "L’image ne doit pas dépasser 3 Mo." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks);
    const form = await new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body,
    }).formData();
    const image = form.get("image");
    if (
      !(image instanceof File) ||
      !image.size ||
      image.size > MENU_IMAGE_MAX_BYTES ||
      !MENU_IMAGE_TYPES.includes(image.type)
    )
      return NextResponse.json(
        { error: "Choisissez une image JPEG, PNG ou WebP de 3 Mo maximum." },
        { status: 400 },
      );
    const bytes = Buffer.from(await image.arrayBuffer());
    if (!isMenuImageContent(bytes, image.type))
      return NextResponse.json(
        {
          error:
            "Le contenu du fichier ne correspond pas à une photo acceptée.",
        },
        { status: 400 },
      );
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    const upload = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `quivibe/menus/${placeId}`,
            public_id: randomUUID(),
            resource_type: "image",
            format: "webp",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            overwrite: false,
            timeout: 20000,
            transformation: [{ width: 1200, height: 1200, crop: "limit" }],
          },
          (error, result) =>
            error || !result
              ? reject(error || new Error("Upload failed"))
              : resolve(result),
        )
        .end(bytes);
    });
    if (!isMenuImageForPlace(upload.secure_url, placeId))
      throw new Error("Unexpected image URL");
    return NextResponse.json({ url: upload.secure_url }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "La photo n’a pas pu être envoyée. Réessayez avec une image JPEG, PNG ou WebP.",
      },
      { status: 502 },
    );
  }
}
