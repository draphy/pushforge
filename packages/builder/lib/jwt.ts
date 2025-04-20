import { base64UrlEncode } from './base64.js';
import { crypto } from './crypto.js';
import type { JwtData } from './types.js';

/**
 * Creates a JSON Web Token (JWT) using the ECDSA algorithm.
 *
 * This function takes a JSON Web Key (JWK) and JWT data, encodes them,
 * and signs the token using the specified algorithm and hash function.
 *
 * In the Web Push protocol, the VAPID JWT includes an `exp` (expiration) claim
 * that specifies the token's validity period. According to the VAPID specification,
 * the `exp` value must not exceed 24 hours from the time of the request. If it does,
 * the push service (like FCM) will reject the request with a 403 Forbidden error.
 *
 * @param {JsonWebKey} jwk - The JSON Web Key used for signing the JWT.
 * @param {JwtData} jwtData - The data to be included in the JWT payload.
 * @returns {Promise<string>} A promise that resolves to the signed JWT as a string.
 *
 * @throws {Error} Throws an error if the key import or signing process fails.
 */
export const createJwt = async (
  jwk: JsonWebKey,
  jwtData: JwtData,
): Promise<string> => {
  // JWT header information
  const jwtInfo = {
    typ: 'JWT', // Type of the token
    alg: 'ES256', // Algorithm used for signing
  };

  // Encode the JWT header and payload
  const base64JwtInfo = base64UrlEncode(JSON.stringify(jwtInfo));
  const base64JwtData = base64UrlEncode(JSON.stringify(jwtData));
  const unsignedToken = `${base64JwtInfo}.${base64JwtData}`;

  // Import the private key from the JWK
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign'],
  );

  // Sign the token using the ECDSA algorithm and SHA-256 hash
  const signature = await crypto.subtle
    .sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      privateKey,
      new TextEncoder().encode(unsignedToken),
    )
    .then((token) => base64UrlEncode(token));

  // Return the complete JWT
  return `${base64JwtInfo}.${base64JwtData}.${signature}`;
};
