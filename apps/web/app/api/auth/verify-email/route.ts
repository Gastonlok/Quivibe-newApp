import { NextResponse } from "next/server";
import { consumeAccountToken } from "@/lib/account-tokens";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (!token) return NextResponse.redirect(`${appUrl}/login?verified=invalid`);

  const email = await consumeAccountToken("email-verification", token);
  if (!email) return NextResponse.redirect(`${appUrl}/login?verified=invalid`);

  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
    select: { email: true, name: true },
  });

  await sendWelcomeEmail(user.email, user.name, appUrl);
  return NextResponse.redirect(`${appUrl}/login?verified=true`);
}
