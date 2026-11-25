export type Currency = {
  code: string;
  label: string;
  locale: string;
};

export const CURRENCIES: Currency[] = [
  { code: "INR", label: "Indian rupee (₹)", locale: "en-IN" },
  { code: "USD", label: "US dollar ($)", locale: "en-US" },
  { code: "EUR", label: "Euro (€)", locale: "de-DE" },
  { code: "GBP", label: "British pound (£)", locale: "en-GB" },
  { code: "AED", label: "UAE dirham (د.إ)", locale: "en-AE" },
  { code: "SGD", label: "Singapore dollar (S$)", locale: "en-SG" },
  { code: "AUD", label: "Australian dollar (A$)", locale: "en-AU" },
  { code: "CAD", label: "Canadian dollar (C$)", locale: "en-CA" },
];

export const DEFAULT_CURRENCY = "INR";
export const CURRENCY_CODES = CURRENCIES.map((currency) => currency.code);

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0];
}

type FormatOptions = {
  /** Show paise/cents even when the amount is a round number. */
  exact?: boolean;
  /** Use compact notation, e.g. ₹1.2L */
  compact?: boolean;
  /** Always show a leading sign (+/−) */
  signed?: boolean;
};

export function formatMoney(amount: number, currencyCode: string, options: FormatOptions = {}) {
  const { exact = false, compact = false, signed = false } = options;
  const currency = getCurrency(currencyCode);
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Number.isInteger(rounded);

  if (compact && Math.abs(rounded) >= 1000) {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      notation: "compact",
      maximumFractionDigits: 1,
      signDisplay: signed ? "exceptZero" : "auto",
    }).format(rounded);
  }

  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: exact || !isWhole ? 2 : 0,
    maximumFractionDigits: 2,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(rounded);
}

export function formatSigned(amount: number, currencyCode: string, options: Omit<FormatOptions, "signed"> = {}) {
  if (amount === 0) return formatMoney(0, currencyCode, options);
  const sign = amount > 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(amount), currencyCode, { ...options, exact: true })}`;
}

export function currencySymbol(currencyCode: string) {
  const currency = getCurrency(currencyCode);
  const parts = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency.code;
}

export function formatPercent(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
