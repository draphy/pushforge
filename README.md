# PushForge 🚀

<div align="center">

<img src="images/pushforge_logo.png" alt="PushForge Logo" width="150" />

**Modern, Cross-Platform Web Push Notifications**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

## What is PushForge?

PushForge is a comprehensive toolkit for implementing Web Push Notifications in modern web applications. It handles the complex parts of push notifications so you can focus on building great user experiences.

**Zero dependencies. Cross-platform. TypeScript-first.**

### Features

- 🔐 Compliant VAPID authentication
- 📦 Streamlined payload encryption
- 🌐 Works everywhere: Node.js, Browsers, Deno, Bun, Cloudflare Workers
- 🧩 Modular architecture for flexible implementation
- 🛠️ Built with TypeScript for robust type safety

## Packages

| Package                                | Description                                                                       | Path                                    |
| -------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------- |
| [@pushforge/builder](packages/builder) | Core library for building push notification requests with proper VAPID encryption | [`packages/builder/`](packages/builder) |

_More packages coming soon!_

## Quick Start

```bash
# Install the core package
npm install @pushforge/builder

# Generate VAPID keys for push authentication
npx @pushforge/builder vapid
```

Check out the complete documentation in each package's README for detailed usage examples.

## Project Structure

```
pushforge/
├── packages/
│   └── builder/         # Core push notification builder
│       ├── lib/         # Source code
│       ├── examples/    # Usage examples (coming soon...)
│       └── README.md    # Package documentation
└── README.md            # This file
```

## Requirements

- **Node.js**: v16.0.0 or higher (for WebCrypto API support)
- **NPM**, **Yarn**, or **pnpm** for package management

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/draphy/pushforge.git
   cd pushforge
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build packages:

   ```bash
   pnpm build
   ```

4. Available Commands:

   ```bash
   # Format and lint code
   pnpm biome:format   # Format code with Biome
   pnpm biome:lint     # Lint code with Biome
   pnpm biome:check    # Check code with Biome
   pnpm biome:fix      # Fix issues automatically with Biome

   # Type checking
   pnpm type:check     # Run TypeScript type checking

   # Commit checks (run before committing)
   pnpm commit:check   # Run formatting, type checking and build
   ```

## Contributing

Contributions are always welcome! We follow a structured workflow for contributions - see our [Contributing Guidelines](CONTRIBUTING.md) for details.

Whether you want to:

- 🐛 Report a bug
- 💡 Suggest new features
- 🧪 Improve tests
- 📚 Enhance documentation
- 💻 Submit a PR

We appreciate your help making PushForge better for everyone.

## Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/draphy/pushforge/issues/new) and provide as much detail as possible.

## Sponsorship

If you find PushForge valuable, consider [sponsoring the project](https://github.com/sponsors/draphy). Your sponsorship helps maintain and improve the library.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/draphy">David Raphi</a></sub>
</div>
