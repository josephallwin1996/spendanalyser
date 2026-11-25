"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { importTransactions } from "@/app/actions/transactions";
import type { ActionState } from "@/lib/action-state";
import { downloadSampleCsv, parseTransactionsCsv, type ParsedImportRow } from "@/lib/csv";
import { formatShortDate } from "@/lib/dates";
import { firstName, formatMoney } from "@/lib/format";
import type { PublicUser } from "@/lib/types";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormAlert, Select, Spinner } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ParseState = {
  fileName: string;
  rows: ParsedImportRow[];
  skipped: number;
  error?: string;
};

export function ImportTransactionsButton({
  members,
  currency,
  currentUserId,
}: {
  members: PublicUser[];
  currency: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "md")}>
        <Upload size={15} />
        Import CSV
      </button>
      <ImportDialog
        open={open}
        onClose={() => setOpen(false)}
        members={members}
        currency={currency}
        currentUserId={currentUserId}
      />
    </>
  );
}

function ImportDialog({
  open,
  onClose,
  members,
  currency,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  members: PublicUser[];
  currency: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParseState | null>(null);
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setParsed(null);
    setResult(null);
    setDragging(false);
    setPaidBy(currentUserId);
  }

  function handleClose() {
    if (pending) return;
    reset();
    onClose();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setResult(null);

    if (file.size > 2 * 1024 * 1024) {
      setParsed({ fileName: file.name, rows: [], skipped: 0, error: "That file is larger than 2 MB." });
      return;
    }

    const text = await file.text();
    const parsedFile = parseTransactionsCsv(text);
    setParsed({
      fileName: file.name,
      rows: parsedFile.rows,
      skipped: parsedFile.skipped,
      error: parsedFile.error,
    });
  }

  function submitImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setResult(null);
    startTransition(async () => {
      const response = await importTransactions(
        parsed.rows.map((row) => ({ ...row, paidBy })),
      );
      setResult(response);
      if (response.status === "success") {
        toast.success(response.message ?? "Transactions imported.");
        router.refresh();
        reset();
        onClose();
      }
    });
  }

  const payer = members.find((member) => member.id === paidBy) ?? members[0];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Import transactions"
      description="Bring in a CSV export from your bank or spreadsheet. We'll take care of the rest."
      className="sm:max-w-2xl"
    >
      <div className="space-y-5">
        {result?.status === "error" && result.message ? <FormAlert>{result.message}</FormAlert> : null}

        {!parsed ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void handleFile(event.dataTransfer.files[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors",
              dragging ? "border-brand/50 bg-brand/[0.05]" : "border-white/[0.13] bg-white/[0.015]",
            )}
          >
            <span className="grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-brand">
              <FileSpreadsheet size={21} />
            </span>
            <p className="mt-4 text-sm font-medium text-white">Drop your CSV here</p>
            <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted">
              Needs columns for date, description and amount. Category and type columns are optional.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={buttonClass("secondary", "sm", "mt-4")}
            >
              <Upload size={14} />
              Choose a file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              <Download size={11} /> Download a sample CSV
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3">
              <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                <FileSpreadsheet size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-white">{parsed.fileName}</p>
                <p className="text-[11px] text-muted">
                  {parsed.error
                    ? "Couldn't read this file"
                    : `${parsed.rows.length} valid row${parsed.rows.length === 1 ? "" : "s"}${
                        parsed.skipped > 0 ? ` · ${parsed.skipped} skipped` : ""
                      }`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setParsed(null);
                  setResult(null);
                }}
                className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Remove file"
              >
                <X size={15} />
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="sr-only"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>

            {parsed.error ? (
              <FormAlert>{parsed.error}</FormAlert>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
                  <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                    <span>Preview</span>
                    <span>Amount</span>
                  </div>
                  <ul className="divide-y divide-white/[0.04]">
                    {parsed.rows.slice(0, 5).map((row, index) => (
                      <li key={`${row.date}-${row.description}-${index}`} className="flex items-center gap-3 px-3.5 py-2.5">
                        <CategoryIcon categoryId={row.category} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] text-white">{row.description}</p>
                          <p className="text-[10.5px] text-muted">
                            {formatShortDate(row.date)} · {row.type === "income" ? "Income" : "Expense"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "num text-[12px] font-medium",
                            row.type === "income" ? "text-mint" : "text-white",
                          )}
                        >
                          {formatMoney(row.amount, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {parsed.rows.length > 5 ? (
                    <p className="border-t border-white/[0.05] px-3.5 py-2 text-[10.5px] text-muted">
                      + {parsed.rows.length - 5} more
                    </p>
                  ) : null}
                </div>

                <Field label="Who paid?" htmlFor="import-payer" hint={`Importing as ${firstName(payer?.name ?? "you")}. Joint rows can be edited later.`}>
                  <Select
                    id="import-payer"
                    value={paidBy}
                    onChange={(event) => setPaidBy(event.target.value)}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id} className="bg-[#14161b]">
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <p className="text-[11px] leading-relaxed text-muted/70">
            Duplicate entries aren&apos;t detected yet — review your preview first.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleClose} disabled={pending} className={buttonClass("ghost", "md")}>
              Cancel
            </button>
            <button
              type="button"
              onClick={submitImport}
              disabled={pending || !parsed || parsed.rows.length === 0 || Boolean(parsed.error)}
              className={buttonClass("primary", "md", "min-w-[126px]")}
            >
              {pending ? <Spinner /> : <Upload size={14} />}
              {pending ? "Importing…" : "Import"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
