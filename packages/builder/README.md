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
- 🌐 Cross-platform compatibility (Node.js 20+, Browsers, Deno, Bun, Cloudflare Workers, Convex)
- 🧩 TypeScript definitions included
- 🛠️ Zero dependencies

## Getting Started

### Step 1: Generate VAPID Keys

PushForge includes a built-in CLI tool to generate VAPID keys for Web Push Authentication:

```bash
# Generate VAPID keys using npx
npx @pushforge/builder vapid

# Using yarn
yarn dlx @pushforge/builder vapid

# Using pnpm
pnpm dlx @pushforge/builder vapid
```

This will output a public key and private key that you can use for VAPID authentication:

```
Generating VAPID keys...

VAPID Keys Generated Successfully

Public Key:
BDd0DtL3qQmnI7-JPwKMuGuFBC7VW9GjKP0qR-4C9Y9lJ2LLWR0pSI...

Private Key (JWK):
{
  "alg": "ES256",
  "key_ops": ["sign"],
  "ext": true,
  "kty": "EC",
  "x": "N3QO0vepCacjv4k_AoyYa4UELtVb0aMo_SpH7gL1j2U",
  "y": "ZSdiy1kdKUiOGjuoVgMbp4HwmQDz0nhHxPJLbFYh1j8",
  "crv": "P-256",
  "d": "8M9F5JCaEsXdTU1OpD4ODq-o5qZQcDmCYS6EHrC1o8E"
}

Store these keys securely. Never expose your private key.
```

You can also run `npx @pushforge/builder help` to see all available commands.

**Requirements:**

- Node.js 20.0.0 or later (current LTS)
- The command uses the Web Crypto API via `globalThis.crypto`

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

### Node.js 20+

```js
import { buildPushHTTPRequest } from "@pushforge/builder";

// Use normally - Node.js 20+ has globalThis.crypto available
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

### Convex

```js
import { buildPushHTTPRequest } from "@pushforge/builder";

// Works in Convex actions
```

### Vercel Edge Runtime

```js
import { buildPushHTTPRequest } from "@pushforge/builder";

// Works in Edge Runtime with globalThis.crypto
```

## Breaking Changes in v2.x

### Node.js Version Requirement

Starting from v2.0.0, PushForge requires **Node.js 20.0.0 or later**.

**Why this change?**

1. **Bundler Compatibility**: The previous implementation used top-level `await` for dynamic imports, which caused issues with bundlers like esbuild (used by Convex, Vercel, and others) that don't support top-level await.

2. **Simplified Architecture**: By using `globalThis.crypto` (the standard Web Crypto API), the library now works consistently across all modern JavaScript runtimes without conditional imports.

3. **EOL Node.js Versions**: Node.js 16, 17, and 18 have all reached end-of-life. Node.js 20 is the current LTS version.

### Migration Guide

#### From Node.js 16-18 to Node.js 20+

**Recommended**: Upgrade to Node.js 20 (current LTS)

```bash
# Using nvm
nvm install 20
nvm use 20

# Using fnm
fnm install 20
fnm use 20
```

#### If You Must Stay on Node.js 18

Node.js 18 users can polyfill `globalThis.crypto` before importing the library:

```javascript
// Add this at the very top of your entry file
import { webcrypto } from 'node:crypto';
globalThis.crypto = webcrypto;

// Then import PushForge
import { buildPushHTTPRequest } from '@pushforge/builder';
```

Or run Node.js with the experimental flag:

```bash
node --experimental-global-webcrypto your-script.js
```

#### For Node.js 16-17 Users

These versions are end-of-life and no longer receive security updates. We strongly recommend upgrading to Node.js 20+. If you cannot upgrade, you can use the polyfill approach above, but this is not officially supported.

## Supported Environments

| Environment | Version | Status |
|-------------|---------|--------|
| Node.js | 20+ | ✅ Fully supported |
| Node.js | 18 | ⚠️ Requires polyfill or flag |
| Node.js | 16-17 | ❌ EOL, not supported |
| Browsers | Modern | ✅ Fully supported |
| Cloudflare Workers | - | ✅ Fully supported |
| Deno | 1.0+ | ✅ Fully supported |
| Bun | 1.0+ | ✅ Fully supported |
| Convex | - | ✅ Fully supported |
| Vercel Edge | - | ✅ Fully supported |

## License

MIT
