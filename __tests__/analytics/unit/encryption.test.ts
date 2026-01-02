/**
 * Tests for the encryption utility
 */

import { encryptToken, decryptToken, isEncrypted } from "@/lib/encryption";

describe("Encryption Utility", () => {
  const testUserId = "user_test123";
  const testToken = "sk_test_abcdefghijklmnop123456789";

  describe("encryptToken", () => {
    it("should encrypt a token", () => {
      const encrypted = encryptToken(testToken, testUserId);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testToken);
      // Should be base64 encoded
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it("should produce different ciphertexts for the same token (due to random IV)", () => {
      const encrypted1 = encryptToken(testToken, testUserId);
      const encrypted2 = encryptToken(testToken, testUserId);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should produce different ciphertexts for different users with same token", () => {
      const encrypted1 = encryptToken(testToken, "user_1");
      const encrypted2 = encryptToken(testToken, "user_2");

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw if token is empty", () => {
      expect(() => encryptToken("", testUserId)).toThrow();
    });

    it("should throw if userId is empty", () => {
      expect(() => encryptToken(testToken, "")).toThrow();
    });
  });

  describe("decryptToken", () => {
    it("should decrypt an encrypted token", () => {
      const encrypted = encryptToken(testToken, testUserId);
      const decrypted = decryptToken(encrypted, testUserId);

      expect(decrypted).toBe(testToken);
    });

    it("should fail to decrypt with wrong userId", () => {
      const encrypted = encryptToken(testToken, testUserId);

      expect(() => decryptToken(encrypted, "wrong_user")).toThrow(
        /Failed to decrypt/
      );
    });

    it("should fail to decrypt tampered data", () => {
      const encrypted = encryptToken(testToken, testUserId);
      // Tamper with the encrypted data
      const tampered = encrypted.slice(0, -4) + "XXXX";

      expect(() => decryptToken(tampered, testUserId)).toThrow();
    });

    it("should throw if encryptedData is empty", () => {
      expect(() => decryptToken("", testUserId)).toThrow();
    });

    it("should throw if userId is empty", () => {
      const encrypted = encryptToken(testToken, testUserId);
      expect(() => decryptToken(encrypted, "")).toThrow();
    });
  });

  describe("isEncrypted", () => {
    it("should return true for encrypted data", () => {
      const encrypted = encryptToken(testToken, testUserId);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("should return false for plaintext that looks like a token", () => {
      // API tokens are typically not valid base64 or too short
      expect(isEncrypted(testToken)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isEncrypted("")).toBe(false);
    });

    it("should return false for short base64 strings", () => {
      // Too short to be encrypted data
      expect(isEncrypted("YWJj")).toBe(false); // "abc" in base64
    });
  });

  describe("round-trip encryption", () => {
    it("should handle various token formats", () => {
      const tokens = [
        "simple_token",
        "token_with_special_chars!@#$%^&*()",
        "very_long_token_" + "x".repeat(100),
        "unicode_token_🔐_安全",
        "token with spaces",
        "token\nwith\nnewlines",
      ];

      for (const token of tokens) {
        const encrypted = encryptToken(token, testUserId);
        const decrypted = decryptToken(encrypted, testUserId);
        expect(decrypted).toBe(token);
      }
    });
  });
});


