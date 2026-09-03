import { NextResponse } from "next/server";
import { z } from "zod";
import { createAccountToken } from "@/lib/account-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { email: true, name: true },
    });

    if (user) {
      const token = await createAccountToken("password-reset", user.email);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const delivery = await sendPasswordResetEmail(
        user.email,
        user.name,
        `${appUrl}/reset-password?token=${encodeURIComponent(token)}`,
      );

      if (!delivery.success) {
        console.error("Password reset email delivery failed:", delivery.error);
      }
    }

    // Same response whether or not the address exists to prevent account discovery.
    return NextResponse.json(
      { message: "Si un compte existe, un email de reinitialisation a ete envoye." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json(
      { error: "Impossible de traiter cette demande pour le moment." },
      { status: 500 },
    );
  }
}
