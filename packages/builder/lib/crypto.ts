/// <reference lib="webworker" />
/// <reference types="node" />

/**
 * A module that provides a cross-platform cryptographic interface.
 * Uses globalThis.crypto which is available in:
 * - Node.js 20+ (current LTS)
 * - Browsers
 * - Cloudflare Workers
 * - Deno
 * - Bun
 * - Convex
 *
 * @module crypto
 */

if (!globalThis.crypto?.subtle) {
  throw new Error(
    'Web Crypto API not available. Ensure you are using Node.js 20+ or a modern runtime with globalThis.crypto support.',
  );
}

const isomorphicCrypto: Crypto = globalThis.crypto;

/**
 * A cryptographic interface that provides methods for generating random values
 * and accessing subtle cryptographic operations.
 */
export const crypto = {
  /**
   * Fills the given typed array with cryptographically secure random values.
   *
   * @param {T} array - The typed array to fill with random values.
   * @returns {T} The filled typed array.
   * @template T - The type of the typed array (e.g., Uint8Array).
   */
  getRandomValues<T extends Uint8Array>(array: T): T {
    return isomorphicCrypto.getRandomValues(array);
  },

  /**
   * Provides access to subtle cryptographic operations.
   *
   * @type {SubtleCrypto} The subtle cryptographic interface.
   */
  subtle: isomorphicCrypto.subtle,
};
