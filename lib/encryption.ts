/**
 * Encryption utilities for securely storing sensitive data
 *
 * Uses AES-256-GCM for authenticated encryption with per-user key derivation.
 *
 * SECURITY DESIGN:
 * - Base encryption key from ENCRYPTION_SECRET environment variable
 * - Per-user keys derived using HKDF with user ID as context
 * - This ensures that even if two users store the same token, the ciphertext differs
 * - Decryption requires both the secret key AND the correct user ID
 * - Uses authenticated encryption (GCM) to detect tampering
 */

import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits - recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the base encryption key from environment
 * Falls back to a development key if not set (with warning)
 */
function getBaseKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;

  if (!secret) {
    console.warn(
      "[SECURITY WARNING] ENCRYPTION_SECRET is not set. " +
        "Using a fallback key for development only. " +
        "Set ENCRYPTION_SECRET in production!"
    );
    // Fallback for development - DO NOT USE IN PRODUCTION
    return crypto.scryptSync("development-only-key", "salt", KEY_LENGTH);
  }

  // Derive a proper 256-bit key from the secret using scrypt
  return crypto.scryptSync(secret, "integration-tokens-v1", KEY_LENGTH);
}

/**
 * Derive a user-specific encryption key using HKDF
 *
 * This ensures that:
 * 1. Each user has a unique encryption key
 * 2. Decryption requires knowing the correct user ID
 * 3. A database leak alone cannot decrypt tokens without the secret
 *
 * @param userId - The user's unique identifier (from Clerk)
 * @returns A 256-bit key unique to this user
 */
function deriveUserKey(userId: string): Buffer {
  const baseKey = getBaseKey();

  // Use HKDF to derive a user-specific key
  // The user ID serves as the "info" parameter
  const derivedKey = crypto.hkdfSync(
    "sha256",
    baseKey,
    Buffer.from("user-token-encryption"),
    Buffer.from(userId),
    KEY_LENGTH
  );

  return Buffer.from(derivedKey);
}

/**
 * Encrypt a token for a specific user
 *
 * The encrypted format is: IV (12 bytes) || Ciphertext || AuthTag (16 bytes)
 * Stored as base64 for database compatibility
 *
 * @param plaintext - The token to encrypt
 * @param userId - The user ID to derive the encryption key from
 * @returns Base64-encoded encrypted data
 */
export function encryptToken(plaintext: string, userId: string): string {
  if (!plaintext || !userId) {
    throw new Error("Both plaintext and userId are required for encryption");
  }

  const key = deriveUserKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine IV + Ciphertext + AuthTag
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return combined.toString("base64");
}

/**
 * Decrypt a token for a specific user
 *
 * @param encryptedData - Base64-encoded encrypted data
 * @param userId - The user ID to derive the decryption key from
 * @returns The decrypted token
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decryptToken(encryptedData: string, userId: string): string {
  if (!encryptedData || !userId) {
    throw new Error(
      "Both encryptedData and userId are required for decryption"
    );
  }

  const key = deriveUserKey(userId);
  const combined = Buffer.from(encryptedData, "base64");

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    // GCM authentication failed - either wrong key or tampered data
    throw new Error(
      "Failed to decrypt token. This may indicate tampering or a key mismatch."
    );
  }
}

/**
 * Check if a value appears to be encrypted (base64 with expected length)
 * Used to detect if we need to migrate plaintext tokens
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;

  try {
    const decoded = Buffer.from(value, "base64");
    // Minimum size: IV (12) + at least 1 byte ciphertext + AuthTag (16) = 29 bytes
    // Also verify it's valid base64 by checking round-trip
    return (
      decoded.length >= 29 && value === decoded.toString("base64")
    );
  } catch {
    return false;
  }
}

