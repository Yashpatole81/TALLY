/**
 * Minimal UTF-8 codec, so encryption doesn't rely on TextEncoder/TextDecoder being present
 * in every JS engine. Handles the full Unicode range, including surrogate pairs.
 */
export function utf8Encode(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0)!;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
  }
  return Uint8Array.from(bytes);
}

/** @throws Error on malformed UTF-8 (e.g. corrupted ciphertext that still authenticated). */
export function utf8Decode(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  const next = () => {
    const byte = bytes[i++];
    if (byte === undefined || (byte & 0xc0) !== 0x80) throw new Error('Malformed UTF-8');
    return byte & 0x3f;
  };
  while (i < bytes.length) {
    const first = bytes[i++]!;
    let code: number;
    if (first < 0x80) code = first;
    else if (first >= 0xc0 && first < 0xe0) code = ((first & 0x1f) << 6) | next();
    else if (first >= 0xe0 && first < 0xf0) code = ((first & 0x0f) << 12) | (next() << 6) | next();
    else if (first >= 0xf0 && first < 0xf8) code = ((first & 0x07) << 18) | (next() << 12) | (next() << 6) | next();
    else throw new Error('Malformed UTF-8');
    result += String.fromCodePoint(code);
  }
  return result;
}
