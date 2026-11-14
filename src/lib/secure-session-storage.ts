import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { SQLiteStorage } from 'expo-sqlite/kv-store';

import { utf8Decode, utf8Encode } from './utf8';

/**
 * Encrypted storage for the Supabase session (Supabase's "LargeSecureStore" pattern).
 *
 * SecureStore values are capped at ~2 KB and a session is larger, so each value is encrypted with
 * a fresh AES-256-GCM key. The key goes to the OS keychain/keystore (SecureStore,
 * this-device-only, unlocked only) and the authenticated ciphertext to a SQLite key-value file.
 * A copied ciphertext is useless without the hardware-backed key, and tampering fails decryption.
 */
const ciphertextStore = new SQLiteStorage('tally-secure.db');

const KEY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** SecureStore keys allow only [A-Za-z0-9._-]. */
const keyName = (key: string) => `tally.k.${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;

async function getItem(key: string): Promise<string | null> {
  const sealedBase64 = await ciphertextStore.getItem(key);
  if (!sealedBase64) return null;
  const keyBase64 = await SecureStore.getItemAsync(keyName(key), KEY_OPTIONS);
  if (!keyBase64) {
    // Key lost (e.g. app data restored to another device): the ciphertext is unrecoverable.
    await ciphertextStore.removeItem(key);
    return null;
  }
  try {
    const aesKey = await AESEncryptionKey.import(keyBase64, 'base64');
    const plaintext = await aesDecryptAsync(AESSealedData.fromCombined(sealedBase64), aesKey, { output: 'bytes' });
    return utf8Decode(plaintext);
  } catch {
    // Tampered or corrupted. Drop it, and the user simply signs in again.
    await removeItem(key);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  const aesKey = await AESEncryptionKey.generate();
  const sealed = await aesEncryptAsync(utf8Encode(value), aesKey);
  await SecureStore.setItemAsync(keyName(key), await aesKey.encoded('base64'), KEY_OPTIONS);
  await ciphertextStore.setItem(key, await sealed.combined('base64'));
}

async function removeItem(key: string): Promise<void> {
  await ciphertextStore.removeItem(key);
  await SecureStore.deleteItemAsync(keyName(key), KEY_OPTIONS);
}

export const secureSessionStorage = { getItem, setItem, removeItem };
