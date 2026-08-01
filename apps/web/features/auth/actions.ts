"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema } from "@/features/auth/schema";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function registerAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Champs invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return {
      success: false,
      error: "Un compte existe déjà avec cette adresse email",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return { success: true, data: { id: user.id } };
}

export async function loginAction(
  input: unknown
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Champs invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Email ou mot de passe incorrect" };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
