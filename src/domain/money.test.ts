import {
  formatAmountInputDisplay,
  formatMoney,
  groupDigits,
  MINUS,
  minorToInput,
  parseAmountInput,
  sanitizeAmountInput,
} from './money';

describe('groupDigits', () => {
  it('uses Indian grouping (lakh/crore)', () => {
    expect(groupDigits('900', 'indian')).toBe('900');
    expect(groupDigits('16000', 'indian')).toBe('16,000');
    expect(groupDigits('100000', 'indian')).toBe('1,00,000');
    expect(groupDigits('12345678', 'indian')).toBe('1,23,45,678');
  });

  it('uses western grouping', () => {
    expect(groupDigits('1234567', 'western')).toBe('1,234,567');
  });
});

describe('formatMoney', () => {
  it('formats the Figma amounts', () => {
    expect(formatMoney(1_600_000, 'INR')).toBe('₹16,000');
    expect(formatMoney(900_000, 'INR')).toBe('₹9,000');
    expect(formatMoney(-120_000, 'INR')).toBe(`${MINUS}₹1,200`);
    expect(formatMoney(1_600_000, 'INR', { signed: true })).toBe('+₹16,000');
  });

  it('shows decimals only when there is a fractional part, unless asked', () => {
    expect(formatMoney(120_050, 'INR')).toBe('₹1,200.50');
    expect(formatMoney(0, 'INR', { decimals: 'always' })).toBe('₹0.00');
    expect(formatMoney(120_050, 'INR', { decimals: 'never' })).toBe('₹1,200');
  });

  it('never prints a sign for zero', () => {
    expect(formatMoney(0, 'INR', { signed: true })).toBe('₹0');
  });

  it('supports other currencies', () => {
    expect(formatMoney(123_456_789, 'USD')).toBe('$1,234,567.89');
  });
});

describe('parseAmountInput', () => {
  it('parses typed amounts into minor units', () => {
    expect(parseAmountInput('1,200.50')).toBe(120_050);
    expect(parseAmountInput(' 15 ')).toBe(1_500);
    expect(parseAmountInput('16000')).toBe(1_600_000);
    expect(parseAmountInput('0.5')).toBe(50);
    expect(parseAmountInput('7.')).toBe(700);
  });

  it('rejects malformed input', () => {
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
    expect(parseAmountInput('1.234')).toBeNull();
    expect(parseAmountInput('-5')).toBeNull();
    expect(parseAmountInput('1.2.3')).toBeNull();
  });
});

describe('sanitizeAmountInput', () => {
  it('keeps digits and one dot with at most two decimals', () => {
    expect(sanitizeAmountInput('12.345')).toBe('12.34');
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
    expect(sanitizeAmountInput('.5')).toBe('0.5');
    expect(sanitizeAmountInput('₹1,200')).toBe('1200');
  });

  it('drops leading zeros', () => {
    expect(sanitizeAmountInput('0012')).toBe('12');
    expect(sanitizeAmountInput('00')).toBe('0');
  });

  it('caps the integer length', () => {
    expect(sanitizeAmountInput('12345678901234')).toBe('123456789');
  });
});

describe('input display helpers', () => {
  it('groups while typing and preserves typed decimals', () => {
    expect(formatAmountInputDisplay('16000', 'INR')).toBe('16,000');
    expect(formatAmountInputDisplay('1200.5', 'INR')).toBe('1,200.5');
    expect(formatAmountInputDisplay('', 'INR')).toBe('');
  });

  it('converts minor units back to an editable string', () => {
    expect(minorToInput(1_600_000)).toBe('16000');
    expect(minorToInput(120_050)).toBe('1200.50');
  });
});
