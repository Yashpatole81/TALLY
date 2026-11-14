import { utf8Decode, utf8Encode } from './utf8';

describe('utf8 codec', () => {
  it('round-trips ASCII, accents, rupee sign and emoji', () => {
    const value = '{"name":"Yáš ₹16,000 👋"}';

    expect(utf8Decode(utf8Encode(value))).toBe(value);
  });

  it('encodes multi-byte characters with the right byte lengths', () => {
    expect(utf8Encode('a')).toHaveLength(1);
    expect(utf8Encode('é')).toHaveLength(2);
    expect(utf8Encode('₹')).toHaveLength(3);
    expect(utf8Encode('👋')).toHaveLength(4);
  });

  it('rejects malformed input', () => {
    expect(() => utf8Decode(Uint8Array.from([0xe2, 0x82]))).toThrow('Malformed UTF-8');
    expect(() => utf8Decode(Uint8Array.from([0xff]))).toThrow('Malformed UTF-8');
  });
});
