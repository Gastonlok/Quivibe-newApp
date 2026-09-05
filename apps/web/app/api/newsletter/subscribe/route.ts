import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscriptionSchema } from "@/features/newsletter/schema";
import { subscribe, NewsletterError } from "@/features/newsletter/service";
import {
  sameOrigin,
  smallJson,
  newsletterFailure,
} from "@/features/newsletter/http";
import { deliverNewsletter } from "@/features/newsletter/delivery";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = subscriptionSchema.safeParse(await smallJson(request));
    if (!input.success)
      throw new NewsletterError(
        input.error.issues[0]?.message || "Formulaire invalide.",
      );
    if (!input.data.website) {
      const ip = (
        request.headers.get("x-vercel-forwarded-for") ||
        request.headers.get("x-forwarded-for") ||
        "unknown"
      )
        .split(",")[0]
        .trim();
      const id = await subscribe(prisma, input.data.email, ip);
      if (id)
        after(async () => {
          await deliverNewsletter(prisma, { ids: [id] }).catch(() => {});
        });
    }
    return NextResponse.json({
      message:
        "Votre demande est enregistrée. Si votre adresse n’est pas encore confirmée, vous recevrez un e-mail pour finaliser l’inscription. Pensez à vérifier vos indésirables.",
    });
  } catch (error) {
    return newsletterFailure(error);
  }
}
