import { base64UrlDecodeString, base64UrlEncode } from './base64.js';

/**
 * Represents any value that can be handled by JSON.stringify without loss.
 * This includes primitive types such as strings, numbers, booleans, and null.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Represents a JSON-compatible value, which can be a primitive,
 * an array of Jsonifiable values, or an object with string keys
 * and Jsonifiable values.
 */
export type Jsonifiable =
  | JsonPrimitive
  | Jsonifiable[]
  | { [key: string]: Jsonifiable };

/**
 * A utility type that requires at least one of the specified keys from type T.
 * This is useful for creating types that enforce the presence of certain properties
 * while allowing others to be optional.
 *
 * @template T - The base type from which keys are required.
 * @template Keys - The keys of T that are required.
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[Keys] &
  Omit<T, Keys>;

/**
 * Converts an ArrayBuffer or Uint8Array to a string.
 *
 * @param {ArrayBuffer | Uint8Array} s - The input array to convert.
 * @returns {string} The resulting string representation of the input.
 */
export const stringFromArrayBuffer = (s: ArrayBuffer | Uint8Array): string => {
  let result = '';
  for (const code of new Uint8Array(s)) result += String.fromCharCode(code);
  return result;
};

/**
 * Cross-platform function to decode a Base64 string into a binary string.
 * Works in both browser and Node.js environments.
 *
 * @param {string} base64String - The Base64 encoded string to decode.
 * @returns {string} The decoded binary string.
 */
export const base64Decode = (base64String: string): string => {
  // Add padding if needed
  const paddedBase64 = base64String.padEnd(
    base64String.length + ((4 - (base64String.length % 4 || 4)) % 4),
    '=',
  );

  // Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(paddedBase64, 'base64').toString('binary');
  }

  // Browser environment
  if (typeof atob === 'function') {
    return atob(paddedBase64);
  }

  // Pure JavaScript implementation for environments without atob or Buffer
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;

  while (i < paddedBase64.length) {
    const enc1 = characters.indexOf(paddedBase64.charAt(i++));
    const enc2 = characters.indexOf(paddedBase64.charAt(i++));
    const enc3 = characters.indexOf(paddedBase64.charAt(i++));
    const enc4 = characters.indexOf(paddedBase64.charAt(i++));

    const char1 = (enc1 << 2) | (enc2 >> 4);
    const char2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const char3 = ((enc3 & 3) << 6) | enc4;

    result += String.fromCharCode(char1);
    if (enc3 !== 64) result += String.fromCharCode(char2);
    if (enc4 !== 64) result += String.fromCharCode(char3);
  }

  return result;
};

/**
 * Extracts the public key from a JSON Web Key (JWK) and encodes it in base64 URL format.
 *
 * @param {JsonWebKey} jwk - The JSON Web Key from which to extract the public key.
 * @returns {string} The base64 URL encoded public key.
 */
export const getPublicKeyFromJwk = (jwk: JsonWebKey): string =>
  base64UrlEncode(
    `\x04${base64Decode(base64UrlDecodeString(jwk.x))}${base64Decode(base64UrlDecodeString(jwk.y))}`,
  );

/**
 * Concatenates multiple Uint8Array instances into a single Uint8Array.
 *
 * @param {Uint8Array[]} arrays - An array of Uint8Array instances to concatenate.
 * @returns {Uint8Array} A new Uint8Array containing all the concatenated data.
 */
export const concatTypedArrays = (arrays: Uint8Array[]): Uint8Array => {
  const length = arrays.reduce(
    (accumulator, current) => accumulator + current.byteLength,
    0,
  );

  let index = 0;
  const targetArray = new Uint8Array(length);
  for (const array of arrays) {
    targetArray.set(array, index);
    index += array.byteLength;
  }

  return targetArray;
};
