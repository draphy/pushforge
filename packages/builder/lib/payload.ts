import {
  base64UrlDecode,
  base64UrlDecodeString,
  base64UrlEncode,
} from './base64.js';
import { crypto } from './crypto.js';
import { deriveSharedSecret } from './shared-secret.js';
import type { PushSubscription, PushSubscriptionKey } from './types.js';
import { concatTypedArrays } from './utils.js';

/**
 * Imports and validates the client's public and authentication keys from a PushSubscriptionKey.
 *
 * @param {PushSubscriptionKey} keys - The keys associated with the push subscription.
 * @returns {Promise<{ auth: ArrayBuffer, p256: CryptoKey }>} A promise that resolves to an object containing the authentication key and the imported public key.
 * @throws {Error} Throws an error if the authentication key length is incorrect.
 */
const importClientKeys = async (
  keys: PushSubscriptionKey,
): Promise<{ auth: ArrayBuffer; p256: CryptoKey }> => {
  const auth = base64UrlDecode(keys.auth);
  if (auth.byteLength !== 16) {
    throw new Error(
      `Incorrect auth length, expected 16 bytes but got ${auth.byteLength}`,
    );
  }

  let decodedKey: Uint8Array;
  const base64Key = base64UrlDecodeString(keys.p256dh);

  if (typeof globalThis !== 'undefined' && 'atob' in globalThis) {
    // Browser environment
    const binaryStr = globalThis.atob(base64Key);
    decodedKey = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      decodedKey[i] = binaryStr.charCodeAt(i);
    }
  } else {
    // Node.js environment
    decodedKey = new Uint8Array(Buffer.from(base64Key, 'base64'));
  }

  const p256 = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: base64UrlEncode(decodedKey.slice(1, 33)),
      y: base64UrlEncode(decodedKey.slice(33, 65)),
      ext: true,
    },
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    [],
  );

  return { auth, p256 };
};

/**
 * Derives a pseudo-random key using HKDF from the shared secret and authentication key.
 *
 * @param {ArrayBuffer} auth - The authentication key used as salt in the derivation process.
 * @param {CryptoKey} sharedSecret - The shared secret derived from the client's public key and local private key.
 * @returns {Promise<CryptoKey>} A promise that resolves to the derived pseudo-random key.
 */
const derivePseudoRandomKey = async (
  auth: ArrayBuffer,
  sharedSecret: CryptoKey,
): Promise<CryptoKey> => {
  const pseudoRandomKeyBytes = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: auth,
      // Adding Content-Encoding data info here is required by the Web Push API
      info: new TextEncoder().encode('Content-Encoding: auth\0'),
    },
    sharedSecret,
    256,
  );

  return crypto.subtle.importKey('raw', pseudoRandomKeyBytes, 'HKDF', false, [
    'deriveBits',
  ]);
};

/**
 * Creates a context for the ECDH key exchange using the client's and local public keys.
 *
 * @param {CryptoKey} clientPublicKey - The client's public key.
 * @param {CryptoKey} localPublicKey - The local public key.
 * @returns {Promise<Uint8Array>} A promise that resolves to a concatenated context array.
 */
const createContext = async (
  clientPublicKey: CryptoKey,
  localPublicKey: CryptoKey,
): Promise<Uint8Array> => {
  const [clientKeyBytes, localKeyBytes] = await Promise.all([
    crypto.subtle.exportKey('raw', clientPublicKey),
    crypto.subtle.exportKey('raw', localPublicKey),
  ]);

  return concatTypedArrays([
    new TextEncoder().encode('P-256\0'),
    new Uint8Array([0, clientKeyBytes.byteLength]),
    new Uint8Array(clientKeyBytes),
    new Uint8Array([0, localKeyBytes.byteLength]),
    new Uint8Array(localKeyBytes),
  ]);
};

/**
 * Derives a nonce for encryption using HKDF from the pseudo-random key, salt, and context.
 *
 * @param {CryptoKey} pseudoRandomKey - The pseudo-random key derived from the shared secret.
 * @param {Uint8Array} salt - The salt used in the derivation process.
 * @param {Uint8Array} context - The context for the nonce derivation.
 * @returns {Promise<ArrayBuffer>} A promise that resolves to the derived nonce.
 */
const deriveNonce = async (
  pseudoRandomKey: CryptoKey,
  salt: Uint8Array,
  context: Uint8Array,
): Promise<ArrayBuffer> => {
  const nonceInfo = concatTypedArrays([
    new TextEncoder().encode('Content-Encoding: nonce\0'),
    context,
  ]);

  return crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
    pseudoRandomKey,
    12 * 8, // 12 bytes for the nonce
  );
};

/**
 * Derives a content encryption key using HKDF from the pseudo-random key, salt, and context.
 *
 * @param {CryptoKey} pseudoRandomKey - The pseudo-random key derived from the shared secret.
 * @param {Uint8Array} salt - The salt used in the derivation process.
 * @param {Uint8Array} context - The context for the key derivation.
 * @returns {Promise<CryptoKey>} A promise that resolves to the derived content encryption key.
 */
const deriveContentEncryptionKey = async (
  pseudoRandomKey: CryptoKey,
  salt: Uint8Array,
  context: Uint8Array,
): Promise<CryptoKey> => {
  const info = concatTypedArrays([
    new TextEncoder().encode('Content-Encoding: aesgcm\0'),
    context,
  ]);

  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    pseudoRandomKey,
    16 * 8, // 16 bytes for the AES-GCM key
  );

  return crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt']);
};

/**
 * Pads the payload to ensure it fits within the maximum allowed size for web push notifications.
 *
 * Web push payloads have an overall max size of 4KB (4096 bytes). With the
 * required overhead for encryption, the actual max payload size is 4078 bytes.
 *
 * @param {Uint8Array} payload - The original payload to be padded.
 * @returns {Uint8Array} The padded payload, including length information.
 */
const padPayload = (payload: Uint8Array): Uint8Array => {
  const MAX_PAYLOAD_SIZE = 4078; // Maximum payload size after encryption overhead

  let paddingSize = Math.round(Math.random() * 100); // Random padding size
  const payloadSizeWithPadding = payload.byteLength + 2 + paddingSize;

  if (payloadSizeWithPadding > MAX_PAYLOAD_SIZE) {
    // Adjust padding size if the total exceeds the maximum allowed size
    paddingSize -= payloadSizeWithPadding - MAX_PAYLOAD_SIZE;
  }

  const paddingArray = new ArrayBuffer(2 + paddingSize);
  new DataView(paddingArray).setUint16(0, paddingSize); // Store the length of the padding

  // Return the new payload with padding added
  return concatTypedArrays([new Uint8Array(paddingArray), payload]);
};

/**
 * Encrypts the payload for a push notification using the provided keys and context.
 *
 * @param {CryptoKeyPair} localKeys - The local key pair used for encryption.
 * @param {Uint8Array} salt - The salt used in the encryption process.
 * @param {string} payload - The original payload to encrypt.
 * @param {PushSubscription} target - The target push subscription containing client keys.
 * @returns {Promise<ArrayBuffer>} A promise that resolves to the encrypted payload.
 */
export const encryptPayload = async (
  localKeys: CryptoKeyPair,
  salt: Uint8Array,
  payload: string,
  target: PushSubscription,
): Promise<ArrayBuffer> => {
  const clientKeys = await importClientKeys(target.keys);

  const sharedSecret = await deriveSharedSecret(
    clientKeys.p256,
    localKeys.privateKey,
  );
  const pseudoRandomKey = await derivePseudoRandomKey(
    clientKeys.auth,
    sharedSecret,
  );

  const context = await createContext(clientKeys.p256, localKeys.publicKey);
  const nonce = await deriveNonce(pseudoRandomKey, salt, context);
  const contentEncryptionKey = await deriveContentEncryptionKey(
    pseudoRandomKey,
    salt,
    context,
  );

  const encodedPayload = new TextEncoder().encode(payload);
  const paddedPayload = padPayload(encodedPayload);

  return crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    contentEncryptionKey,
    paddedPayload,
  );
};
