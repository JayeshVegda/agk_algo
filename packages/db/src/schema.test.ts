import { describe, expect, it } from "vitest";
import * as schema from "./schema/index";

describe("db schema exports", () => {
  it("exports required Phase 0 tables", () => {
    expect(schema.users).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.accounts).toBeDefined();
    expect(schema.verifications).toBeDefined();
    expect(schema.twoFactors).toBeDefined();
    expect(schema.userProfiles).toBeDefined();
    expect(schema.settings).toBeDefined();
    expect(schema.auditLog).toBeDefined();
    expect(schema.termsVersions).toBeDefined();
    expect(schema.termsAcceptances).toBeDefined();
  });
});
