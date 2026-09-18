import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  session: vi.fn(),
  search: vi.fn(),
  create: vi.fn(),
  slots: vi.fn(),
  cancel: vi.fn(),
  find: vi.fn(),
  count: vi.fn(),
  credentials: vi.fn(),
}));
vi.mock("@/features/mobile/session", () => ({
  readSession: m.session,
  issueSession: vi.fn(),
  revokeSession: vi.fn(),
  allowLogin: () => true,
}));
vi.mock("@/lib/auth", () => ({ authenticateCredentials: m.credentials }));
vi.mock("@/lib/prisma", () => ({
  prisma: { reservation: { findMany: m.find, count: m.count } },
}));
vi.mock("@/features/places/search-service", () => ({
  searchRestaurants: m.search,
}));
vi.mock("@/features/places/search-actions", () => ({
  restaurantSearchOptions: vi.fn(),
  restaurantSuggestions: vi.fn(),
}));
vi.mock("@/features/places/actions", () => ({ getPlaceBySlug: vi.fn() }));
vi.mock("@/features/reservations/actions", () => ({
  createReservationAction: m.create,
  getAvailableSlotsAction: m.slots,
  cancelMyReservationAction: m.cancel,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/api/auth/register/route", () => ({ POST: vi.fn() }));
vi.mock("@/app/api/auth/request-password-reset/route", () => ({
  POST: vi.fn(),
}));
vi.mock("@/app/api/reviews/route", () => ({ POST: vi.fn() }));
vi.mock("@/app/api/profile/route", () => ({ PATCH: vi.fn() }));
vi.mock("@/app/api/uploads/avatar/route", () => ({ POST: vi.fn() }));
vi.mock("@/app/api/quivibe-ai/route", () => ({ POST: vi.fn() }));
vi.mock("@/app/api/messages/route", () => ({ GET: vi.fn(), PATCH: vi.fn() }));
import { GET, POST, OPTIONS } from "@/app/api/mobile/[...path]/route";
function call(path: string, method = "GET", body?: unknown, origin?: string) {
  const url = "http://localhost/api/mobile/" + path;
  return (method === "OPTIONS" ? OPTIONS : method === "POST" ? POST : GET)(
    new Request(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(origin ? { origin } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    { params: Promise.resolve({ path: path.split("?")[0].split("/") }) },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  m.session.mockResolvedValue(null);
  m.find.mockResolvedValue([]);
  m.count.mockResolvedValue(0);
});
it.each(["favorites", "reservations", "reviews/mine", "messages"])(
  "rejects anonymous private reads: %s",
  async (path) => {
    expect((await call(path)).status).toBe(401);
  },
);
it("rejects anonymous reservation before invoking business writes", async () => {
  expect((await call("reservations", "POST", { placeId: "p" })).status).toBe(
    401,
  );
  expect(m.create).not.toHaveBeenCalled();
});
it("serves public discovery with validated filters", async () => {
  m.search.mockResolvedValue({ places: [], page: 2, total: 0, totalPages: 0 });
  const response = await call("venues?page=2&sort=rating");
  expect(response.status).toBe(200);
  expect(m.search.mock.calls[0][1]).toMatchObject({ page: 2, sort: "rating" });
  expect(m.search.mock.calls[0][2]).toBeUndefined();
  expect((await call("venues?page=-1")).status).toBe(400);
});
it("scopes reservation lists to current user and requested group", async () => {
  m.session.mockResolvedValue({ user: { id: "user-a" } });
  await call("reservations?group=cancelled&page=2");
  expect(m.find.mock.calls[0][0]).toMatchObject({
    where: { customerId: "user-a", status: "CANCELLED" },
    skip: 12,
    take: 12,
  });
});
it("delegates availability to existing service and preserves its quote", async () => {
  m.slots.mockResolvedValue({
    success: true,
    slots: ["18:00"],
    quote: { amountMinor: 100, currency: "USD" },
  });
  const response = await call(
    "venues/place-a/availability?date=2026-10-01&partySize=4",
  );
  expect(m.slots).toHaveBeenCalledWith({
    placeId: "place-a",
    date: "2026-10-01",
    partySize: 4,
  });
  expect(await response.json()).toMatchObject({
    quote: { amountMinor: 100, currency: "USD" },
  });
});
it("rejects unapproved browser origins", async () => {
  expect(
    (await call("venues", "GET", undefined, "https://untrusted.example"))
      .status,
  ).toBe(403);
  expect(m.search).not.toHaveBeenCalled();
});
it("answers same-origin preflight without accessing accounts or database", async () => {
  const response = await call(
    "venues",
    "OPTIONS",
    undefined,
    "http://localhost",
  );
  expect(response.status).toBe(204);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://localhost",
  );
  expect(m.session).not.toHaveBeenCalled();
});
it("rejects invalid credentials without creating a mobile session", async () => {
  m.credentials.mockResolvedValue(null);
  expect(
    (
      await call("session", "POST", {
        email: "user@example.test",
        password: "wrong",
      })
    ).status,
  ).toBe(401);
});
