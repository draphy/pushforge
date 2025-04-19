import type { Jsonifiable, RequireAtLeastOne } from './utils.js';

/**
 * Options for configuring the builder.
 */
export interface BuilderOptions {
  /**
   * The private JSON Web Key (JWK) used for signing.
   */
  privateJWK: JsonWebKey | string;

  /**
   * The subscription details for push notifications.
   */
  subscription: PushSubscription;

  /**
   * The message to be sent in the push notification.
   */
  message: PushMessage;
}

/**
 * Represents a push message to be sent.
 *
 * @template T - The type of the payload, which must be JSON-compatible.
 */
export interface PushMessage<T extends Jsonifiable = Jsonifiable> {
  /**
   * The payload of the push message, which can be any JSON-compatible value.
   */
  payload: T;

  /**
   * The contact information of the administrator, typically a URL or email address.
   */
  adminContact: JwtData['sub'];

  /**
   * Optional settings for the push message.
   * At least one of the specified options must be provided.
   */
  options?: RequireAtLeastOne<{
    /**
     * The time-to-live for the push message in seconds.
     */
    ttl?: PushOptions['ttl'];

    /**
     * The topic of the push message.
     */
    topic?: PushOptions['topic'];

    /**
     * The urgency level of the push message.
     */
    urgency?: PushOptions['urgency'];
  }>;
}

/**
 * Represents the data contained in a JSON Web Token (JWT).
 */
export interface JwtData {
  /**
   * The audience for the JWT, typically the origin of the push service.
   */
  aud: string;

  /**
   * The expiration time of the JWT, in seconds.
   * This prevents reuse of the JWT after it has expired.
   */
  exp: number;

  /**
   * The subject of the JWT, which should be a URL or a mailto email address.
   * This is used for contact information if the push service needs to reach out to the sender.
   */
  sub: string;
}

/**
 * Options for configuring a push notification.
 */
export interface PushOptions {
  /**
   * The JSON Web Key (JWK) used for signing the push notification.
   */
  jwk: JsonWebKey;

  /**
   * The JWT data associated with the push notification.
   */
  jwt: JwtData;

  /**
   * The payload of the push notification, typically a string.
   */
  payload: string;

  /**
   * The time-to-live for the push notification in seconds.
   * Must be a positive number greater than 0.
   * Default value is 24 * 60 * 60 (24 hours).
   * If set to 0, undefined, or a negative value, it will default to 24 hours.
   */
  ttl: number;

  /**
   * The topic of the push notification (optional).
   */
  topic?: string;

  /**
   * The urgency level of the push notification.
   */
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
}

/**
 * Represents the keys used for push subscription encryption.
 */
export interface PushSubscriptionKey {
  /**
   * The public key used for encrypting messages.
   */
  p256dh: string;

  /**
   * The authentication secret used for encrypting messages.
   */
  auth: string;
}

/**
 * Represents a push subscription, which includes the endpoint and keys.
 */
export interface PushSubscription {
  /**
   * The endpoint URL for the push service to send notifications.
   */
  endpoint: string;

  /**
   * The keys used for encrypting message data sent with the push notification.
   */
  keys: PushSubscriptionKey;
}
