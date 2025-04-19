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
 * Extracts the public key from a JSON Web Key (JWK) and encodes it in base64 URL format.
 *
 * @param {JsonWebKey} jwk - The JSON Web Key from which to extract the public key.
 * @returns {string} The base64 URL encoded public key.
 */
export const getPublicKeyFromJwk = (jwk: JsonWebKey): string =>
  base64UrlEncode(
    `\x04${atob(base64UrlDecodeString(jwk.x))}${atob(base64UrlDecodeString(jwk.y))}`,
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
