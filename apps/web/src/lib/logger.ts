import pino from "pino";

export const logger = pino({
  name: "akg-web",
  level: process.env.LOG_LEVEL || "info",
  redact: [
    "password",
    "secret",
    "token",
    "masterPassword",
    "secretCiphertext",
    "licenseKey",
    "*.password",
    "*.secret",
    "*.token",
  ],
});

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}
