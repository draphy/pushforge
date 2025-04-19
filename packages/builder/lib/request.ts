import { crypto } from './crypto.js';
import type { BuilderOptions, PushOptions } from './types.js';

/**
 * Builds an HTTP request body and headers for sending a push notification.
 *
 * @param {BuilderOptions} options - The options for building the push notification request.
 * @param {JsonWebKey | string} options.privateJWK - The private JSON Web Key (JWK) used for signing.
 * @param {PushMessage} options.message - The message to be sent in the push notification with user defined options.
 * @param {PushSubscription} options.subscription - The subscription details for the push notification.
 *
 * @throws {Error} Throws an error if the privateJWK is invalid or if the request fails.
 */
export async function buildPushHTTPRequest({
  privateJWK,
  message,
  subscription,
}: BuilderOptions) {
  const jwk: JsonWebKey =
    typeof privateJWK === 'string' ? JSON.parse(privateJWK) : privateJWK;

  const ttl =
    message.options?.ttl && message.options.ttl > 0
      ? message.options.ttl
      : 24 * 60 * 60; // Default to 24 hours
  const jwt = {
    aud: new URL(subscription.endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + ttl,
    sub: message.adminContact,
  };

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

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const localKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  );
}
