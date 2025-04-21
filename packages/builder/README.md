# PushForge Builder

A robust, cross-platform Web Push notification library that handles VAPID authentication and payload encryption following the Web Push Protocol standard.

## Installation

Choose your preferred package manager:

```bash
# NPM
npm install @pushforge/builder

# Yarn
yarn add @pushforge/builder

# pnpm
pnpm add @pushforge/builder
```

## Features

- 🔑 Compliant VAPID authentication
- 🔒 Web Push Protocol encryption
- 🌐 Cross-platform compatibility (Node.js 16+, Browsers, Deno, Bun, Cloudflare Workers)
- 🧩 TypeScript definitions included
- 🛠️ Zero dependencies

## Getting Started

### Step 1: Generate VAPID Keys

PushForge includes a built-in CLI tool to generate VAPID keys for Web Push Authentication:

```bash
# Generate VAPID keys using npx
npx @pushforge/builder generate-vapid-keys

# Using yarn
yarn dlx @pushforge/builder generate-vapid-keys

# Using pnpm
pnpm dlx @pushforge/builder generate-vapid-keys
```

This will output a public key and private key that you can use for VAPID authentication:

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│ VAPID Keys Generated Successfully                          │
│                                                            │
│ Public Key:                                                │
│ BDd0DtL3qQmnI7-JPwKMuGuFBC7VW9GjKP0qR-4C9Y9lJ2LLWR0pSI... │
│                                                            │
│ Private Key (JWK):                                         │
│ {                                                          │
│   "alg": "ES256",                                          │
│   "kty": "EC",                                             │
│   "crv": "P-256",                                          │
│   "x": "N3QO0vepCacjv4k_AoyYa4UELtVb0aMo_SpH7gL1j2U",     │
│   "y": "ZSdiy1kdKUiOGjuoVgMbp4HwmQDz0nhHxPJLbFYh1j8",     │
│   "d": "8M9F5JCaEsXdTU1OpD4ODq-o5qZQcDmCYS6EHrC1o8E"      │
│ }                                                          │
│                                                            │
│ Store these keys securely. Never expose your private key.  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Requirements:**

- Node.js 16.0.0 or later
- The command uses the WebCrypto API which is built-in to Node.js 16+

### Step 2: Set Up Push Notifications in Your Web Application

To implement push notifications in your web application, you'll need to:

1. Use the VAPID public key generated in Step 1
2. Request notification permission from the user
3. Subscribe to push notifications using the Push API
4. Save the subscription information in your backend

When implementing your service worker, handle push events to display notifications when they arrive:

1. Listen for `push` events
2. Parse the notification data
3. Display the notification to the user
4. Handle notification click events

Refer to the [Push API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) and [Notifications API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) for detailed implementation.

### Step 3: Send Push Notifications from Your Server

On your backend server, use the VAPID private key to send push notifications:

```typescript
import { buildPushHTTPRequest } from "@pushforge/builder";

// Load the private key from your secure environment
// This should be the private key from your VAPID key generation
const privateJWK = process.env.VAPID_PRIVATE_KEY;

// User subscription from browser push API
const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/DEVICE_TOKEN",
  keys: {
    p256dh: "USER_PUBLIC_KEY",
    auth: "USER_AUTH_SECRET",
  },
};

// Create message with payload
const message = {
  payload: {
    title: "New Message",
    body: "You have a new message!",
    icon: "/images/icon.png",
  },
  options: {
    //Default value is 24 * 60 * 60 (24 hours).
    //The VAPID JWT expiration claim (`exp`) must not exceed 24 hours from the time of the request.
    ttl: 3600, // Time-to-live in seconds
    urgency: "normal", // Options: "very-low", "low", "normal", "high"
    topic: "updates", // Optional topic for replacing notifications
  },
  adminContact: "mailto:admin@example.com", //The contact information of the administrator
};

// Build the push notification request
const {endpoint, headers, body} = await buildPushHTTPRequest({
  privateJWK,
  message,
  subscription,
});

// Send the push notification
const response = await fetch(endpoint, {
  method: "POST",
  headers,
  body,
});

if (response.status === 201) {
  console.log("Push notification sent successfully");
} else {
  console.error("Failed to send push notification", await response.text());
}
```

## Cross-Platform Support

PushForge works in all major JavaScript environments:

### Node.js 16+

```js
import { buildPushHTTPRequest } from "@pushforge/builder";
// OR
const { buildPushHTTPRequest } = require("@pushforge/builder");

// Use normally - Node.js 16+ has Web Crypto API built-in
```

### Browsers

```js
import { buildPushHTTPRequest } from "@pushforge/builder";

// Use in a service worker for push notification handling
```

### Deno

```js
// Import from npm CDN
import { buildPushHTTPRequest } from "https://cdn.jsdelivr.net/npm/@pushforge/builder/dist/lib/main.js";

// Run with --allow-net permissions
```

### Bun

```js
import { buildPushHTTPRequest } from "@pushforge/builder";

// Works natively in Bun with no special configuration
```

### Cloudflare Workers

```js
import { buildPushHTTPRequest } from "@pushforge/builder";
```

## License

MIT
