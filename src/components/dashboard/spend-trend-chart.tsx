"use client";

import { useId, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { formatShortDate } from "@/lib/dates";
import type { DayPoint } from "@/lib/analytics";

type Point = { x: number; y: number };

function niceMax(value: number) {
  if (value <= 0) return 100;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

function smoothPath(points: Point[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export function SpendTrendChart({
  current,
  previous,
  currency,
}: {
  current: DayPoint[];
  previous: DayPoint[];
  currency: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const width = 640;
  const height = 208;
  const padTop = 14;
  const padBottom = 8;
  const padX = 6;

  const previousAligned = useMemo(() => {
    if (previous.length === 0) return [];
    return current.map((_, index) => previous[Math.min(index, previous.length - 1)]);
  }, [current, previous]);

  const maxValue = useMemo(() => {
    const values = [
      ...current.map((point) => point.cumulative),
      ...previousAligned.map((point) => point.cumulative),
    ];
    return niceMax(Math.max(0, ...values));
  }, [current, previousAligned]);

  const toPoints = (series: DayPoint[]): Point[] =>
    series.map((point, index) => ({
      x: padX + (index / Math.max(1, series.length - 1)) * (width - padX * 2),
      y: padTop + (1 - point.cumulative / maxValue) * (height - padTop - padBottom),
    }));

  const currentPoints = toPoints(current);
  const previousPoints = toPoints(previousAligned);
  const currentLine = smoothPath(currentPoints);
  const previousLine = smoothPath(previousPoints);
  const area =
    currentPoints.length > 1
      ? `${currentLine} L ${currentPoints[currentPoints.length - 1].x} ${height - padBottom} L ${currentPoints[0].x} ${height - padBottom} Z`
      : "";

  const hoverPoint = hover !== null ? currentPoints[hover] : null;
  const hoverDay = hover !== null ? current[hover] : null;
  const hoverPrev = hover !== null ? previousAligned[hover] : null;

  if (current.length === 0) {
    return (
      <div className="flex h-[208px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.012]">
        <p className="text-[12px] text-muted">No spending logged for this month yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label="Cumulative spending this month compared with last month"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
          setHover(Math.round(ratio * (current.length - 1)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CDF56B" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#CDF56B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padTop + fraction * (height - padTop - padBottom);
          return (
            <line
              key={fraction}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.055)"
              strokeDasharray="3 6"
            />
          );
        })}

        {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
        {previousPoints.length > 1 ? (
          <path
            d={previousLine}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {currentPoints.length > 1 ? (
          <path
            d={currentLine}
            fill="none"
            stroke="#CDF56B"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {hoverPoint ? (
          <>
            <line
              x1={hoverPoint.x}
              x2={hoverPoint.x}
              y1={padTop}
              y2={height - padBottom}
              stroke="rgba(255,255,255,0.14)"
              strokeDasharray="3 4"
            />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="4" fill="#CDF56B" stroke="#0E1014" strokeWidth="2" />
          </>
        ) : (
          currentPoints.length > 0
            ? <circle
                cx={currentPoints[currentPoints.length - 1].x}
                cy={currentPoints[currentPoints.length - 1].y}
                r="3.5"
                fill="#CDF56B"
                stroke="#0E1014"
                strokeWidth="2"
              />
            : null
        )}
      </svg>

      <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-muted/70">
        <span>{formatShortDate(current[0].date)}</span>
        <span>{formatShortDate(current[Math.floor((current.length - 1) / 2)].date)}</span>
        <span>{formatShortDate(current[current.length - 1].date)}</span>
      </div>

      {hoverPoint && hoverDay ? (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-white/[0.1] bg-[#171a20]/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{ left: `${Math.min(88, Math.max(12, (hoverPoint.x / width) * 100))}%` }}
        >
          <p className="mb-1 text-[10px] font-medium text-muted">{formatShortDate(hoverDay.date)}</p>
          <p className="flex items-center gap-1.5 whitespace-nowrap text-[11.5px] text-white">
            <span className="size-1.5 rounded-full bg-brand" />
            <span className="num font-medium">{formatMoney(hoverDay.cumulative, currency)}</span>
            <span className="text-muted/70">this month</span>
          </p>
          {hoverPrev ? (
            <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[10.5px] text-muted">
              <span className="size-1.5 rounded-full bg-white/30" />
              <span className="num">{formatMoney(hoverPrev.cumulative, currency)}</span>
              <span className="text-muted/60">last month</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
