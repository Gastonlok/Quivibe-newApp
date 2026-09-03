import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/features/reviews/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  try {
    const parsed = createReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Avis invalide" },
        { status: 400 },
      );
    }

    const place = await prisma.place.findFirst({
      where: { id: parsed.data.placeId, status: "APPROVED" },
      select: { id: true },
    });
    if (!place) {
      return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        authorId: session.user.id,
        placeId: place.id,
      },
      select: { id: true },
    });
    if (existingReview) {
      return NextResponse.json(
        { error: "Vous avez déjà publié un avis pour cet établissement" },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        authorId: session.user.id,
        placeId: place.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        status: "PENDING",
      },
      select: { id: true, status: true },
    });

    return NextResponse.json(
      {
        review,
        message: "Votre avis a été envoyé et sera publié après validation.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur de création d'avis:", error);
    return NextResponse.json({ error: "Impossible d'enregistrer l'avis" }, { status: 500 });
  }
}
