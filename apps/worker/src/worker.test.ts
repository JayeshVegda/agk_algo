import { describe, expect, it } from "vitest";
import { PgBoss } from "pg-boss";

describe("worker initialization", () => {
  it("imports PgBoss successfully", () => {
    expect(PgBoss).toBeDefined();
    expect(typeof PgBoss).toBe("function");
  });
});
