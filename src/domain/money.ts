/**
 * Money is always an integer number of minor units (paise for INR) so arithmetic never drifts.
 * Formatting is implemented here instead of `Intl` so output is identical on Hermes and in tests.
 */
export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Indian grouping: 1,00,000. Western grouping: 100,000. */
  grouping: "indian" | "western";
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: "INR", symbol: "₹", name: "Indian rupee", grouping: "indian" },
  USD: { code: "USD", symbol: "$", name: "US dollar", grouping: "western" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", grouping: "western" },
  GBP: { code: "GBP", symbol: "£", name: "British pound", grouping: "western" },
  AED: { code: "AED", symbol: "AED ", name: "UAE dirham", grouping: "western" },
  SGD: {
    code: "SGD",
    symbol: "S$",
    name: "Singapore dollar",
    grouping: "western",
  },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/** Upper bound for any single amount: 10 crore in major units. Mirrored as a DB CHECK constraint. */
export const MAX_AMOUNT_MINOR = 10_000_000_000;

/** Max digits accepted before the decimal point while typing. */
const MAX_INTEGER_DIGITS = 9;

/** Unicode minus, as used in the Figma ("−₹1,200"). */
export const MINUS = "\u2212";

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

/** "16000" → "16,000" (western) | "100000" → "1,00,000" (indian). */
export function groupDigits(
  integerDigits: string,
  grouping: CurrencyInfo["grouping"],
): string {
  if (integerDigits.length <= 3) return integerDigits;
  if (grouping === "western")
    return integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const lastThree = integerDigits.slice(-3);
  const rest = integerDigits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${lastThree}`;
}

export interface FormatMoneyOptions {
  /** Prefix positive values with "+" (used for income rows). */
  signed?: boolean;
  /** 'auto' shows decimals only when the amount has a fractional part. */
  decimals?: "auto" | "always" | "never";
}

/** 1600000 → "₹16,000"; -120000 → "−₹1,200"; 120050 → "₹1,200.50". */
export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode,
  { signed = false, decimals = "auto" }: FormatMoneyOptions = {},
): string {
  const info = CURRENCIES[currency];
  const negative = amountMinor < 0;
  const absolute = Math.abs(Math.round(amountMinor));
  const major = Math.floor(absolute / 100);
  const fraction = absolute % 100;
  const showFraction =
    decimals === "always" || (decimals === "auto" && fraction !== 0);
  const body =
    groupDigits(String(major), info.grouping) +
    (showFraction ? `.${String(fraction).padStart(2, "0")}` : "");
  const sign = negative ? MINUS : signed && absolute > 0 ? "+" : "";
  return `${sign}${info.symbol}${body}`;
}

/**
 * Parses what a user typed ("1,200.50", " 15 ") into minor units.
 * Returns null for anything that isn't a non-negative amount with at most 2 decimals.
 */
export function parseAmountInput(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [integerPart = "0", fractionPart = ""] = cleaned.split(".");
  if (integerPart.replace(/^0+/, "").length > MAX_INTEGER_DIGITS + 1)
    return null;
  const minor = Number(integerPart) * 100 + Number(fractionPart.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}

/**
 * Keystroke filter for amount fields: digits plus one dot, max 2 decimals, no leading zeros,
 * capped integer length. Grouping commas are stripped (they're re-added for display).
 */
export function sanitizeAmountInput(text: string): string {
  let integerPart = "";
  let fractionPart: string | null = null;
  for (const char of text) {
    if (char === ".") {
      if (fractionPart === null) fractionPart = "";
      continue;
    }
    if (char < "0" || char > "9") continue; // drops grouping commas, spaces, symbols
    if (fractionPart !== null) {
      if (fractionPart.length < 2) fractionPart += char;
    } else if (integerPart === "0") {
      integerPart = char; // no leading zeros
    } else if (integerPart.length < MAX_INTEGER_DIGITS) {
      integerPart += char;
    }
  }
  if (fractionPart !== null)
    return `${integerPart === "" ? "0" : integerPart}.${fractionPart}`;
  return integerPart;
}

/** Display form of a sanitized amount string while typing: "16000" → "16,000", "1200.5" → "1,200.5". */
export function formatAmountInputDisplay(
  raw: string,
  currency: CurrencyCode,
): string {
  if (raw === "") return "";
  const [integerPart = "", fractionPart] = raw.split(".");
  const grouped = groupDigits(
    integerPart === "" ? "0" : integerPart,
    CURRENCIES[currency].grouping,
  );
  return fractionPart === undefined ? grouped : `${grouped}.${fractionPart}`;
}

/** Minor units → editable string without grouping: 120050 → "1200.50", 1600000 → "16000". */
export function minorToInput(amountMinor: number): string {
  const major = Math.floor(amountMinor / 100);
  const fraction = amountMinor % 100;
  return fraction === 0
    ? String(major)
    : `${major}.${String(fraction).padStart(2, "0")}`;
}
