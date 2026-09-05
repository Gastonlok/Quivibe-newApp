import { NextResponse } from "next/server";
import { NewsletterError } from "./service";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new NewsletterError("Requête non autorisée.", 403);
}
export async function smallJson(request: Request) {
  if (Number(request.headers.get("content-length")) > 16000)
    throw new NewsletterError("Formulaire trop volumineux.", 413);
  const text = await request.text();
  if (text.length > 16000)
    throw new NewsletterError("Formulaire trop volumineux.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new NewsletterError("Formulaire invalide.");
  }
}
export function newsletterFailure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof NewsletterError
          ? error.message
          : "Le service est momentanément indisponible. Réessayez.",
    },
    { status: error instanceof NewsletterError ? error.status : 503 },
  );
}
