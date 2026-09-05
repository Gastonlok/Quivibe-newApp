import { describe, expect, it } from "vitest";
import { contextSchema, conversationalReply, updateContext } from "./conversation";
import { recommendPlaces } from "./recommend";
import type { QuivibePlace } from "./types";

export const fixturePlaces: QuivibePlace[] = [
  { id: "a", slug: "a", name: "Adresse A", description: "Cadre romantique, calme et chic avec une belle vue. Cuisine africaine.", neighborhood: "Gombe", priceRange: 2, category: "Restaurant", rating: 4, image: null, imageAlt: "A", reservationsEnabled: true, amenities: ["POOL", "PARKING"], maxPartySize: 8 },
  { id: "b", slug: "b", name: "Adresse B", description: "Cadre animé et chic, musique et concerts.", neighborhood: "Gombe", priceRange: 4, category: "Bar", rating: 5, image: null, imageAlt: "B", reservationsEnabled: true, amenities: ["POOL"], maxPartySize: 4 },
  { id: "c", slug: "c", name: "Adresse C", description: "Restaurant calme et romantique.", neighborhood: "Limete", priceRange: 1, category: "Restaurant", rating: 3, image: null, imageAlt: "C", reservationsEnabled: false, amenities: [] },
];

describe("discovery conversation: requested scenarios", () => {
  it("1–5 remembers romantic, budget, Gombe, view and six people across turns", () => {
    let c = updateContext("Je cherche un endroit romantique pour ma copine.");
    expect(c.occasion).toBe("romantique");
    c = updateContext("Pas trop cher.", c);
    expect(c).toMatchObject({ occasion: "romantique", budget: "low" });
    c = updateContext("Je suis à Gombe.", c);
    c = updateContext("Un endroit avec une belle vue.", c);
    c = updateContext("On est 6.", c);
    expect(c).toMatchObject({ occasion: "romantique", budget: "low", neighborhood: "gombe", atmosphere: ["vue"], partySize: 6 });
    expect(recommendPlaces(c, fixturePlaces).map((p) => p.id)).toEqual(["a"]);
  });
  it("6 chic does not override affordability", () => {
    expect(recommendPlaces("Je veux quelque chose de chic mais pas trop cher.", fixturePlaces)[0].id).toBe("a");
  });
  it("7 understands resto without requiring a questionnaire", () => {
    expect(updateContext("Trouve-moi un bon resto.").category).toBe("restaurant");
  });
  it("8 comparing preserves criteria", () => {
    const c = updateContext("Un resto romantique à Gombe");
    expect(updateContext("Tu me conseilles lequel ?", c)).toEqual(c);
  });
  it("9 calm replaces lively", () => {
    const c = updateContext("Non, quelque chose de plus calme.", updateContext("Un endroit animé"));
    expect(c.atmosphere).toEqual(["calme"]);
    expect(recommendPlaces(c, fixturePlaces).map((p) => p.id)).not.toContain("b");
  });
  it("10 reservation keeps the group without inventing date or availability", () => {
    const c = updateContext("Je veux réserver.", updateContext("On est 6"));
    expect(c.partySize).toBe(6);
    expect(c.date).toBeNull();
    expect(recommendPlaces(c, fixturePlaces).every((p) => !p.availableSlot)).toBe(true);
  });
});

describe("grounding and fallback", () => {
  it("keeps numeric budgets without inventing conversion", () => {
    const c = updateContext("J’ai seulement 30 dollars");
    expect(c.amount).toBe("30 dollars");
    expect(c.budget).toBeNull();
    expect(recommendPlaces(c, fixturePlaces)[0].reason).toContain("ne permet pas de le garantir");
  });
  it("requires all facilities and never invents alternatives", () => {
    expect(recommendPlaces("piscine et parking", fixturePlaces).map((p) => p.id)).toEqual(["a"]);
    expect(recommendPlaces("billard", fixturePlaces)).toEqual([]);
  });
  it("does not call an expensive place romantic based on price or rating", () => {
    expect(recommendPlaces("romantique", fixturePlaces).map((p) => p.id)).toEqual(["a", "c"]);
  });
  it("unknown descriptions produce explicit partial matches", () => {
    const result = recommendPlaces("belle vue", [fixturePlaces[2]]);
    expect(result[0].partialMatch).toBe(true);
    expect(result[0].reason).toContain("À confirmer : vue");
  });
  it("resets preferences only on explicit reset", () => {
    expect(updateContext("Nouvelle recherche", updateContext("resto romantique à Gombe"))).toEqual(contextSchema.parse({}));
  });
  it("answers greetings without a search", () => {
    expect(conversationalReply("Salut !")).toContain("Quelle sortie");
    expect(conversationalReply("Merci beaucoup")).toContain("Avec plaisir");
    expect(conversationalReply("Salut, je cherche un restaurant")).toBeNull();
  });
});
