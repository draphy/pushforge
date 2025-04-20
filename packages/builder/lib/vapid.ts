import { base64UrlEncode } from './base64.js';
import { crypto } from './crypto.js';
import { createJwt } from './jwt.js';
import type { PushOptions } from './types.js';
import { getPublicKeyFromJwk } from './utils.js';

/**
 * Constructs the VAPID headers for a push notification request.
 *
 * This function generates the necessary headers for sending a push notification
 * using the VAPID protocol, including authentication and encryption information.
 *
 * @param {PushOptions} options - The options for the push notification, including the JSON Web Key (JWK) and JWT data.
 * @param {number} payloadLength - The length of the payload being sent in the push notification.
 * @param {Uint8Array} salt - A salt value used in the encryption process.
 * @param {CryptoKey} localPublicKey - The local public key used for encryption.
 * @returns {Promise<Record<string, string> | Headers>} A promise that resolves to an object containing the VAPID headers.
 *
 * @throws {Error} Throws an error if the JWT creation fails or if key export fails.
 */
export const vapidHeaders = async (
  options: PushOptions,
  payloadLength: number,
  salt: Uint8Array,
  localPublicKey: CryptoKey,
) => {
  // Export the local public key to a raw format and encode it in Base64 URL format
  const localPublicKeyBase64 = await crypto.subtle
    .exportKey('raw', localPublicKey)
    .then((bytes) => base64UrlEncode(bytes));

  // Get the server public key from the JWK
  const serverPublicKey = getPublicKeyFromJwk(options.jwk);

  // Create the JWT for authentication
  const jwt = await createJwt(options.jwk, options.jwt);

  // Construct the header values for the VAPID request
  const headerValues: Record<string, string> = {
    Encryption: `salt=${base64UrlEncode(salt)}`,
    'Crypto-Key': `dh=${localPublicKeyBase64}`,
    'Content-Length': payloadLength.toString(),
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aesgcm',
    Authorization: `vapid t=${jwt}, k=${serverPublicKey}`,
  };

  let headers: Record<string, string> | Headers;

  // Add optional headers if they are defined
  if (options.ttl !== undefined) headerValues.TTL = options.ttl.toString();
  if (options.topic !== undefined) headerValues.Topic = options.topic;
  if (options.urgency !== undefined) headerValues.Urgency = options.urgency;

  // Create Headers object if available (for browser or Node.js 18+)
  if (typeof Headers !== 'undefined') {
    headers = new Headers(headerValues);
  } else {
    // Fallback for Node.js < 18 without polyfill
    headers = headerValues;
  }

  return headers; // Return the constructed headers
};
