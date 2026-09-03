import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schema";

describe("auth schemas", () => {
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse({ name: "Aline Mbala", email: "ALINE@example.com", password: "secret123" }).success).toBe(true);
  });

  it("rejects a short password", () => {
    expect(registerSchema.safeParse({ name: "Aline", email: "aline@example.com", password: "short" }).success).toBe(false);
  });

  it("requires credentials for login", () => {
    expect(loginSchema.safeParse({ email: "invalid", password: "" }).success).toBe(false);
  });
});
