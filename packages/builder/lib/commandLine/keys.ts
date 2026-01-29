#!/usr/bin/env node
import { getPublicKeyFromJwk } from '../utils.js';

if (!globalThis.crypto?.subtle) {
  console.error('Error: Web Crypto API not available.');
  console.error('Please ensure you are running Node.js 20.0.0 or later.');
  process.exit(1);
}

async function generateVapidKeys(): Promise<void> {
  try {
    console.log('Generating VAPID keys...\n');

    const keypair = await globalThis.crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    );

    const privateJWK = await globalThis.crypto.subtle.exportKey(
      'jwk',
      keypair.privateKey,
    );
    const privateJWKWithAlg = { alg: 'ES256', ...privateJWK };
    const publicKey = getPublicKeyFromJwk(privateJWKWithAlg);

    console.log('VAPID Keys Generated Successfully\n');
    console.log('Public Key:');
    console.log(publicKey);
    console.log('\nPrivate Key (JWK):');
    console.log(JSON.stringify(privateJWKWithAlg));
    console.log('\nStore these keys securely. Never expose your private key.');
  } catch (error: unknown) {
    console.error('Error generating VAPID keys:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred.');
    }
    console.error(
      '\nThis tool requires Node.js 20.0.0 or later with Web Crypto API support.',
    );
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
PushForge CLI

Usage: npx @pushforge/builder <command>

Commands:
  vapid   Generate VAPID key pair for Web Push authentication
  help    Show this help message

Examples:
  npx @pushforge/builder vapid

Documentation: https://github.com/draphy/pushforge#readme
`);
}

// Parse command
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

switch (command) {
  case 'vapid':
    generateVapidKeys();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    showHelp();
    process.exit(command ? 1 : 0);
}
