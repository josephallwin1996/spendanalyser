import { resolveCategory } from "./categories";
import { isValidISODate } from "./dates";
import type { TxType } from "./types";

export type ParsedImportRow = {
  date: string;
  description: string;
  amount: number;
  type: TxType;
  category: string;
};

export type CsvParseResult = {
  rows: ParsedImportRow[];
  skipped: number;
  error?: string;
  detectedHeaders: string[];
};

const HEADER_ALIASES: Record<string, string[]> = {
  date: ["date", "transaction date", "posted date", "value date", "day"],
  description: ["description", "merchant", "name", "details", "narration", "particulars", "note", "memo"],
  amount: ["amount", "value", "debit", "credit", "spent", "total"],
  category: ["category", "categories", "tag", "type of spend"],
  type: ["type", "transaction type", "kind", "debit credit", "credit debit", "direction"],
};

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function findHeader(headers: string[], key: keyof typeof HEADER_ALIASES) {
  const aliases = HEADER_ALIASES[key];
  return headers.findIndex((header) => aliases.includes(header));
}

function splitCsv(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char === "\r") {
      if (text[index + 1] !== "\n") {
        cell += char;
      }
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((value) => value.trim().length > 0));
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const counts = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  const best = (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ",";
}

function normalizeDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return isValidISODate(value) ? value : null;
  }

  const numeric = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(value);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    let year = Number(numeric[3]);
    if (year < 100) year += 2000;

    let day: number;
    let month: number;
    if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      day = second;
      month = first;
    } else {
      // Prefer day-first for ambiguous dates, which matches the app's default locale.
      day = first;
      month = second;
    }

    const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isValidISODate(iso) ? iso : null;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const iso = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(
      parsed.getDate(),
    ).padStart(2, "0")}`;
    return isValidISODate(iso) ? iso : null;
  }

  return null;
}

function normalizeAmount(raw: string): number | null {
  const negative = /\(.*\)/.test(raw) || raw.includes("-");
  let cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = `${parts[0]}.${parts[1]}`;
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount === 0) return null;
  return negative ? -Math.abs(amount) : Math.abs(amount);
}

function resolveType(raw: string | undefined): TxType | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (/^(income|credit|cr|in|inflow|received)$/.test(value)) return "income";
  if (/^(expense|debit|dr|out|outflow|spent|payment)$/.test(value)) return "expense";
  return null;
}

export function parseTransactionsCsv(text: string): CsvParseResult {
  const rows = splitCsv(text, detectDelimiter(text));
  if (rows.length < 2) {
    return { rows: [], skipped: 0, error: "That file doesn't have any transaction rows.", detectedHeaders: [] };
  }

  const headers = rows[0].map(normalizeHeader);
  const dateIndex = findHeader(headers, "date");
  const descriptionIndex = findHeader(headers, "description");
  const amountIndex = findHeader(headers, "amount");
  const categoryIndex = findHeader(headers, "category");
  const typeIndex = findHeader(headers, "type");

  if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
    return {
      rows: [],
      skipped: 0,
      error: "We couldn't find date, description and amount columns in that file.",
      detectedHeaders: headers,
    };
  }

  const parsedRows: ParsedImportRow[] = [];
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const date = normalizeDate(row[dateIndex] ?? "");
    const description = (row[descriptionIndex] ?? "").trim();
    const rawAmount = row[amountIndex] ?? "";
    const amount = normalizeAmount(rawAmount);
    const explicitType = resolveType(typeIndex >= 0 ? row[typeIndex] : undefined);
    const categoryRaw = categoryIndex >= 0 ? row[categoryIndex] ?? "" : "";
    const categoryType = resolveType(categoryRaw);

    if (!date || !description || description.length > 80 || amount === null) {
      skipped += 1;
      continue;
    }

    let type: TxType = explicitType ?? categoryType ?? "expense";
    if (!explicitType && !categoryType && amount < 0) type = "expense";
    if (type === "income" && !explicitType && categoryType !== "income") type = "expense";

    parsedRows.push({
      date,
      description,
      amount: Math.abs(amount),
      type,
      category: resolveCategory(categoryRaw, type),
    });
  }

  if (parsedRows.length === 0) {
    return {
      rows: [],
      skipped,
      error: "We couldn't read any valid transactions from that file. Check the date and amount formats.",
      detectedHeaders: headers,
    };
  }

  return { rows: parsedRows, skipped, detectedHeaders: headers };
}

export const SAMPLE_CSV = `date,description,amount,category,type
2026-11-01,Rent,45000,home,expense
2026-11-01,Salary,120000,income,income
2026-11-03,BigBasket,2480,groceries,expense
2026-11-05,Swiggy,640,dining,expense
2026-11-07,Metro card top-up,500,transport,expense
2026-11-09,Netflix,649,subscriptions,expense
`;

export function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tandem-sample.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
