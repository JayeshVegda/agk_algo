import { test, expect } from "@playwright/test";

test.describe("health check and basic smoke", () => {
  test("healthz returns ok status", async ({ request }) => {
    const response = await request.get("/healthz");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("akg-web");
  });
});
