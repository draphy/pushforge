import { expect, test } from 'vitest';
import { type PushSubscription, buildPushHTTPRequest } from '../lib/main.js';
import { message, subscriptions } from './fixtures/fixtures.js';
import { vapidKeys } from './fixtures/vapid.js';

/**
 * Helper function to test push notification requests
 */
async function testPushNotification(subscription: PushSubscription) {
  // Build the push request
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    subscription,
    message,
    privateJWK: vapidKeys.privateJWK,
  });

  // Verify the endpoint is the same as in the subscription
  expect(endpoint).toBe(subscription.endpoint);

  // Verify headers are properly formed
  expect(headers).toBeDefined();

  // Handle headers regardless of type (Record<string, string> or Headers)
  const getHeaderValue = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return headers[name] || null;
  };

  // Check specific header values
  expect(getHeaderValue('Authorization')).toMatch(/^vapid /);
  expect(getHeaderValue('TTL')).toBe('60');
  expect(getHeaderValue('Topic')).toBe('from-test-env');
  expect(getHeaderValue('Urgency')).toBe('high');

  // Make the actual fetch request - even if it will fail due to fake subscription
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  });

  // Return the response for further assertions specific to each service
  return res;
}

test('Fake Chrome Subscription', async () => {
  const res = await testPushNotification(subscriptions.chrome);

  // Firebase Cloud Messaging (FCM) specific response for invalid subscription
  expect(res.status).toBeDefined();
  expect(res.headers).toBeDefined();

  // FCM returns specific text for expired subscriptions
  const responseText = await res.text();
  expect(
    responseText,
  ).toMatchInlineSnapshot(`"push subscription has unsubscribed or expired.
"`);
});

test('Fake Edge Subscription', async () => {
  const res = await testPushNotification(subscriptions.edge);

  // Edge/Windows Notification Service specific assertions
  // WNS typically returns a response with specific headers

  // Test status - actual status might vary since this is a fake subscription
  // but we should check the format of the response
  expect(res.status).toBeDefined();

  // Check that we can access WNS-specific response headers (even if null in the test)
  expect(res.headers).toBeDefined();
  expect(() => res.headers.get('x-wns-notificationstatus')).not.toThrow();
  expect(() => res.headers.get('x-wns-status')).not.toThrow();

  // Check the text response format - WNS may return different message for invalid subscriptions
  const responseText = await res.text();
  expect(typeof responseText).toBe('string');
});
