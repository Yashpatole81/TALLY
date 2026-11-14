import type { MonthKey } from './dates';

/** Seed for an auto-recorded entry. Same user + kind + month gives the same ID on every device. */
export function autoEntrySeed(userId: string, kind: 'salary' | 'savings_contribution', month: MonthKey): string {
  return `tally:${kind}:${userId}:${month}`;
}

/**
 * Formats the first 128 bits of a hex digest as an RFC 9562 UUIDv8 (custom, hash-based).
 * Only needs to be unique per user: the server primary key is (user_id, id).
 * @throws Error when the digest is shorter than 32 hex characters.
 */
export function uuidFromHexDigest(hexDigest: string): string {
  const hex = hexDigest.toLowerCase().replace(/[^0-9a-f]/g, '');
  if (hex.length < 32) throw new Error('Digest too short for a UUID');
  const versioned = `${hex.slice(0, 12)}8${hex.slice(13, 32)}`;
  const variantNibble = ((parseInt(versioned[16]!, 16) & 0x3) | 0x8).toString(16);
  const v = `${versioned.slice(0, 16)}${variantNibble}${versioned.slice(17)}`;
  return `${v.slice(0, 8)}-${v.slice(8, 12)}-${v.slice(12, 16)}-${v.slice(16, 20)}-${v.slice(20, 32)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
