import { crypto } from './crypto.js';
/**
 * Derives a shared secret from a client's public key and a local private key using the ECDH algorithm.
 *
 * This function uses the Web Crypto API to derive a shared secret, which can then be used
 * for further cryptographic operations, such as key derivation using HKDF.
 *
 * @param {CryptoKey} clientPublicKey - The public key of the client, used to derive the shared secret.
 * @param {CryptoKey} localPrivateKey - The local private key used in the derivation process.
 * @returns {Promise<CryptoKey>} A promise that resolves to a CryptoKey representing the derived shared secret.
 *
 * @throws {Error} Throws an error if the key derivation fails.
 */
export const deriveSharedSecret = async (
  clientPublicKey: CryptoKey,
  localPrivateKey: CryptoKey,
) => {
  const sharedSecretBytes = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    localPrivateKey,
    256,
  );

  return crypto.subtle.importKey(
    'raw',
    sharedSecretBytes,
    { name: 'HKDF' },
    false,
    ['deriveBits', 'deriveKey'],
  );
};
