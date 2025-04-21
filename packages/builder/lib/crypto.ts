/// <reference lib="webworker" />
/// <reference types="node" />

/**
 * A module that provides a cross-platform cryptographic interface.
 *
 * @module crypto
 */

let isomorphicCrypto: Crypto;

// Cloudflare Worker, Deno, Bun and Browser environments have crypto globally available
if (globalThis.crypto?.subtle) {
  isomorphicCrypto = globalThis.crypto;
}
// Node.js requires importing the webcrypto module
else if (typeof process !== 'undefined' && process.versions?.node) {
  try {
    const { webcrypto } = await import('node:crypto');
    isomorphicCrypto = webcrypto as unknown as Crypto;
  } catch {
    throw new Error(
      'Crypto API not available in this Node.js environment. Please use Node.js 16+ which supports the Web Crypto API.',
    );
  }
}
// Fallback error for unsupported environments
else {
  throw new Error(
    'No Web Crypto API implementation available in this environment.',
  );
}

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
