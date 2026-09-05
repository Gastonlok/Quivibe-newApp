import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccountToken } from "@/lib/account-tokens";
import { sendEmailVerificationEmail } from "@/lib/email";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caracteres.")
    .max(80),
  email: z
    .string()
    .trim()
    .email("Saisissez une adresse email valide.")
    .max(255),
  image: z.union([
    z.string().trim().url("Saisissez une URL valide."),
    z.literal(""),
  ]),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez etre connecte pour modifier votre profil." },
      { status: 401 },
    );
  }

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Certains champs sont invalides.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, email, image } = parsed.data;
  try {
    const verificationRequired =
      email.toLowerCase() !== session.user.email.toLowerCase();
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email: email.toLowerCase(),
        image: image || null,
        ...(verificationRequired ? { emailVerified: null } : {}),
      },
      select: { name: true, email: true, image: true },
    });
    let verificationSent = false;
    if (verificationRequired) {
      try {
        const token = await createAccountToken(
          "email-verification",
          user.email,
        );
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.AUTH_URL ||
          "http://localhost:3000";
        verificationSent = (
          await sendEmailVerificationEmail(
            user.email,
            user.name,
            `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          )
        ).success;
      } catch {
        /* Profile is saved; the UI reports the verification delivery failure. */
      }
    }
    return NextResponse.json({ user, verificationRequired, verificationSent });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Cette adresse email est deja utilisee." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "La mise a jour du profil a echoue." },
      { status: 500 },
    );
  }
}
