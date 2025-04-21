let webcrypto;
try {
  const nodeCrypto = await import('node:crypto');
  webcrypto = nodeCrypto.webcrypto;
} catch {
  console.error('Error: This command requires Node.js environment.');
  console.error("Please ensure you're running Node.js 16.0.0 or later.");
  process.exit(1);
}

const stringFromArrayBuffer = (s) => {
  let result = '';
  for (const code of new Uint8Array(s)) result += String.fromCharCode(code);
  return result;
};

const base64UrlEncode = (input) => {
  const text = typeof input === 'string' ? input : stringFromArrayBuffer(input);

  try {
    const base64 = Buffer.from(text, 'binary').toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  } catch {
    console.error('Error: Failed to perform base64 encoding.');
    console.error(
      'This is likely due to running in a non-Node.js environment.',
    );
    process.exit(1);
  }
};

const base64UrlDecodeString = (s) => {
  if (!s) throw new Error('Invalid input');
  return (
    s.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - (s.length % 4)) % 4)
  );
};

const base64Decode = (base64String) => {
  const paddedBase64 = base64String.padEnd(
    base64String.length + ((4 - (base64String.length % 4 || 4)) % 4),
    '=',
  );

  try {
    return Buffer.from(paddedBase64, 'base64').toString('binary');
  } catch {
    console.error('Error: Failed to decode base64 string.');
    console.error(
      'This is likely due to running in a non-Node.js environment.',
    );
    process.exit(1);
  }
};

const getPublicKeyFromJwk = (jwk) =>
  base64UrlEncode(
    `\x04${base64Decode(base64UrlDecodeString(jwk.x))}${base64Decode(base64UrlDecodeString(jwk.y))}`,
  );

// Simple box drawing function without external dependencies
const drawBox = (text) => {
  const lines = text.split('\n');
  const width = Math.max(...lines.map((line) => line.length));

  const top = `┌${'─'.repeat(width + 2)}┐`;
  const bottom = `└${'─'.repeat(width + 2)}┘`;

  const boxedLines = [
    top,
    ...lines.map((line) => `│ ${line.padEnd(width)} │`),
    bottom,
  ];

  return boxedLines.join('\n');
};

async function generateVapidKeys() {
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

    console.log(drawBox(resultText));
  } catch (error) {
    console.error('Error generating VAPID keys:');
    console.error(error.message);
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
