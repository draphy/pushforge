<div align="center">

<img src="images/logo.webp" alt="PushForge Logo" width="120" />

# PushForge

**Web Push Notifications for the Modern Stack**

[![npm version](https://img.shields.io/npm/v/@pushforge/builder.svg)](https://www.npmjs.com/package/@pushforge/builder)
[![npm downloads](https://img.shields.io/npm/dm/@pushforge/builder?logo=npm&color=brightgreen&cacheSeconds=86400)](https://www.npmjs.com/package/@pushforge/builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-first--class-blue.svg)](https://www.typescriptlang.org/)

Zero dependencies · Works everywhere · TypeScript-first

[Documentation](packages/builder) · [npm](https://www.npmjs.com/package/@pushforge/builder) · [Report Bug](https://github.com/draphy/pushforge/issues)

**[Try the Playground →](https://pushforge.draphy.org)**

</div>

---

## Playground

Test PushForge at **[pushforge.draphy.org](https://pushforge.draphy.org)** — an interactive playground for testing push notifications, powered by Cloudflare Workers.

- **Quick Test** — enable notifications, send test messages, see them arrive instantly
- **Topic Channels** — test targeted notifications by subscribing to channels
- **Notification Customization** — experiment with title, body, icon, image, action buttons, vibration
- **Push Options** — test urgency (battery hints) and TTL (message expiry)
- **Cross-Browser Testing** — works on Chrome, Firefox, Edge, Safari 16+

Subscriptions auto-expire (5 min for quick test, 1 hour for topics) — no permanent data stored. The backend is a single Cloudflare Worker using `buildPushHTTPRequest()` with zero dependencies.

## The Problem

Traditional web push libraries like `web-push` rely on Node.js-specific APIs that don't work in modern edge runtimes:

```
❌ Cloudflare Workers - "crypto.createECDH is not a function"
❌ Vercel Edge - "https.request is not available"
```

## The Solution

PushForge uses standard Web APIs that work everywhere:

```typescript
import { buildPushHTTPRequest } from "@pushforge/builder";

const { endpoint, headers, body } = await buildPushHTTPRequest({
  privateJWK: VAPID_PRIVATE_KEY,
  subscription: userSubscription,
  message: {
    payload: { title: "Hello!", body: "This works everywhere." },
    adminContact: "mailto:admin@example.com"
  }
});

await fetch(endpoint, { method: "POST", headers, body });
```

## Why PushForge?

| | PushForge | web-push |
|---|:---:|:---:|
| Dependencies | **0** | 5+ |
| Cloudflare Workers | ✅ | [❌](https://github.com/web-push-libs/web-push/issues/718) |
| Vercel Edge | ✅ | ❌ |
| Convex | ✅* | ❌ |
| Deno / Bun | ✅ | Limited |
| TypeScript | Native | @types |

\* Requires `"use node";` directive — [see example](packages/builder#convex)

## Quick Start

```bash
# Install
npm install @pushforge/builder

# Generate VAPID keys
npx @pushforge/builder vapid
```

**Frontend** - Subscribe users:

```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
});
// Send subscription.toJSON() to your server
```

**Backend** - Send notifications:

```typescript
import { buildPushHTTPRequest } from "@pushforge/builder";

const { endpoint, headers, body } = await buildPushHTTPRequest({
  privateJWK: process.env.VAPID_PRIVATE_KEY,
  subscription,
  message: {
    payload: { title: "New Message", body: "You have a notification!" },
    adminContact: "mailto:admin@example.com",
    options: {              // Optional push delivery settings
      ttl: 3600,            // Message expires in 1 hour
      urgency: "high",      // Battery priority hint
      topic: "alerts"       // Replace pending message with same topic
    }
  }
});

await fetch(endpoint, { method: "POST", headers, body });
```

See the [full documentation](packages/builder) for platform-specific examples (Cloudflare Workers, Vercel Edge, Convex, Deno, Bun).

## Packages

| Package | Description |
|---------|-------------|
| [@pushforge/builder](packages/builder) | Core library for building push notification requests |

## Requirements

- **Node.js 20+** or any runtime with Web Crypto API
- Supported: Cloudflare Workers, Vercel Edge, Convex, Deno, Bun, modern browsers

## Development

```bash
git clone https://github.com/draphy/pushforge.git
cd pushforge
pnpm install
pnpm build
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [David Raphi](https://github.com/draphy)
