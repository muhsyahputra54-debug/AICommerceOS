import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function getEncryptionKey() {
  const raw =
    process.env.MARKETPLACE_TOKEN_ENCRYPTION_KEY?.trim();

  if (!raw) {
    throw new Error(
      "MARKETPLACE_TOKEN_ENCRYPTION_KEY belum dikonfigurasi pada server.",
    );
  }

  const key = Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error(
      "MARKETPLACE_TOKEN_ENCRYPTION_KEY harus berupa 32-byte key dalam format base64.",
    );
  }

  return key;
}

export function encryptMarketplaceSecret(value: string) {
  const plaintext = value.trim();

  if (!plaintext) {
    throw new Error("Marketplace secret tidak boleh kosong.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
  );

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptMarketplaceSecret(envelope: string) {
  const [version, ivValue, tagValue, ciphertextValue] =
    envelope.split(".");

  if (
    version !== VERSION ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue
  ) {
    throw new Error("Encrypted marketplace secret tidak valid.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(
    Buffer.from(tagValue, "base64url"),
  );

  const plaintext = Buffer.concat([
    decipher.update(
      Buffer.from(ciphertextValue, "base64url"),
    ),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
