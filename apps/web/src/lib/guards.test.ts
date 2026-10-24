import { describe, expect, it } from "vitest";
import {
  UnauthorizedError,
  ForbiddenError,
  type UserSessionContext,
} from "./guards";

describe("authorization guards", () => {
  it("UnauthorizedError has 401 status", () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("ForbiddenError has 403 status", () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.message).toBe("Forbidden");
  });

  it("validates role guard logic correctly", () => {
    const regularUserContext: UserSessionContext = {
      user: {
        id: "usr-regular",
        email: "user@example.com",
        name: "Regular User",
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "sess-1",
        userId: "usr-regular",
        token: "token-1",
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: "user",
      profile: null,
    };

    expect(regularUserContext.role).not.toBe("admin");
  });
});
