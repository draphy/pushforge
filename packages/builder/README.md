<div align="center">

<img src="https://raw.githubusercontent.com/draphy/pushforge/master/images/logo.webp" alt="PushForge Logo" width="120" />

# PushForge Builder

**A lightweight, dependency-free Web Push library built on the standard Web Crypto API.**

[![npm version](https://img.shields.io/npm/v/@pushforge/builder.svg)](https://www.npmjs.com/package/@pushforge/builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-first--class-blue.svg)](https://www.typescriptlang.org/)

Send push notifications from any JavaScript runtime · Zero dependencies

[GitHub](https://github.com/draphy/pushforge) · [npm](https://www.npmjs.com/package/@pushforge/builder) · [Report Bug](https://github.com/draphy/pushforge/issues)

**[Try the Live Demo →](https://pushforge.draphy.org)**

</div>

---

```bash
npm install @pushforge/builder
```

## Live Demo

Try PushForge in your browser at **[pushforge.draphy.org](https://pushforge.draphy.org)** — a live test site running on Cloudflare Workers.

- Toggle push notifications on, send a test message, and see it arrive in real time
- Works across all supported browsers — Chrome, Firefox, Edge, Safari 16+
- The backend is a single Cloudflare Worker using `buildPushHTTPRequest()` with zero additional dependencies
- Subscriptions auto-expire after 5 minutes — no permanent data stored

## Why PushForge?

| | PushForge | web-push |
|---|:---:|:---:|
| Dependencies | **0** | 5+ (with nested deps) |
| Cloudflare Workers | Yes | [No](https://github.com/web-push-libs/web-push/issues/718) |
| Vercel Edge | Yes | No |
| Convex | Yes | No |
| Deno / Bun | Yes | Limited |
| TypeScript | First-class | @types package |

Traditional web push libraries rely on Node.js-specific APIs (`crypto.createECDH`, `https.request`) that don't work in modern edge runtimes. PushForge uses the standard [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API), making it portable across all JavaScript environments.

## Quick Start

### 1. Generate VAPID Keys

```bash
npx @pushforge/builder vapid
```

This outputs a public key (for your frontend) and a private key in JWK format (for your server).

### 2. Subscribe Users (Frontend)

Use the VAPID public key to subscribe users to push notifications:

```javascript
// In your frontend application
const registration = await navigator.serviceWorker.ready;

const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // From step 1
});

// Send this subscription to your server
// subscription.toJSON() returns:
// {
//   endpoint: "https://fcm.googleapis.com/fcm/send/...",
//   keys: {
//     p256dh: "BNcRd...",
//     auth: "tBHI..."
//   }
// }
await fetch('/api/subscribe', {
  method: 'POST',
  body: JSON.stringify(subscription)
});
```

### 3. Send Notifications (Server)

```typescript
import { buildPushHTTPRequest } from "@pushforge/builder";

// Your VAPID private key (JWK format from step 1)
const privateJWK = {
  kty: "EC",
  crv: "P-256",
  x: "...",
  y: "...",
  d: "..."
};

// The subscription object from the user's browser
const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/...",
  keys: {
    p256dh: "BNcRd...",
    auth: "tBHI..."
  }
};

// Build and send the notification
const { endpoint, headers, body } = await buildPushHTTPRequest({
  privateJWK,
  subscription,
  message: {
    payload: {
      title: "New Message",
      body: "You have a new notification!",
      icon: "/icon.png"
    },
    adminContact: "mailto:admin@example.com"
  }
});

const response = await fetch(endpoint, {
  method: "POST",
  headers,
  body
});

if (response.status === 201) {
  console.log("Notification sent");
}
```

## Understanding Push Subscriptions

When a user subscribes to push notifications, the browser returns a `PushSubscription` object:

```javascript
{
  // The unique URL for this user's browser push service
  endpoint: "https://fcm.googleapis.com/fcm/send/dAPT...",

  keys: {
    // Public key for encrypting messages (base64url)
    p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA...",

    // Authentication secret (base64url)
    auth: "tBHItJI5svbpez7KI4CCXg=="
  }
}
```

| Field | Description |
|-------|-------------|
| `endpoint` | The push service URL. Each browser vendor has their own (Google FCM, Mozilla autopush, Apple APNs). |
| `p256dh` | The user's public key for ECDH P-256 message encryption. |
| `auth` | A shared 16-byte authentication secret. |

Store these securely on your server. You'll need them to send notifications to this user.

## API Reference

### `buildPushHTTPRequest(options)`

Builds an HTTP request for sending a push notification.

```typescript
const { endpoint, headers, body } = await buildPushHTTPRequest({
  privateJWK,    // Your VAPID private key (JWK object or JSON string)
  subscription,  // User's push subscription
  message: {
    payload,       // Any JSON-serializable data
    adminContact,  // Contact email (mailto:...) or URL
    options: {     // Optional
      ttl,         // Time-to-live in seconds (default: 86400)
      urgency,     // "very-low" | "low" | "normal" | "high"
      topic        // Topic for notification coalescing
    }
  }
});
```

**Returns:** `{ endpoint: string, headers: Headers, body: ArrayBuffer }`

## Platform Examples

### Cloudflare Workers

```javascript
export default {
  async fetch(request, env) {
    const subscription = await request.json();

    const { endpoint, headers, body } = await buildPushHTTPRequest({
      privateJWK: JSON.parse(env.VAPID_PRIVATE_KEY),
      subscription,
      message: {
        payload: { title: "Hello from the Edge!" },
        adminContact: "mailto:admin@example.com"
      }
    });

    return fetch(endpoint, { method: "POST", headers, body });
  }
};
```

### Vercel Edge Functions

```typescript
import { buildPushHTTPRequest } from "@pushforge/builder";

export const config = { runtime: "edge" };

export default async function handler(request: Request) {
  const subscription = await request.json();

  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: JSON.parse(process.env.VAPID_PRIVATE_KEY!),
    subscription,
    message: {
      payload: { title: "Edge Notification" },
      adminContact: "mailto:admin@example.com"
    }
  });

  await fetch(endpoint, { method: "POST", headers, body });
  return new Response("Sent", { status: 200 });
}
```

### Convex

```typescript
import { action } from "./_generated/server";
import { buildPushHTTPRequest } from "@pushforge/builder";
import { v } from "convex/values";

export const sendPush = action({
  args: { subscription: v.any(), title: v.string(), body: v.string() },
  handler: async (ctx, { subscription, title, body }) => {
    const { endpoint, headers, body: reqBody } = await buildPushHTTPRequest({
      privateJWK: JSON.parse(process.env.VAPID_PRIVATE_KEY!),
      subscription,
      message: {
        payload: { title, body },
        adminContact: "mailto:admin@example.com"
      }
    });

    await fetch(endpoint, { method: "POST", headers, body: reqBody });
  }
});
```

### Deno

```typescript
import { buildPushHTTPRequest } from "npm:@pushforge/builder";

const { endpoint, headers, body } = await buildPushHTTPRequest({
  privateJWK: JSON.parse(Deno.env.get("VAPID_PRIVATE_KEY")!),
  subscription,
  message: {
    payload: { title: "Hello from Deno!" },
    adminContact: "mailto:admin@example.com"
  }
});

await fetch(endpoint, { method: "POST", headers, body });
```

### Bun

```typescript
import { buildPushHTTPRequest } from "@pushforge/builder";

const { endpoint, headers, body } = await buildPushHTTPRequest({
  privateJWK: JSON.parse(Bun.env.VAPID_PRIVATE_KEY!),
  subscription,
  message: {
    payload: { title: "Hello from Bun!" },
    adminContact: "mailto:admin@example.com"
  }
});

await fetch(endpoint, { method: "POST", headers, body });
```

## Service Worker Setup

Handle incoming push notifications in your service worker:

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.url
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});
```

## Requirements

**Node.js 20+** or any runtime with Web Crypto API support.

| Environment | Status |
|-------------|--------|
| Node.js 20+ | Fully supported |
| Cloudflare Workers | Fully supported |
| Vercel Edge | Fully supported |
| Deno | Fully supported |
| Bun | Fully supported |
| Convex | Fully supported |
| Modern Browsers | Fully supported |

<details>
<summary>Node.js 18 (requires polyfill)</summary>

```javascript
import { webcrypto } from "node:crypto";
globalThis.crypto = webcrypto;

import { buildPushHTTPRequest } from "@pushforge/builder";
```

Or: `node --experimental-global-webcrypto your-script.js`

</details>

## Security

PushForge validates all inputs before processing:

- VAPID key structure (EC P-256 curve with required x, y, d parameters)
- Subscription endpoint (must be valid HTTPS URL)
- p256dh key format (65-byte uncompressed P-256 point)
- Auth secret length (exactly 16 bytes)
- Payload size (max 4KB per Web Push spec)
- TTL bounds (max 24 hours per VAPID spec)

## License

MIT
