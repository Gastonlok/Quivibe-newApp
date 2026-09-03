import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type AccountTokenPurpose = "email-verification" | "password-reset";

function identifier(purpose: AccountTokenPurpose, email: string) {
  return `${purpose}:${email.toLowerCase()}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccountToken(purpose: AccountTokenPurpose, email: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenIdentifier = identifier(purpose, email);

  await prisma.verificationToken.deleteMany({ where: { identifier: tokenIdentifier } });
  await prisma.verificationToken.create({
    data: {
      identifier: tokenIdentifier,
      token: hashToken(token),
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return token;
}

export async function consumeAccountToken(purpose: AccountTokenPurpose, token: string) {
  const hashedToken = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { token: hashedToken } });

  if (!record || !record.identifier.startsWith(`${purpose}:`) || record.expires <= new Date()) {
    return null;
  }

  await prisma.verificationToken.delete({ where: { token: hashedToken } });
  return record.identifier.slice(`${purpose}:`.length);
}
