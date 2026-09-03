import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ownerRequestSchema = z.object({
  establishmentName: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().max(250).optional(),
  establishmentType: z.string().trim().min(2).max(60),
  message: z.string().trim().max(1200).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        code: "UNAUTHENTICATED",
        error: "Créez un compte ou connectez-vous avant d'envoyer votre demande.",
      },
      { status: 401 },
    );
  }

  try {
    const parsed = ownerRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Formulaire invalide" },
        { status: 400 },
      );
    }

    const pending = await prisma.ownerRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      select: { id: true },
    });
    if (pending) {
      return NextResponse.json(
        { error: "Une demande est déjà en cours de traitement." },
        { status: 409 },
      );
    }

    const description = [
      `Type: ${parsed.data.establishmentType}`,
      `Contact: ${parsed.data.contactName} — ${parsed.data.email}`,
      parsed.data.message || "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const ownerRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.ownerRequest.create({
        data: {
          userId: session.user.id,
          placeName: parsed.data.establishmentName,
          placeAddress: parsed.data.address || "Adresse à confirmer",
          placePhone: parsed.data.phone,
          description: description || null,
          status: "PENDING",
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          ownerStatus: "PENDING",
          ownerRequest: parsed.data.message || null,
        },
      });

      return created;
    });

    return NextResponse.json(
      { message: "Demande envoyée avec succès", requestId: ownerRequest.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur de demande propriétaire:", error);
    return NextResponse.json({ error: "Impossible d'envoyer la demande" }, { status: 500 });
  }
}
