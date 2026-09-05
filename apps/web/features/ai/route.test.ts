import { beforeEach, describe, expect, it, vi } from "vitest";
import { contextSchema, updateContext } from "./conversation";

const { findMany, interpretRequest, composeReply } = vi.hoisted(() => ({
  findMany: vi.fn(), interpretRequest: vi.fn(), composeReply: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { place: { findMany } } }));
vi.mock("@/features/ai/model", () => ({ interpretRequest, composeReply }));
vi.mock("@/features/reservations/actions", () => ({ getAvailableSlotsAction: vi.fn().mockResolvedValue({ success: true, slots: ["19:00"] }) }));
import { POST } from "../../app/api/quivibe-ai/route";

const rows = [
  { id: "a", slug: "adresse-a", name: "Adresse A", description: "Calme et romantique avec une belle vue", neighborhood: "Gombe", priceRange: 2, amenities: [], reservationsEnabled: true, maxPartySize: 8, latitude: -4.3, longitude: 15.3, categories: [{ category: { name: "Restaurant" } }], reviews: [{ rating: 4 }], media: [] },
  { id: "b", slug: "adresse-b", name: "Adresse B", description: "Calme et romantique", neighborhood: "Gombe", priceRange: 2, amenities: [], reservationsEnabled: false, maxPartySize: 4, latitude: -4.3, longitude: 15.3, categories: [{ category: { name: "Restaurant" } }], reviews: [{ rating: 3 }], media: [] },
];
async function ask(body: Record<string, unknown>) {
  const response = await POST(new Request("http://localhost/api/quivibe-ai", { method: "POST", body: JSON.stringify(body) }));
  return { status: response.status, body: await response.json() };
}
beforeEach(() => {
  vi.clearAllMocks();
  findMany.mockResolvedValue(rows);
  interpretRequest.mockImplementation((_q, _h, context) => context);
  composeReply.mockImplementation((_q, _h, _c, _p, fallback) => fallback);
});

describe("AI endpoint", () => {
  it("avoids database and model calls for simple conversation", async () => {
    const { body } = await ask({ query: "Merci !" });
    expect(body.recommendations).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
    expect(interpretRequest).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON, excessive history and invalid coordinates", async () => {
    expect((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400);
    expect((await ask({ query: "resto", position: { latitude: 100, longitude: 0 } })).status).toBe(400);
    expect((await ask({ query: "resto", history: Array(13).fill({ role: "user", content: "bonjour" }) })).status).toBe(400);
  });
  it("plays the ten requested turns including grounded comparison and booking handoff", async () => {
    let context = contextSchema.parse({});
    let previousIds: string[] = [];
    for (const query of ["Je cherche un endroit romantique pour ma copine.", "Pas trop cher.", "Je suis à Gombe.", "Un endroit avec une belle vue.", "On est 6.", "Je veux quelque chose de chic mais pas trop cher.", "Trouve-moi un bon resto.", "Tu me conseilles lequel ?", "Non, quelque chose de plus calme.", "Je veux réserver."]) {
      const result = await ask({ query, context, previousIds });
      expect(result.status).toBe(200);
      context = result.body.context;
      previousIds = result.body.recommendations?.map((p: { id: string }) => p.id) || previousIds;
      expect((result.body.message.match(/\?/g) || []).length).toBeLessThanOrEqual(1);
      if (query.includes("réserver")) {
        expect(result.body.message).toContain("formulaire");
        expect(result.body.message).not.toContain("confirmée");
        expect(result.body.recommendations[0]).toMatchObject({ slug: "adresse-a", reservationsEnabled: true });
      }
    }
    expect(context).toMatchObject({ occasion: "romantique", budget: "low", neighborhood: "gombe", partySize: 6 });
  });
  it("revalidates previous IDs and never compares a fabricated place", async () => {
    const { body } = await ask({ query: "Tu me conseilles lequel ?", context: updateContext("resto à Gombe"), previousIds: ["not-in-db"] });
    expect(body.recommendations).toEqual([]);
    expect(findMany.mock.calls[0][0].where).toEqual({ status: "APPROVED" });
  });
  it("asks only for missing location before querying nearby", async () => {
    const { body } = await ask({ query: "Un resto près de moi" });
    expect(body.message).toContain("quel quartier");
    expect(findMany).not.toHaveBeenCalled();
  });
  it("keeps known location and gives a useful alternative when no match exists", async () => {
    findMany.mockResolvedValue([]);
    const { body } = await ask({ query: "Pas trop cher", context: updateContext("restaurant à Gombe") });
    expect(body.context.neighborhood).toBe("gombe");
    expect(body.message).toContain("élargir");
    expect(body.recommendations).toEqual([]);
  });
  it("reports database failure without fabricated recommendations", async () => {
    findMany.mockRejectedValue(new Error("unavailable"));
    expect((await ask({ query: "restaurant" })).status).toBe(503);
  });
  it("uses the real availability interface only with an explicit date and group", async () => {
    const { getAvailableSlotsAction } = await import("@/features/reservations/actions");
    const { body } = await ask({ query: "Je veux réserver", context: updateContext("restaurant à Gombe demain pour 6 à 19h") });
    expect(getAvailableSlotsAction).toHaveBeenCalledWith(expect.objectContaining({ placeId: "a", partySize: 6 }));
    expect(body.recommendations[0].availableSlot).toBe("19:00");
    expect(body.message).not.toContain("confirmée");
  });
});
