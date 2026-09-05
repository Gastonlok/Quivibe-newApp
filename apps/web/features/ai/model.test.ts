import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { composeReply, interpretRequest } from "./model";
import { updateContext } from "./conversation";

const fetchMock = vi.fn();
const context = updateContext("Un resto romantique à Gombe pas trop cher");
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); vi.stubEnv("OPENAI_API_KEY", "test-key"); fetchMock.mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const response = (text: string, status = "completed") => ({ ok: true, json: async () => ({ status, output: [{ content: [{ type: "output_text", text }] }] }) });

it("uses structured preferences with separate instructions and untrusted input", async () => {
  fetchMock.mockResolvedValue(response(JSON.stringify({ ...context, partySize: 6 })));
  expect((await interpretRequest("Nous serons six", [], context)).partySize).toBe(6);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.text.format.strict).toBe(true);
  expect(body.store).toBe(false);
  expect(body.instructions).toContain("Romantique ne veut pas dire cher");
});
it("preserves memory on empty, invalid, refused, truncated or failed model output", async () => {
  for (const result of [response("{}"), response("not json"), response(JSON.stringify({ ...context, partySize: 1000 })), response("{}", "incomplete"), { ok: false }]) {
    fetchMock.mockResolvedValue(result);
    expect(await interpretRequest("On est six", [], context)).toEqual(context);
  }
  fetchMock.mockRejectedValue(new Error("timeout"));
  expect(await interpretRequest("On est six", [], context)).toEqual(context);
});
it("works without an API key", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  expect(await interpretRequest("Bonjour", [], context)).toEqual(context);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("rejects simulated confirmation and multiple questions", async () => {
  const facts = [{ name: "Adresse A", reason: "Restaurant à Gombe." }];
  for (const text of ["Ta réservation est confirmée.", "Quel budget ? Quelle heure ?"]) {
    fetchMock.mockResolvedValue(response(text));
    expect(await composeReply("Un resto", [], context, facts, "fallback")).toBe("fallback");
  }
});
