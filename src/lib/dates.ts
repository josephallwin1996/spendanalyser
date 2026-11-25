const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (value: number) => String(value).padStart(2, "0");

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function monthKeyFromDate(date: string) {
  return date.slice(0, 7);
}

export function currentMonthKey() {
  return todayISO().slice(0, 7);
}

export function parseMonth(key: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function isValidMonth(key: string) {
  return parseMonth(key) !== null;
}

export function monthLabel(key: string, style: "long" | "short" = "long") {
  const parsed = parseMonth(key);
  if (!parsed) return key;
  return `${style === "short" ? MONTHS_SHORT[parsed.month - 1] : MONTHS_LONG[parsed.month - 1]} ${parsed.year}`;
}

export function monthLabelParts(key: string) {
  const parsed = parseMonth(key);
  if (!parsed) return { month: key, year: "" };
  return { month: MONTHS_LONG[parsed.month - 1], year: String(parsed.year) };
}

export function shiftMonth(key: string, delta: number) {
  const parsed = parseMonth(key);
  if (!parsed) return currentMonthKey();
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function daysInMonth(key: string) {
  const parsed = parseMonth(key);
  if (!parsed) return 30;
  return new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
}

export function monthRange(key: string) {
  return { start: `${key}-01`, end: `${key}-${pad(daysInMonth(key))}` };
}

export function monthDayKeys(key: string) {
  const days = daysInMonth(key);
  return Array.from({ length: days }, (_, index) => `${key}-${pad(index + 1)}`);
}

export function lastNMonths(count: number, end = currentMonthKey()) {
  const months: string[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    months.push(shiftMonth(end, -index));
  }
  return months;
}

export function formatDay(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function formatFullDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatShortDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function relativeDayLabel(isoDate: string) {
  const today = todayISO();
  if (isoDate === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isoDate === toISODate(yesterday)) return "Yesterday";
  return formatDay(isoDate);
}

export function weekdayIndex(isoDate: string) {
  // Monday = 0 ... Sunday = 6
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return (day + 6) % 7;
}

export function weekdayName(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return DAY_LONG[date.getUTCDay()];
}

export function elapsedDays(key: string) {
  const today = todayISO();
  if (key === currentMonthKey()) return Number(today.slice(8, 10));
  if (key < currentMonthKey()) return daysInMonth(key);
  return 0;
}

export function remainingDays(key: string) {
  if (key !== currentMonthKey()) return 0;
  return daysInMonth(key) - elapsedDays(key);
}

export function isValidISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && toISODateUTC(date) === value;
}

function toISODateUTC(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function monthOptions(count = 18, end = currentMonthKey()) {
  return lastNMonths(count, end)
    .slice()
    .reverse()
    .map((key) => ({ key, label: monthLabel(key) }));
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
