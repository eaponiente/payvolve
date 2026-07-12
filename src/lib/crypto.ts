import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Application-level encryption for sensitive fields at rest (PH Data Privacy
 * Act / RA 10173) — used for employee government IDs (TIN, SSS, PhilHealth,
 * Pag-IBIG). AES-256-GCM (authenticated) with a per-value random IV.
 *
 * Key: `FIELD_ENCRYPTION_KEY`, a base64-encoded 32-byte key. Losing/rotating it
 * makes existing ciphertext unrecoverable, so treat it like any DB credential.
 *
 * Stored format: `v1:<iv_b64>:<tag_b64>:<ciphertext_b64>`. `decryptField`
 * passes through anything without the `v1:` prefix unchanged, so pre-existing
 * plaintext rows keep working with no backfill required.
 */
const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

function key(): Buffer {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) throw new Error("FIELD_ENCRYPTION_KEY is not set");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) {
    throw new Error("FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return k;
}

export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext; // keep "" as "" — nothing to protect
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptField(stored: string): string {
  if (!stored) return stored;
  // Legacy plaintext (pre-encryption rows) — pass through unchanged.
  if (!stored.startsWith(`${VERSION}:`)) return stored;

  const parts = stored.split(":");
  if (parts.length !== 4) return stored;
  const [, ivB64, tagB64, ctB64] = parts;

  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** The employee government-ID fields we encrypt at rest. */
type GovIds = {
  tin: string;
  sssNumber: string;
  philhealthNumber: string;
  pagibigNumber: string;
};

/** Returns a copy with the four government-ID fields encrypted. */
export function encryptGovIds<T extends GovIds>(data: T): T {
  return {
    ...data,
    tin: encryptField(data.tin),
    sssNumber: encryptField(data.sssNumber),
    philhealthNumber: encryptField(data.philhealthNumber),
    pagibigNumber: encryptField(data.pagibigNumber),
  };
}
