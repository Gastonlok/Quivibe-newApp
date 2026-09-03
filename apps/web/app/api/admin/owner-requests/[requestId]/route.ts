import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOwnerRequestStatusEmail } from "@/lib/email";

const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().trim().max(1000).optional(),
});

type Context = { params: Promise<{ requestId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const parsed = decisionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
    }

    const { requestId } = await params;
    const existing = await prisma.ownerRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.ownerRequest.update({
        where: { id: requestId },
        data: {
          status: parsed.data.status,
          adminNote: parsed.data.adminNote || null,
          reviewedAt: now,
          reviewedBy: session.user.id,
        },
      });

      await tx.user.update({
        where: { id: existing.user.id },
        data: {
          ownerStatus: parsed.data.status,
          ownerVerifiedAt: parsed.data.status === "APPROVED" ? now : null,
          role: parsed.data.status === "APPROVED" ? "OWNER" : existing.user.role,
        },
      });

      return updatedRequest;
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
    await sendOwnerRequestStatusEmail(
      existing.user.email,
      existing.user.name,
      existing.placeName,
      parsed.data.status,
      parsed.data.adminNote,
      appUrl,
    ).catch((emailError) => {
      console.error("Notification propriétaire non envoyée:", emailError);
    });

    return NextResponse.json({ request: result });
  } catch (error) {
    console.error("Erreur de traitement de la demande propriétaire:", error);
    return NextResponse.json({ error: "Impossible de traiter la demande" }, { status: 500 });
  }
}
