/// <reference lib="webworker" />
/// <reference types="node" />

/**
 * A module that provides a cross-platform cryptographic interface.
 * This module uses the Web Crypto API in browsers and falls back to Node.js's crypto module
 * when running in a Node.js environment.
 *
 * @module crypto
 */

const isomorphicCrypto =
  globalThis.crypto ?? (await import('node:crypto')).webcrypto;

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
