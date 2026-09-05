import { afterEach, expect, it, vi } from "vitest";
import { sendAdminMessageEmail } from "@/lib/email";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("escapes HTML, uses a private recipient and provides provider deduplication", async () => {
  vi.stubEnv("RESEND_API_KEY", "test");
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ id: "provider-id" }) });
  vi.stubGlobal("fetch", fetch);
  await sendAdminMessageEmail({
    to: "user@example.test",
    subject: "Information",
    body: '<script>alert("x")</script>',
    idempotencyKey: "unique-key",
  });
  const options = fetch.mock.calls[0][1];
  const body = JSON.parse(options.body);
  expect(body.to).toEqual(["user@example.test"]);
  expect(body.cc).toBeUndefined();
  expect(body.bcc).toBeUndefined();
  expect(body.html).toContain("&lt;script&gt;");
  expect(body.html).not.toContain("<script>");
  expect(options.headers["Idempotency-Key"]).toBe("unique-key");
});
