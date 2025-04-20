import { crypto } from './crypto.js';
import { encryptPayload } from './payload.js';
import type { BuilderOptions, PushOptions } from './types.js';
import { vapidHeaders } from './vapid.js';

/**
 * Builds an HTTP request body and headers for sending a push notification.
 *
 * This function constructs the necessary components for a push notification request,
 * including the payload, headers, and any required cryptographic operations.
 *
 * @param {BuilderOptions} options - The options for building the push notification request.
 * @param {JsonWebKey | string} options.privateJWK - The private JSON Web Key (JWK) used for signing.
 * @param {PushMessage} options.message - The message to be sent in the push notification, including user-defined options.
 * @param {PushSubscription} options.subscription - The subscription details for the push notification.
 * @returns {Promise<{ endpoint: string, body: ArrayBuffer, headers: Record<string, string> | Headers }>} A promise that resolves to an object containing the endpoint, encrypted body, and headers for the push notification.
 *
 * @throws {Error} Throws an error if the privateJWK is invalid, if the request fails, or if the payload encryption fails.
 */
export async function buildPushHTTPRequest({
  privateJWK,
  message,
  subscription,
}: BuilderOptions): Promise<{
  endpoint: string;
  body: ArrayBuffer;
  headers: Record<string, string> | Headers;
}> {
  // Parse the private JWK if it's a string
  const jwk: JsonWebKey =
    typeof privateJWK === 'string' ? JSON.parse(privateJWK) : privateJWK;

  // Determine the time-to-live (TTL) for the push notification
  const ttl =
    message.options?.ttl && message.options.ttl > 0
      ? message.options.ttl
      : 24 * 60 * 60; // Default to 24 hours

  // Create the JWT payload
  const jwt = {
    aud: new URL(subscription.endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + ttl,
    sub: message.adminContact,
  };

  // Construct the options for the push notification
  const options: PushOptions = {
    jwk,
    jwt,
    payload: JSON.stringify(message.payload),
    ttl,
    ...(message.options?.urgency && {
      urgency: message.options.urgency,
    }),
    ...(message.options?.topic && {
      topic: message.options.topic,
    }),
  };

  // Generate a random salt for encryption
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate local keys for encryption
  const localKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );

  // Encrypt the payload for the push notification
  const body = await encryptPayload(
    localKeys,
    salt,
    options.payload,
    subscription,
  );

  // Construct the VAPID headers for the push notification request
  const headers = await vapidHeaders(
    options,
    body.byteLength,
    salt,
    localKeys.publicKey,
  );

  // Return the constructed request components
  return { endpoint: subscription.endpoint, body, headers };
}
