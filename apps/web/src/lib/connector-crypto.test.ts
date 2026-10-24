import { describe, expect, it } from "vitest";
import {
  encryptConnectorSecret,
  decryptConnectorSecret,
} from "./connector-crypto";

describe("connector secret encryption/decryption", () => {
  it("encrypts and decrypts round-trip accurately", () => {
    const secret = "SuperSecretTraderPass123!";
    const encrypted = encryptConnectorSecret(secret);

    expect(encrypted.ciphertext).not.toBe(secret);
    expect(encrypted.ciphertext).toContain(":");
    expect(encrypted.nonce).toBeDefined();

    const decrypted = decryptConnectorSecret(encrypted);
    expect(decrypted).toBe(secret);
  });
});
