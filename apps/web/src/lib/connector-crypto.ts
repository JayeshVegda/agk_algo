import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_KEY_VERSION = 1;

function getEncryptionKey(): Buffer {
  const envKey = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!envKey) {
    // Deterministic 32-byte fallback in development if env variable is not set
    return crypto.createHash("sha256").update("akg-connector-demo-key-fallback").digest();
  }
  return Buffer.from(envKey, "base64");
}

export interface EncryptedData {
  ciphertext: string;
  nonce: string;
  keyVersion: number;
}

export function encryptConnectorSecret(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const nonce = crypto.randomBytes(12); // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, nonce);

  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return {
    ciphertext: `${ciphertext}:${authTag}`,
    nonce: nonce.toString("base64"),
    keyVersion: Number(process.env.CONNECTOR_ENCRYPTION_KEY_VERSION) || DEFAULT_KEY_VERSION,
  };
}

export function decryptConnectorSecret(encrypted: EncryptedData): string {
  const key = getEncryptionKey();
  const nonce = Buffer.from(encrypted.nonce, "base64");
  const [ciphertext, authTagStr] = encrypted.ciphertext.split(":");

  if (!ciphertext || !authTagStr) {
    throw new Error("Invalid ciphertext structure");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, nonce);
  decipher.setAuthTag(Buffer.from(authTagStr, "base64"));

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
