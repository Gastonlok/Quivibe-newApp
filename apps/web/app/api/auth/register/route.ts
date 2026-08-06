// apps/web/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/features/auth/schema";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📝 Tentative d'inscription:", body.email);

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      console.log("❌ Validation échouée:", parsed.error.errors);
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("⚠️ Utilisateur déjà existant:", email);
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: "USER",
      },
    });

    console.log("✅ Utilisateur créé:", user.email);

    // ✅ ENVOYER L'EMAIL DE BIENVENUE
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      console.log("📧 Envoi de l'email de bienvenue à:", email);

      const result = await sendWelcomeEmail(email, name, appUrl);

      if (result.success) {
        console.log("✅ Email de bienvenue envoyé avec succès !");
      } else {
        console.error("❌ Erreur lors de l'envoi de l'email:", result.error);
      }
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
      // On continue même si l'email échoue
    }

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erreur d'inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}
