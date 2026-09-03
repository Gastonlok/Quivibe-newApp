import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAccountToken } from "@/lib/account-tokens";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string().min(1), password: z.string().min(8) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caracteres." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const email = await consumeAccountToken("password-reset", parsed.data.token);
    if (!email) {
      return NextResponse.json({ error: "Ce lien est invalide ou a expire." }, { status: 400 });
    }

    await prisma.user.update({ where: { email }, data: { passwordHash } });
    return NextResponse.json(
      { message: "Votre mot de passe a ete mis a jour." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json(
      { error: "Impossible de mettre a jour le mot de passe pour le moment." },
      { status: 500 },
    );
  }
}
