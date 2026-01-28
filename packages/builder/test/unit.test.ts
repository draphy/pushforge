import { describe, expect, test } from 'vitest';
import { buildPushHTTPRequest } from '../lib/main.js';
import type {
  BuilderOptions,
  PushMessage,
  PushSubscription,
} from '../lib/types.js';
import { subscriptions } from './fixtures/fixtures.js';
import { vapidKeys } from './fixtures/vapid.js';

/**
 * Valid test data for reuse across tests
 */
const validSubscription: PushSubscription = subscriptions.chrome;

const validMessage: PushMessage = {
  payload: { title: 'Test', body: 'Test message' },
  adminContact: 'mailto:test@example.com',
  options: { ttl: 3600 },
};

const validPrivateJWK = vapidKeys.privateJWK;

/**
 * Helper to create BuilderOptions with overrides
 */
const createOptions = (
  overrides: Partial<BuilderOptions> = {},
): BuilderOptions => ({
  privateJWK: validPrivateJWK,
  subscription: validSubscription,
  message: validMessage,
  ...overrides,
});

// ============================================================================
// JWK Validation Tests
// ============================================================================
describe('JWK Validation', () => {
  test('accepts valid JWK as string', async () => {
    const result = await buildPushHTTPRequest(createOptions());
    expect(result.endpoint).toBe(validSubscription.endpoint);
    expect(result.body).toBeInstanceOf(ArrayBuffer);
    expect(result.headers).toBeDefined();
  });

  test('accepts valid JWK as object', async () => {
    const jwkObject = JSON.parse(validPrivateJWK);
    const result = await buildPushHTTPRequest(
      createOptions({ privateJWK: jwkObject }),
    );
    expect(result.endpoint).toBe(validSubscription.endpoint);
  });

  test('rejects invalid JSON string', async () => {
    await expect(
      buildPushHTTPRequest(createOptions({ privateJWK: 'not valid json' })),
    ).rejects.toThrow('Invalid privateJWK: failed to parse JSON string');
  });

  test('rejects JWK with wrong kty', async () => {
    const invalidJWK = { ...JSON.parse(validPrivateJWK), kty: 'RSA' };
    await expect(
      buildPushHTTPRequest(createOptions({ privateJWK: invalidJWK })),
    ).rejects.toThrow("Invalid JWK: 'kty' must be 'EC', received 'RSA'");
  });

  test('rejects JWK with wrong curve', async () => {
    const invalidJWK = { ...JSON.parse(validPrivateJWK), crv: 'P-384' };
    await expect(
      buildPushHTTPRequest(createOptions({ privateJWK: invalidJWK })),
    ).rejects.toThrow("Invalid JWK: 'crv' must be 'P-256', received 'P-384'");
  });

  test('rejects JWK missing x coordinate', async () => {
    const invalidJWK = JSON.parse(validPrivateJWK);
    invalidJWK.x = undefined;
    await expect(
      buildPushHTTPRequest(createOptions({ privateJWK: invalidJWK })),
    ).rejects.toThrow("Invalid JWK: missing or invalid 'x' coordinate");
  });

  test('rejects JWK missing y coordinate', async () => {
    const invalidJWK = JSON.parse(validPrivateJWK);
    invalidJWK.y = undefined;
    await expect(
      buildPushHTTPRequest(createOptions({ privateJWK: invalidJWK })),
    ).rejects.toThrow("Invalid JWK: missing or invalid 'y' coordinate");
  });

  test('rejects JWK missing d (private key)', async () => {
    const invalidJWK = JSON.parse(validPrivateJWK);
    invalidJWK.d = undefined;
    await expect(
      buildPushHTTPRequest(createOptions({ privateJWK: invalidJWK })),
    ).rejects.toThrow("Invalid JWK: missing or invalid 'd' (private key)");
  });

  test('rejects JWK with missing kty', async () => {
    const invalidJWK = JSON.parse(validPrivateJWK);
    invalidJWK.kty = undefined;
    await expect(
      buildPushHTTPRequest(createOptions({ privateJWK: invalidJWK })),
    ).rejects.toThrow("Invalid JWK: 'kty' must be 'EC', received 'undefined'");
  });
});

// ============================================================================
// Endpoint Validation Tests
// ============================================================================
describe('Endpoint Validation', () => {
  test('accepts valid HTTPS endpoint', async () => {
    const result = await buildPushHTTPRequest(createOptions());
    expect(result.endpoint).toBe(validSubscription.endpoint);
  });

  test('rejects HTTP endpoint', async () => {
    const httpSubscription: PushSubscription = {
      ...validSubscription,
      endpoint: 'http://example.com/push',
    };
    await expect(
      buildPushHTTPRequest(createOptions({ subscription: httpSubscription })),
    ).rejects.toThrow("push endpoints must use HTTPS, received 'http:'");
  });

  test('rejects invalid URL', async () => {
    const invalidSubscription: PushSubscription = {
      ...validSubscription,
      endpoint: 'not-a-valid-url',
    };
    await expect(
      buildPushHTTPRequest(
        createOptions({ subscription: invalidSubscription }),
      ),
    ).rejects.toThrow('is not a valid URL');
  });

  test('rejects empty endpoint', async () => {
    const emptySubscription: PushSubscription = {
      ...validSubscription,
      endpoint: '',
    };
    await expect(
      buildPushHTTPRequest(createOptions({ subscription: emptySubscription })),
    ).rejects.toThrow('is not a valid URL');
  });
});

// ============================================================================
// Subscription Keys Validation Tests
// ============================================================================
describe('Subscription Keys Validation', () => {
  test('accepts valid p256dh and auth keys', async () => {
    const result = await buildPushHTTPRequest(createOptions());
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('rejects invalid p256dh key (wrong length)', async () => {
    const invalidSubscription: PushSubscription = {
      ...validSubscription,
      keys: {
        ...validSubscription.keys,
        p256dh: 'AAAA', // Too short - will decode to ~3 bytes instead of 65
      },
    };
    await expect(
      buildPushHTTPRequest(
        createOptions({ subscription: invalidSubscription }),
      ),
    ).rejects.toThrow('Invalid p256dh key: expected 65 bytes');
  });

  test('rejects invalid auth key (wrong length)', async () => {
    const invalidSubscription: PushSubscription = {
      ...validSubscription,
      keys: {
        ...validSubscription.keys,
        auth: 'AAAA', // Too short - will decode to ~3 bytes instead of 16
      },
    };
    await expect(
      buildPushHTTPRequest(
        createOptions({ subscription: invalidSubscription }),
      ),
    ).rejects.toThrow('Incorrect auth length, expected 16 bytes');
  });

  test('rejects empty p256dh key', async () => {
    const invalidSubscription: PushSubscription = {
      ...validSubscription,
      keys: {
        ...validSubscription.keys,
        p256dh: '',
      },
    };
    await expect(
      buildPushHTTPRequest(
        createOptions({ subscription: invalidSubscription }),
      ),
    ).rejects.toThrow();
  });

  test('rejects empty auth key', async () => {
    const invalidSubscription: PushSubscription = {
      ...validSubscription,
      keys: {
        ...validSubscription.keys,
        auth: '',
      },
    };
    await expect(
      buildPushHTTPRequest(
        createOptions({ subscription: invalidSubscription }),
      ),
    ).rejects.toThrow('Invalid input');
  });
});

// ============================================================================
// TTL Validation Tests
// ============================================================================
describe('TTL Validation', () => {
  test('accepts TTL within 24 hours', async () => {
    const message: PushMessage = {
      ...validMessage,
      options: { ttl: 3600 }, // 1 hour
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.headers).toBeDefined();
  });

  test('accepts TTL of exactly 24 hours', async () => {
    const message: PushMessage = {
      ...validMessage,
      options: { ttl: 24 * 60 * 60 }, // 24 hours
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.headers).toBeDefined();
  });

  test('rejects TTL exceeding 24 hours', async () => {
    const message: PushMessage = {
      ...validMessage,
      options: { ttl: 24 * 60 * 60 + 1 }, // 24 hours + 1 second
    };
    await expect(
      buildPushHTTPRequest(createOptions({ message })),
    ).rejects.toThrow('TTL must be less than 24 hours');
  });

  test('uses default TTL when not specified', async () => {
    const message: PushMessage = {
      payload: { title: 'Test' },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    // Default TTL should be 24 hours = 86400 seconds
    expect(getHeaderValue('TTL')).toBe('86400');
  });

  test('uses default TTL when TTL is 0', async () => {
    const message: PushMessage = {
      ...validMessage,
      options: { ttl: 0 },
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    expect(getHeaderValue('TTL')).toBe('86400');
  });
});

// ============================================================================
// Payload Tests
// ============================================================================
describe('Payload Handling', () => {
  test('encrypts simple payload', async () => {
    const result = await buildPushHTTPRequest(createOptions());
    expect(result.body).toBeInstanceOf(ArrayBuffer);
    expect(result.body.byteLength).toBeGreaterThan(0);
  });

  test('encrypts empty object payload', async () => {
    const message: PushMessage = {
      payload: {},
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('encrypts payload with unicode characters', async () => {
    const message: PushMessage = {
      payload: { title: '你好世界', body: '🎉🚀✨' },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('encrypts payload with special characters', async () => {
    const message: PushMessage = {
      payload: {
        title: 'Test <script>alert("xss")</script>',
        body: 'Line1\nLine2\tTabbed',
      },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('encrypts large payload (under limit)', async () => {
    // Create a payload close to but under the 4076 byte limit
    const largeData = 'x'.repeat(3000);
    const message: PushMessage = {
      payload: { data: largeData },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('rejects payload exceeding size limit', async () => {
    // Create a payload that exceeds the 4076 byte limit
    const hugeData = 'x'.repeat(5000);
    const message: PushMessage = {
      payload: { data: hugeData },
      adminContact: 'mailto:test@example.com',
    };
    await expect(
      buildPushHTTPRequest(createOptions({ message })),
    ).rejects.toThrow('Payload too large');
  });
});

// ============================================================================
// Headers Tests
// ============================================================================
describe('Headers Construction', () => {
  test('includes required headers', async () => {
    const result = await buildPushHTTPRequest(createOptions());

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    expect(getHeaderValue('Authorization')).toMatch(/^vapid t=.+, k=.+$/);
    expect(getHeaderValue('Content-Type')).toBe('application/octet-stream');
    expect(getHeaderValue('Content-Encoding')).toBe('aesgcm');
    expect(getHeaderValue('TTL')).toBeDefined();
    expect(getHeaderValue('Encryption')).toMatch(/^salt=/);
    expect(getHeaderValue('Crypto-Key')).toMatch(/^dh=/);
  });

  test('includes optional Topic header when specified', async () => {
    const message: PushMessage = {
      ...validMessage,
      options: { ...validMessage.options, topic: 'test-topic' },
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    expect(getHeaderValue('Topic')).toBe('test-topic');
  });

  test('includes optional Urgency header when specified', async () => {
    const message: PushMessage = {
      ...validMessage,
      options: { ...validMessage.options, urgency: 'high' },
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    expect(getHeaderValue('Urgency')).toBe('high');
  });

  test('omits Topic header when not specified', async () => {
    const message: PushMessage = {
      payload: validMessage.payload,
      adminContact: validMessage.adminContact,
      options: { ttl: 3600 }, // No topic
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    expect(getHeaderValue('Topic')).toBeNull();
  });

  test('omits Urgency header when not specified', async () => {
    const message: PushMessage = {
      payload: validMessage.payload,
      adminContact: validMessage.adminContact,
      options: { ttl: 3600 }, // No urgency
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    expect(getHeaderValue('Urgency')).toBeNull();
  });
});

// ============================================================================
// VAPID Authorization Tests
// ============================================================================
describe('VAPID Authorization', () => {
  test('generates valid VAPID authorization header', async () => {
    const result = await buildPushHTTPRequest(createOptions());

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    const authHeader = getHeaderValue('Authorization');
    expect(authHeader).toMatch(
      /^vapid t=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+, k=[A-Za-z0-9_-]+$/,
    );
  });

  test('JWT contains correct audience', async () => {
    const result = await buildPushHTTPRequest(createOptions());

    const getHeaderValue = (name: string): string | null => {
      if (result.headers instanceof Headers) {
        return result.headers.get(name);
      }
      return result.headers[name] || null;
    };

    const authHeader = getHeaderValue('Authorization');
    expect(authHeader).not.toBeNull();

    const tokenMatch = authHeader?.match(
      /t=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/,
    );
    expect(tokenMatch).not.toBeNull();

    const [, payload] = tokenMatch?.[1].split('.') ?? [];
    const decodedPayload = JSON.parse(
      Buffer.from(
        payload.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString(),
    );

    expect(decodedPayload.aud).toBe('https://fcm.googleapis.com');
    expect(decodedPayload.sub).toBe(validMessage.adminContact);
    expect(decodedPayload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

// ============================================================================
// Multiple Subscriptions Tests
// ============================================================================
describe('Multiple Subscription Types', () => {
  test('handles Chrome/FCM subscription', async () => {
    const result = await buildPushHTTPRequest(
      createOptions({
        subscription: subscriptions.chrome,
      }),
    );
    expect(result.endpoint).toContain('fcm.googleapis.com');
  });

  test('handles Edge/WNS subscription', async () => {
    const result = await buildPushHTTPRequest(
      createOptions({
        subscription: subscriptions.edge,
      }),
    );
    expect(result.endpoint).toContain('notify.windows.com');
  });
});

// ============================================================================
// Consistency Tests
// ============================================================================
describe('Output Consistency', () => {
  test('produces different encrypted bodies for same input (due to random salt)', async () => {
    const options = createOptions();
    const result1 = await buildPushHTTPRequest(options);
    const result2 = await buildPushHTTPRequest(options);

    // Bodies should be different due to random salt and padding
    const body1 = new Uint8Array(result1.body);
    const body2 = new Uint8Array(result2.body);

    // At least some bytes should differ
    let hasDifference = false;
    for (let i = 0; i < Math.min(body1.length, body2.length); i++) {
      if (body1[i] !== body2[i]) {
        hasDifference = true;
        break;
      }
    }
    expect(hasDifference).toBe(true);
  });

  test('produces consistent endpoint', async () => {
    const options = createOptions();
    const result1 = await buildPushHTTPRequest(options);
    const result2 = await buildPushHTTPRequest(options);

    expect(result1.endpoint).toBe(result2.endpoint);
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================
describe('Edge Cases', () => {
  test('handles null values in payload', async () => {
    const message: PushMessage = {
      payload: { title: 'Test', nullValue: null },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('handles nested objects in payload', async () => {
    const message: PushMessage = {
      payload: {
        title: 'Test',
        data: {
          nested: {
            deeply: {
              value: 'test',
            },
          },
        },
      },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('handles arrays in payload', async () => {
    const message: PushMessage = {
      payload: {
        title: 'Test',
        items: [1, 2, 3, 'four', { five: 5 }],
      },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('handles boolean values in payload', async () => {
    const message: PushMessage = {
      payload: {
        isTrue: true,
        isFalse: false,
      },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('handles numeric values in payload', async () => {
    const message: PushMessage = {
      payload: {
        integer: 42,
        float: 3.14,
        negative: -100,
        zero: 0,
      },
      adminContact: 'mailto:test@example.com',
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });

  test('handles very long adminContact', async () => {
    const message: PushMessage = {
      payload: { title: 'Test' },
      adminContact: `mailto:${'a'.repeat(200)}@example.com`,
    };
    const result = await buildPushHTTPRequest(createOptions({ message }));
    expect(result.body).toBeInstanceOf(ArrayBuffer);
  });
});
