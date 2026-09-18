import {
  GET as messages,
  PATCH as readMessage,
} from "@/app/api/messages/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateCredentials } from "@/lib/auth";
import { mobileIdentity } from "@/features/mobile/context";
import {
  allowLogin,
  issueSession,
  readSession,
  revokeSession,
} from "@/features/mobile/session";
import { restaurantSearchSchema } from "@/features/places/search-params";
import { searchRestaurants } from "@/features/places/search-service";
import {
  restaurantSearchOptions,
  restaurantSuggestions,
} from "@/features/places/search-actions";
import { getPlaceBySlug } from "@/features/places/actions";
import { placeMediaOrder } from "@/features/places/media-order";
import {
  getAvailableSlotsAction,
  createReservationAction,
  cancelMyReservationAction,
} from "@/features/reservations/actions";
import { createReservationSchema } from "@/features/reservations/schema";
import { revalidatePath } from "next/cache";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as resetPassword } from "@/app/api/auth/request-password-reset/route";
import { POST as createReview } from "@/app/api/reviews/route";
import { PATCH as updateProfile } from "@/app/api/profile/route";
import { POST as avatarSignature } from "@/app/api/uploads/avatar/route";
import { POST as askAI } from "@/app/api/quivibe-ai/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const pageSchema = z.coerce.number().int().min(1).max(10000);
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });
const denied = () =>
  json({ error: "Connexion requise.", code: "UNAUTHENTICATED" }, 401);
const notFound = () => json({ error: "Introuvable." }, 404);
const action = (value: { success: boolean; error?: string; code?: string }) =>
  json(
    value,
    value.success ? 200 : value.code === "UNAUTHENTICATED" ? 401 : 400,
  );
const cardSelect = {
  id: true,
  slug: true,
  name: true,
  neighborhood: true,
  priceRange: true,
  reservationsEnabled: true,
  media: {
    take: 2,
    orderBy: placeMediaOrder,
    select: { url: true, altText: true },
  },
  categories: { select: { category: { select: { name: true } } } },
} as const;
const eventSelect = {
  id: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  media: { take: 1, select: { url: true, altText: true } },
  place: {
    select: { ...cardSelect, address: true, latitude: true, longitude: true },
  },
} as const;

async function route(request: Request, context: Context) {
  const { path } = await context.params;
  const [resource, id, sub] = path;
  const url = new URL(request.url),
    method = request.method;
  const session = await readSession(request);
  return mobileIdentity.run(session, async () => {
    if (resource === "session") {
      if (method === "GET") return session ? json(session) : denied();
      if (method === "DELETE") {
        await revokeSession(request);
        return json({ success: true });
      }
      if (method === "POST") {
        const body = await request.json();
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        if (
          !allowLogin("ip:" + ip) ||
          !allowLogin("email:" + String(body?.email || "").toLowerCase())
        )
          return json(
            { error: "Trop de tentatives. Réessaie dans 15 minutes." },
            429,
          );
        try {
          const user = await authenticateCredentials(body);
          if (!user)
            return json({ error: "Email ou mot de passe incorrect." }, 401);
          return json({ ...(await issueSession(user.id)), user });
        } catch (error) {
          const code = (error as { code?: string }).code;
          return json(
            {
              error:
                code === "email-not-verified"
                  ? "Vérifie ton adresse email avant de te connecter."
                  : "Connexion indisponible.",
              code,
            },
            code === "email-not-verified" ? 403 : 503,
          );
        }
      }
    }
    if (resource === "register" && method === "POST") return register(request);
    if (resource === "password-reset" && method === "POST")
      return resetPassword(request);
    if (resource === "ai" && method === "POST") return askAI(request);
    if (resource === "search-options" && method === "GET")
      return json(await restaurantSearchOptions());
    if (resource === "suggestions" && method === "GET")
      return json(await restaurantSuggestions(url.searchParams.get("q") || ""));
    if (resource === "venues" && method === "GET") {
      if (!id) {
        const filters = restaurantSearchSchema.parse(
          Object.fromEntries(url.searchParams),
        );
        return json(await searchRestaurants(prisma, filters, session?.user.id));
      }
      if (sub === "availability")
        return action(
          await getAvailableSlotsAction({
            placeId: id,
            date: url.searchParams.get("date") || "",
            partySize: Number(url.searchParams.get("partySize") || 2),
          }),
        );
      const place = await getPlaceBySlug(id);
      if (!place) return notFound();
      // Explicit public DTO. Never serialize owner email or internal capacity.
      return json({
        id: place.id,
        slug: place.slug,
        name: place.name,
        description: place.description,
        neighborhood: place.neighborhood,
        address: place.address,
        phone: place.phone,
        latitude: place.latitude,
        longitude: place.longitude,
        priceRange: place.priceRange,
        averageRating: place.averageRating,
        reviewCount: place.reviews.length,
        isFavorite: place.isFavorite,
        reservationsEnabled: place.reservationsEnabled,
        maxPartySize: place.maxPartySize,
        media: place.media.map(({ url, altText }) => ({ url, altText })),
        categories: place.categories.map(({ category }) => ({
          category: { name: category.name },
        })),
        menuItems: place.menuItems.map(
          ({ id, name, description, price, category, imageUrl }) => ({
            id,
            name,
            description,
            price,
            category,
            imageUrl,
          }),
        ),
      });
    }
    const page = pageSchema.parse(url.searchParams.get("page") || 1),
      take = 12,
      skip = (page - 1) * take;
    if (resource === "events" && method === "GET") {
      if (id) {
        const event = await prisma.event.findFirst({
          where: { id, status: "APPROVED", place: { status: "APPROVED" } },
          select: eventSelect,
        });
        return event ? json(event) : notFound();
      }
      const from = url.searchParams.get("from"),
        to = url.searchParams.get("to");
      const dates = z
        .object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
        })
        .parse({ from: from || undefined, to: to || undefined });
      const where = {
        status: "APPROVED",
        place: { status: "APPROVED" },
        startDate: {
          gte: dates.from ? new Date(dates.from) : new Date(),
          ...(dates.to ? { lt: new Date(dates.to) } : {}),
        },
      };
      const [items, total] = await Promise.all([
        prisma.event.findMany({
          where,
          select: eventSelect,
          orderBy: [{ startDate: "asc" }, { id: "asc" }],
          take,
          skip,
        }),
        prisma.event.count({ where }),
      ]);
      return json({ items, page, total, totalPages: Math.ceil(total / take) });
    }
    if (resource === "reviews" && method === "GET" && id !== "mine") {
      if (!id) return notFound();
      const where = {
        placeId: id,
        status: "APPROVED",
        place: { status: "APPROVED" },
      };
      const [items, total] = await Promise.all([
        prisma.review.findMany({
          where,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: { select: { name: true } },
            response: { select: { body: true } },
          },
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        }),
        prisma.review.count({ where }),
      ]);
      return json({ items, page, total, totalPages: Math.ceil(total / take) });
    }
    if (!session) return denied();
    if (resource === "messages" && method === "GET") return messages(request);
    if (resource === "messages" && method === "PATCH")
      return readMessage(request);
    if (resource === "profile" && method === "PATCH")
      return updateProfile(request);
    if (resource === "avatar" && method === "POST") return avatarSignature();
    if (resource === "reviews" && method === "POST")
      return createReview(request);
    if (resource === "reviews" && id === "mine" && method === "GET") {
      const where = { authorId: session.user.id };
      const [items, total] = await Promise.all([
        prisma.review.findMany({
          where,
          select: {
            id: true,
            rating: true,
            comment: true,
            status: true,
            createdAt: true,
            place: { select: { name: true, slug: true } },
          },
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        }),
        prisma.review.count({ where }),
      ]);
      return json({ items, page, total, totalPages: Math.ceil(total / take) });
    }
    if (resource === "favorites") {
      if (method === "GET") {
        const where = {
          userId: session.user.id,
          place: { status: "APPROVED" },
        };
        const [favorites, total] = await Promise.all([
          prisma.favorite.findMany({
            where,
            include: { place: { select: cardSelect } },
            take,
            skip,
            orderBy: [{ createdAt: "desc" }, { placeId: "asc" }],
          }),
          prisma.favorite.count({ where }),
        ]);
        const ids = favorites.map((f) => f.placeId);
        const ratings = await prisma.review.groupBy({
          by: ["placeId"],
          where: { placeId: { in: ids }, status: "APPROVED" },
          _avg: { rating: true },
          _count: { rating: true },
        });
        return json({
          items: favorites.map(({ place }) => ({
            ...place,
            isFavorite: true,
            averageRating:
              ratings.find((r) => r.placeId === place.id)?._avg.rating ?? null,
            reviewCount:
              ratings.find((r) => r.placeId === place.id)?._count.rating ?? 0,
          })),
          page,
          total,
          totalPages: Math.ceil(total / take),
        });
      }
      if (id && ["PUT", "DELETE"].includes(method)) {
        const place = await prisma.place.findFirst({
          where: { id, status: "APPROVED" },
          select: { slug: true },
        });
        if (!place) return notFound();
        const key = { userId: session.user.id, placeId: id };
        if (method === "PUT")
          await prisma.favorite.upsert({
            where: { userId_placeId: key },
            create: key,
            update: {},
          });
        else await prisma.favorite.deleteMany({ where: key });
        revalidatePath("/favorites");
        revalidatePath("/discover");
        revalidatePath("/places/" + place.slug);
        return json({ isFavorite: method === "PUT" });
      }
    }
    if (resource === "reservations") {
      if (method === "POST")
        return action(
          await createReservationAction(
            createReservationSchema.parse(await request.json()),
          ),
        );
      if (id && method === "DELETE")
        return action(await cancelMyReservationAction(id));
      if (method === "GET") {
        const group = z
          .enum(["upcoming", "past", "cancelled"])
          .parse(url.searchParams.get("group") || "upcoming");
        const where = {
          customerId: session.user.id,
          ...(id
            ? { reference: id }
            : group === "cancelled"
              ? { status: "CANCELLED" }
              : group === "past"
                ? { status: { not: "CANCELLED" }, dateTime: { lt: new Date() } }
                : {
                    status: { in: ["PENDING", "CONFIRMED"] },
                    dateTime: { gte: new Date() },
                  }),
        };
        const select = {
          id: true,
          reference: true,
          dateTime: true,
          partySize: true,
          status: true,
          reservationPriceMinor: true,
          reservationCurrency: true,
          place: { select: { ...cardSelect, address: true } },
        } as const;
        if (id) {
          const item = await prisma.reservation.findFirst({ where, select });
          return item ? json(item) : notFound();
        }
        const [items, total] = await Promise.all([
          prisma.reservation.findMany({
            where,
            select,
            take,
            skip,
            orderBy: [{ dateTime: "desc" }, { id: "asc" }],
          }),
          prisma.reservation.count({ where }),
        ]);
        return json({
          items,
          page,
          total,
          totalPages: Math.ceil(total / take),
        });
      }
    }
    return notFound();
  });
}
async function handle(request: Request, context: Context) {
  const origin = request.headers.get("origin");
  const allowed = (process.env.MOBILE_WEB_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ownOrigin = new URL(request.url).origin;
  if (origin && origin !== ownOrigin && !allowed.includes(origin))
    return json({ error: "Origine non autorisée." }, 403);
  let response: Response;
  try {
    if (Number(request.headers.get("content-length") || 0) > 20000)
      return json({ error: "Requête trop volumineuse." }, 413);
    response =
      request.method === "OPTIONS"
        ? new Response(null, { status: 204 })
        : await route(request, context);
  } catch (error) {
    if (!(error instanceof z.ZodError) && !(error instanceof SyntaxError))
      console.error("Mobile API failure", {
        name: (error as Error)?.name,
        code: (error as { code?: string })?.code,
      });
    response =
      error instanceof z.ZodError || error instanceof SyntaxError
        ? json({ error: "Certains paramètres sont invalides." }, 400)
        : json({ error: "Le service est momentanément indisponible." }, 503);
  }
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "Origin");
  if (origin && (allowed.includes(origin) || origin === ownOrigin))
    response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  return response;
}
export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as OPTIONS,
};
