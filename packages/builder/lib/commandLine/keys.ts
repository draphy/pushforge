#!/usr/bin/env node
import { getPublicKeyFromJwk } from '../utils.js';

let webcrypto: Crypto;
try {
  const nodeCrypto = await import('node:crypto');
  webcrypto = nodeCrypto.webcrypto as Crypto;
} catch {
  console.error('Error: This command requires Node.js environment.');
  console.error("Please ensure you're running Node.js 16.0.0 or later.");
  process.exit(1);
}

async function generateVapidKeys(): Promise<void> {
  try {
    console.log('Generating VAPID keys...');

    const keypair = await webcrypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    );

    const privateJWK = await webcrypto.subtle.exportKey(
      'jwk',
      keypair.privateKey,
    );
    const privateJWKWithAlg = { alg: 'ES256', ...privateJWK };
    const publicKey = getPublicKeyFromJwk(privateJWKWithAlg);

    // Display in a nice formatted output
    const resultText = `
VAPID Keys Generated Successfully

Public Key: 
${publicKey}

Private Key (JWK): 
${JSON.stringify(privateJWKWithAlg, null, 2)}

Store these keys securely. Never expose your private key.
`;

    console.log(resultText);
  } catch (error: unknown) {
    console.error('Error generating VAPID keys:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred.');
    }
    console.error(
      '\nThis tool requires Node.js v16.0.0 or later with WebCrypto API support.',
    );
    process.exit(1);
  }
}

// Simple command parsing
const args = process.argv.slice(2);
const command = args[0];

if (command === 'generate-vapid-keys') {
  generateVapidKeys();
} else {
  console.log(`
PushForge CLI Tools

Usage:
  npx @pushforge/builder generate-vapid-keys   Generate VAPID key pair for Web Push Authentication

For more information, visit: https://github.com/draphy/pushforge
  `);
}
