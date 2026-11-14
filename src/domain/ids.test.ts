import { autoEntrySeed, isUuid, uuidFromHexDigest } from './ids';

describe('deterministic ids', () => {
  const digest = 'a3f1c2d4e5b6978812345678abcdef0123456789abcdef0123456789abcdef01';

  it('formats a digest as a valid UUIDv8', () => {
    const id = uuidFromHexDigest(digest);

    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe('8'); // version nibble
    expect(['8', '9', 'a', 'b']).toContain(id[19]); // RFC variant
  });

  it('is stable for the same digest', () => {
    expect(uuidFromHexDigest(digest)).toBe(uuidFromHexDigest(digest.toUpperCase()));
  });

  it('rejects short digests', () => {
    expect(() => uuidFromHexDigest('abc')).toThrow('Digest too short');
  });

  it('builds seeds per user, kind and month', () => {
    expect(autoEntrySeed('u1', 'salary', '2026-11')).toBe('tally:salary:u1:2026-11');
    expect(autoEntrySeed('u1', 'salary', '2026-11')).not.toBe(autoEntrySeed('u2', 'salary', '2026-11'));
  });
});
