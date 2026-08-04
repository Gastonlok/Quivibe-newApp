// apps/web/app/api/owners/contact/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      establishmentName,
      contactName,
      email,
      phone,
      address,
      establishmentType,
      message
    } = body;

    // Validation
    if (!establishmentName || !contactName || !email || !phone || !establishmentType) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Ici vous pouvez :
    // 1. Envoyer un email (via Resend, SendGrid, etc.)
    // 2. Sauvegarder dans la base de données
    // 3. Envoyer une notification à l'admin

    console.log("📩 Nouvelle demande de partenariat:", {
      établissement: establishmentName,
      type: establishmentType,
      contact: contactName,
      email,
      phone,
      address,
      message,
    });

    // TODO: Envoyer un email de confirmation
    // TODO: Sauvegarder la demande en base

    return NextResponse.json(
      { message: "Demande envoyée avec succès" },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
