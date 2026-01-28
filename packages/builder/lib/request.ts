import { crypto } from './crypto.js';
import { encryptPayload } from './payload.js';
import type { BuilderOptions, PushOptions } from './types.js';
import { vapidHeaders } from './vapid.js';

/**
 * Validates that a JWK has the required properties for ECDSA P-256.
 *
 * @param {JsonWebKey} jwk - The JSON Web Key to validate.
 * @throws {Error} Throws if the JWK is missing required properties or has invalid values.
 */
const validatePrivateJWK = (jwk: JsonWebKey): void => {
  if (jwk.kty !== 'EC') {
    throw new Error(
      `Invalid JWK: 'kty' must be 'EC', received '${jwk.kty ?? 'undefined'}'`,
    );
  }

  if (jwk.crv !== 'P-256') {
    throw new Error(
      `Invalid JWK: 'crv' must be 'P-256', received '${jwk.crv ?? 'undefined'}'`,
    );
  }

  if (!jwk.x || typeof jwk.x !== 'string') {
    throw new Error("Invalid JWK: missing or invalid 'x' coordinate");
  }

  if (!jwk.y || typeof jwk.y !== 'string') {
    throw new Error("Invalid JWK: missing or invalid 'y' coordinate");
  }

  if (!jwk.d || typeof jwk.d !== 'string') {
    throw new Error("Invalid JWK: missing or invalid 'd' (private key)");
  }
};

/**
 * Validates that the subscription endpoint is a valid HTTPS URL.
 *
 * @param {string} endpoint - The push subscription endpoint URL.
 * @throws {Error} Throws if the endpoint is not a valid HTTPS URL.
 */
const validateEndpoint = (endpoint: string): void => {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error(
      `Invalid subscription endpoint: '${endpoint}' is not a valid URL`,
    );
  }

  if (url.protocol !== 'https:') {
    throw new Error(
      `Invalid subscription endpoint: push endpoints must use HTTPS, received '${url.protocol}'`,
    );
  }
};

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
 *
 * @example
 * // Example usage
 * const privateJWK = '{"kty":"EC","crv":"P-256","d":"_eQ..."}'; // Your private VAPID key
 *
 * const message = {
 *   payload: {
 *     title: "New Message",
 *     body: "You have a new message!",
 *     icon: "/images/icon.png"
 *   },
 *   options: {
 *     ttl: 3600, // 1 hour in seconds
 *     urgency: "high",
 *     topic: "new-messages"
 *   },
 *   adminContact: "mailto:admin@example.com"
 * };
 *
 * const subscription = {
 *   endpoint: "https://fcm.googleapis.com/fcm/send/...",
 *   keys: {
 *     p256dh: "BNn5....",
 *     auth: "tBHI...."
 *   }
 * };
 *
 * // Build the request
 * const request = await buildPushHTTPRequest({
 *   privateJWK,
 *   message,
 *   subscription
 * });
 *
 * // Send the push notification
 * const response = await fetch(request.endpoint, {
 *   method: 'POST',
 *   headers: request.headers,
 *   body: request.body
 * });
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
  let jwk: JsonWebKey;
  try {
    jwk = typeof privateJWK === 'string' ? JSON.parse(privateJWK) : privateJWK;
  } catch {
    throw new Error('Invalid privateJWK: failed to parse JSON string');
  }

  // Validate the JWK structure
  validatePrivateJWK(jwk);

  // Validate the subscription endpoint
  validateEndpoint(subscription.endpoint);

  const MAX_TTL = 24 * 60 * 60;

  if (message.options?.ttl && message.options.ttl > MAX_TTL) {
    throw new Error('TTL must be less than 24 hours');
  }

  // Determine the time-to-live (TTL) for the push notification
  const ttl =
    message.options?.ttl && message.options.ttl > 0
      ? message.options.ttl
      : MAX_TTL; // Default to 24 hours

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
