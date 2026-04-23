<div align="center">

<img src="https://raw.githubusercontent.com/draphy/pushforge/master/images/logo.webp" alt="PushForge Logo" width="120" />

# PushForge Builder

**A lightweight, dependency-free Web Push library built on the standard Web Crypto API.**

[![npm version](https://img.shields.io/npm/v/@pushforge/builder.svg)](https://www.npmjs.com/package/@pushforge/builder)
[![npm downloads](https://img.shields.io/npm/dm/@pushforge/builder?logo=npm&color=brightgreen&cacheSeconds=86400)](https://www.npmjs.com/package/@pushforge/builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-first--class-blue.svg)](https://www.typescriptlang.org/)

Send push notifications from any JavaScript runtime · Zero dependencies

[GitHub](https://github.com/draphy/pushforge) · [npm](https://www.npmjs.com/package/@pushforge/builder) · [Report Bug](https://github.com/draphy/pushforge/issues)

**[Try the Playground →](https://pushforge.draphy.org)**

</div>

---

```bash
npm install @pushforge/builder
```

## Playground

Test PushForge in your browser at **[pushforge.draphy.org](https://pushforge.draphy.org)** — an interactive playground for testing push notifications, powered by Cloudflare Workers.

- **Quick Test** — enable notifications, send a test message, see it arrive in real time
- **Topic Channels** — test targeted notifications by subscribing to specific channels
- **Notification Customization** — experiment with title, body, icon, image, action buttons, vibration, click URL
- **Push Options** — test urgency levels (battery hints) and TTL (message expiry)
- **Cross-Browser** — test across Chrome, Firefox, Edge, Safari 16+
- Subscriptions auto-expire (5 min for quick test, 1 hour for topics) — no permanent data stored
- The backend is a single Cloudflare Worker using `buildPushHTTPRequest()` with zero dependencies

## Why PushForge?

| | PushForge | web-push |
|---|:---:|:---:|
| Dependencies | **0** | 5+ (with nested deps) |
| Cloudflare Workers | Yes | [No](https://github.com/web-push-libs/web-push/issues/718) |
| Vercel Edge | Yes | No |
| Convex | Yes* | No |
| Deno / Bun | Yes | Limited |
| TypeScript | First-class | @types package |

\* Convex requires `"use node";` directive. [See example](#convex).

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
      ttl,         // Time-to-live in seconds (default: 86400, max: 86400)
      urgency,     // "very-low" | "low" | "normal" | "high"
      topic        // Topic for notification replacement
    }
  }
});
```

**Returns:** `{ endpoint: string, headers: Headers, body: ArrayBuffer }`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `privateJWK` | JsonWebKey \| string | Yes | Your VAPID private key (JWK object or JSON string) |
| `subscription` | PushSubscription | Yes | User's push subscription with `endpoint` and `keys` |
| `message.payload` | any | Yes | Any JSON-serializable data to send (see [Notification Payload](#notification-payload)) |
| `message.adminContact` | string | Yes | Contact for push service (`mailto:you@example.com` or URL) |
| `message.options` | object | No | Push delivery options (see below) |

#### Push Options (Web Push Protocol Headers)

These options control how the push service handles message delivery:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ttl` | number | 86400 | Time-to-live in seconds. How long the push service retains the message if user is offline. Max 24 hours. |
| `urgency` | string | - | Battery hint: `"very-low"` (ads), `"low"` (topic updates), `"normal"` (chat), `"high"` (calls/time-sensitive). |
| `topic` | string | - | Topic identifier. New message with same topic replaces pending one at push service level (before delivery). |

#### TypeScript Types

For TypeScript users, these types are exported:

```typescript
import type { 
  BuilderOptions,    // Parameter type for buildPushHTTPRequest
  PushMessage,       // The message object type
  PushSubscription   // The subscription object type
} from "@pushforge/builder";
```

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

> **Note:** Convex's default runtime doesn't support ECDH operations required by Web Push. Add `"use node";` to use the Node.js runtime.

```typescript
"use node";

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

## How It Works

```
Your Server (PushForge) → Push Service (FCM/APNs) → Service Worker → User's Device
```

**PushForge handles:**
- Encrypts payload
- Signs with VAPID
- Sets ttl/urgency/topic headers

**Your service worker handles:**
- Displays notification (title, body, icon, actions, etc.)
- Handles clicks

## Notification Payload

The `payload` field accepts any JSON-serializable data — PushForge encrypts and delivers it as-is. Your service worker receives this payload and passes it to the browser's `showNotification()` API.

> **Note:** These are standard [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notification) options, not PushForge-specific. PushForge handles the transport; your service worker handles the display.

Common fields:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Notification title (required) |
| `body` | string | Notification body text |
| `icon` | string | URL for the notification icon |
| `badge` | string | URL for the badge (small monochrome icon) |
| `image` | string | URL for a large image |
| `dir` | string | Text direction: `"auto"`, `"ltr"`, or `"rtl"` |
| `lang` | string | Language tag (e.g., `"en-US"`, `"es"`) |
| `tag` | string | Tag for notification replacement (same tag = replace, not stack) |
| `renotify` | boolean | Vibrate/alert again when replacing a notification with same tag |
| `requireInteraction` | boolean | Keep notification visible until user interacts |
| `silent` | boolean | Suppress sound and vibration |
| `timestamp` | number | Timestamp in milliseconds (e.g., `Date.now()`) |
| `vibrate` | number[] | Vibration pattern `[vibrate, pause, vibrate, ...]` |
| `actions` | array | Action buttons (max 2): `[{ action: "id", title: "Label", icon?: "url" }]` |
| `data` | object | Custom data (e.g., `{ url: "/page" }` for click handling) |

Example with full options:

```typescript
const { endpoint, headers, body } = await buildPushHTTPRequest({
  privateJWK,
  subscription,
  message: {
    payload: {
      title: "New Message",
      body: "John: Hey, are you free?",
      icon: "/icons/chat.png",
      badge: "/icons/badge.png",
      image: "/images/preview.jpg",
      tag: "chat-john",
      renotify: true,
      actions: [
        { action: "reply", title: "Reply" },
        { action: "dismiss", title: "Dismiss" }
      ],
      data: { url: "/chat/john", messageId: "123" }
    },
    adminContact: "mailto:admin@example.com",
    options: { urgency: "high", ttl: 3600 }
  }
});
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
      image: data.image,
      dir: data.dir,
      lang: data.lang,
      tag: data.tag,
      renotify: data.renotify,
      requireInteraction: data.requireInteraction,
      silent: data.silent,
      timestamp: data.timestamp,
      vibrate: data.vibrate,
      actions: data.actions,
      data: data.data
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle action button clicks
  if (event.action === 'reply') {
    clients.openWindow('/chat?action=reply');
    return;
  }

  // Handle main notification click
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
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
| Convex | Requires `"use node";` ([example](#convex)) |
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

## Contributing

Contributions welcome! See [CONTRIBUTING.md](https://github.com/draphy/pushforge/blob/master/CONTRIBUTING.md) for guidelines.

## License

MIT © [David Raphi](https://github.com/draphy)
