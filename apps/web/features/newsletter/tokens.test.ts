import { afterEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { newsletterToken, readNewsletterToken } from "./tokens";
import { subscriptionSchema } from "./schema";
import { sendNewsletterCampaignEmail } from "@/lib/email";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("binds signed links to one subscriber, consent version and purpose", () => {
  vi.stubEnv("AUTH_SECRET", "newsletter-test-secret");
  const version = randomUUID(),
    token = newsletterToken("subscriber1", version, "confirm");
  expect(readNewsletterToken(token, "confirm")).toEqual({
    id: "subscriber1",
    version,
  });
  expect(readNewsletterToken(token, "unsubscribe")).toBeNull();
  expect(
    readNewsletterToken(token.replace("subscriber1", "subscriber2"), "confirm"),
  ).toBeNull();
  expect(readNewsletterToken(`${token}extra`, "confirm")).toBeNull();
  expect(readNewsletterToken({}, "confirm")).toBeNull();
});
it("requires explicit consent and normalizes addresses without changing plus aliases", () => {
  expect(
    subscriptionSchema.parse({
      email: " User+News@Example.com ",
      consent: true,
    }).email,
  ).toBe("user+news@example.com");
  expect(
    subscriptionSchema.safeParse({ email: "user@example.com" }).success,
  ).toBe(false);
  expect(
    subscriptionSchema.safeParse({ email: "not an address", consent: true })
      .success,
  ).toBe(false);
});
it("escapes campaign content and provides private delivery and one-click opt-out", async () => {
  vi.stubEnv("RESEND_API_KEY", "mock-only");
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ id: "mock" }) });
  vi.stubGlobal("fetch", fetch);
  await sendNewsletterCampaignEmail({
    to: "newsletter@example.test",
    subject: "Un sujet <test>",
    body: '<script>alert("x")</script>',
    unsubscribeUrl: "https://example.test/newsletter/unsubscribe?token=signed",
    oneClickUrl: "https://example.test/api/newsletter/unsubscribe?token=signed",
    idempotencyKey: "campaign-once",
  });
  const options = fetch.mock.calls[0][1],
    payload = JSON.parse(options.body);
  expect(payload.to).toEqual(["newsletter@example.test"]);
  expect(payload.cc).toBeUndefined();
  expect(payload.bcc).toBeUndefined();
  expect(payload.html).not.toContain("<script>");
  expect(payload.html).toContain("&lt;script&gt;");
  expect(payload.headers["List-Unsubscribe-Post"]).toBe(
    "List-Unsubscribe=One-Click",
  );
  expect(payload.headers["List-Unsubscribe"]).toContain(
    "/api/newsletter/unsubscribe?token=signed",
  );
  expect(options.headers["Idempotency-Key"]).toBe("campaign-once");
});
