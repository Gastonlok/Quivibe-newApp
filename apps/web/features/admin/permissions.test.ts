import { describe, expect, it } from "vitest";
import {
  canAdmin,
  hasAdminAccess,
  MODERATION_PERMISSIONS,
} from "./permissions";
import { messageSchema, userUpdateSchema } from "./schema";

describe("administration permissions", () => {
  it("gives administrators every control", () => {
    for (const permission of [
      ...MODERATION_PERMISSIONS,
      "USERS",
      "MESSAGES",
      "AUDIT",
      "CATEGORIES",
    ] as const)
      expect(canAdmin({ role: "ADMIN" }, permission)).toBe(true);
  });
  it("delegates only assigned domains without privilege escalation", () => {
    const moderator = {
      role: "USER",
      moderationPermissions: ["REVIEWS", "MESSAGES", "USERS"],
    };
    expect(hasAdminAccess(moderator)).toBe(true);
    expect(canAdmin(moderator, "REVIEWS")).toBe(true);
    expect(canAdmin(moderator, "PLACES")).toBe(false);
    expect(canAdmin(moderator, "USERS")).toBe(false);
    expect(canAdmin(moderator, "MESSAGES")).toBe(false);
    expect(canAdmin({ role: "OWNER" }, "PLACES")).toBe(false);
  });
  it("denies suspended and unauthenticated accounts", () => {
    expect(hasAdminAccess({ role: "ADMIN", suspendedAt: new Date() })).toBe(
      false,
    );
    expect(canAdmin(null, "USERS")).toBe(false);
  });
  it("rejects unsupported roles, mass assignment and empty updates", () => {
    for (const value of [
      { role: "SUPER_ADMIN" },
      { passwordHash: "x" },
      { moderationPermissions: ["USERS"] },
      {},
    ])
      expect(userUpdateSchema.safeParse(value).success).toBe(false);
    expect(
      userUpdateSchema.safeParse({ moderationPermissions: [] }).success,
    ).toBe(true);
  });
  it("validates message audience and contents", () => {
    const base = {
      requestKey: "2fa9a529-715a-438b-95dc-363ff5d30f82",
      subject: "Information",
      body: "Votre message",
      audience: "SELECTED",
    };
    expect(messageSchema.safeParse(base).success).toBe(false);
    expect(messageSchema.safeParse({ ...base, userIds: ["u1"] }).success).toBe(
      true,
    );
    expect(
      messageSchema.safeParse({ ...base, audience: "ALL", role: "ADMIN" })
        .success,
    ).toBe(false);
  });
});
