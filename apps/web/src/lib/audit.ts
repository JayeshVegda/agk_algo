import { getDb, auditLog } from "@akg/db";
import { createHash } from "node:crypto";
import { logger } from "./logger";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  diff?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Anonymizes an IP address with SHA-256 hash for privacy.
 */
export function hashIp(ip?: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/**
 * Sanitizes audit diff payload to ensure no sensitive secrets are persisted to audit_log.
 */
function sanitizeAuditDiff(diff?: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!diff) return null;
  const sanitized = { ...diff };
  const sensitiveKeys = [
    "password",
    "secret",
    "masterPassword",
    "secretCiphertext",
    "token",
    "licenseKey",
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}

/**
 * Inserts an immutable audit log record.
 */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = getDb();
    const sanitizedDiff = sanitizeAuditDiff(entry.diff);

    await db.insert(auditLog).values({
      actorId: entry.actorId || null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      diff: sanitizedDiff,
      ipHash: hashIp(entry.ipAddress),
      createdAt: new Date(),
    });

    logger.info(
      {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actorId: entry.actorId,
      },
      "Audit log recorded",
    );
  } catch (err) {
    logger.error({ err, entry }, "Failed to persist audit log");
    throw err;
  }
}
