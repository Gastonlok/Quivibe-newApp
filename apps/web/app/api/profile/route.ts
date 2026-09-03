import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caracteres.").max(80),
  email: z.string().trim().email("Saisissez une adresse email valide.").max(255),
  image: z.union([z.string().trim().url("Saisissez une URL valide."), z.literal("")]),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez etre connecte pour modifier votre profil." }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Certains champs sont invalides.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, image } = parsed.data;
  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email, image: image || null },
      select: { name: true, email: true, image: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Cette adresse email est deja utilisee." }, { status: 409 });
    }
    return NextResponse.json({ error: "La mise a jour du profil a echoue." }, { status: 500 });
  }
}
