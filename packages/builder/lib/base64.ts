import { stringFromArrayBuffer } from './utils.js';

/**
 * Encodes a string, ArrayBuffer, or Uint8Array into a Base64 URL format.
 *
 * This function handles both browser and Node.js environments by using
 * the appropriate encoding method based on the environment.
 *
 * @param {string | ArrayBuffer | Uint8Array} input - The input to encode.
 * @returns {string} The Base64 URL encoded string.
 */
export const base64UrlEncode = (
  input: string | ArrayBuffer | Uint8Array,
): string => {
  // Convert input to string if it's binary
  const text = typeof input === 'string' ? input : stringFromArrayBuffer(input);

  // Use environment-specific encoding
  let base64: string;
  if (typeof globalThis !== 'undefined' && 'btoa' in globalThis) {
    // Browser environment
    base64 = globalThis.btoa(text);
  } else {
    // Node.js environment
    base64 = Buffer.from(text, 'binary').toString('base64');
  }

  // Convert base64 to base64url format
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

/**
 * Decodes a Base64 URL encoded string back to its original format.
 *
 * This function handles both browser and Node.js environments by using
 * the appropriate decoding method based on the environment.
 *
 * @param {string | undefined} s - The Base64 URL encoded string to decode.
 * @returns {string} The decoded data as a string.
 * @throws {Error} Throws an error if the input string is invalid.
 */
export const base64UrlDecodeString = (s: string | undefined): string => {
  if (!s) throw new Error('Invalid input');
  return (
    s.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (s.length % 4)) % 4)
  );
};

/**
 * Decodes a Base64 URL encoded string into an ArrayBuffer.
 *
 * This function handles both browser and Node.js environments by using
 * the appropriate decoding method based on the environment.
 *
 * @param {string} input - The Base64 URL encoded string to decode.
 * @returns {ArrayBuffer} The decoded data as an ArrayBuffer.
 */
export const base64UrlDecode = (input: string): ArrayBuffer => {
  // Convert from base64url to base64
  const base64 = base64UrlDecodeString(input);

  // Decode based on environment
  if (typeof globalThis !== 'undefined' && 'atob' in globalThis) {
    // Browser environment
    const binaryString = globalThis.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  // Node.js environment
  return Buffer.from(base64, 'base64').buffer;
};
