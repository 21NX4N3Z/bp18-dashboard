import { useId } from "react";

export interface SeriesPoint {
  label: string;
  value: number;
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/* ---------- Area / line chart ---------- */

export function AreaChart({
  data,
  target,
  unit = "",
  height = 280,
  labelEvery = 1,
}: {
  data: SeriesPoint[];
  target?: number;
  unit?: string;
  height?: number;
  labelEvery?: number;
}) {
  const W = 720;
  const H = height;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");

  if (data.length === 0) return null;
  const rawMax = Math.max(...data.map((d) => d.value), target ?? 0);
  let maxV = rawMax > 0 ? Math.ceil(rawMax * 1.05) : 1;
  if (maxV >= 20) maxV = Math.ceil(maxV / 5) * 5;
  const tickLabel = (v: number) => (v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));
  const x = (i: number) => padL + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / maxV) * ih;

  const line = data.map((d, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(d.value).toFixed(1)).join(" ");
  const area = line + " L" + x(data.length - 1).toFixed(1) + " " + (padT + ih) + " L" + x(0).toFixed(1) + " " + (padT + ih) + " Z";
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => padT + ih - f * ih);

  const summary =
    data.map((d) => d.label + " " + d.value + unit).join(", ") +
    (target !== undefined ? ", target " + target + unit : "");

  return (
    <svg
      className="chart"
      viewBox={"0 0 " + W + " " + H}
      width="100%"
      role="img"
      aria-label={"Trend chart. " + summary}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{"Trend chart. " + summary}</title>
      <defs>
        <linearGradient id={"g" + gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="chart-area-stop" />
          <stop offset="100%" className="chart-area-stop-end" />
        </linearGradient>
      </defs>

      {gridLines.map((gy, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={gy} y2={gy} className="chart-grid" />
          <text x={padL - 8} y={gy + 4} className="chart-axis" textAnchor="end">
            {tickLabel(maxV * (i / 4))}
          </text>
        </g>
      ))}

      {target !== undefined ? (
        <g>
          <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} className="chart-target" />
          <text x={W - padR} y={y(target) - 6} className="chart-target-label" textAnchor="end">
            TARGET {target}
            {unit}
          </text>
        </g>
      ) : null}

      <path d={area} fill={"url(#g" + gid + ")"} />
      <path d={line} className="chart-line" />

      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" className="chart-dot" />
          {i % labelEvery === 0 || i === data.length - 1 ? (
            <text x={x(i)} y={H - 8} className="chart-axis" textAnchor="middle">
              {d.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/* ---------- Sparkline ---------- */

export function Sparkline({
  data,
  width = 120,
  height = 36,
  tone = "accent",
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: "accent" | "ok" | "warn" | "danger";
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const px = (i / (data.length - 1)) * width;
      const py = height - 4 - ((v - min) / range) * (height - 8);
      return px.toFixed(1) + " " + py.toFixed(1);
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={"0 0 " + width + " " + height}
      className={"spark spark-" + tone}
      role="img"
      aria-label={"Sparkline from " + min + " to " + max}
    >
      <polyline points={pts} />
    </svg>
  );
}

/* ---------- Horizontal bars ---------- */

export function HBars({
  items,
  unit = "",
}: {
  items: { label: string; value: number; max?: number; tone?: "accent" | "ok" | "warn" | "danger" }[];
  unit?: string;
}) {
  const max = Math.max(...items.map((i) => i.max ?? i.value), 1);
  return (
    <div className="hbars">
      {items.map((it, i) => (
        <div className="hbar" key={i}>
          <div className="hbar-top">
            <span className="hbar-label">{it.label}</span>
            <span className="hbar-value mono">
              {it.value}
              {unit}
            </span>
          </div>
          <div className="hbar-track">
            <div
              className={"hbar-fill hbar-" + (it.tone ?? "accent")}
              style={{ width: Math.max(2, (it.value / max) * 100) + "%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Donut ---------- */

export function Donut({
  items,
  size = 180,
  thickness = 22,
  centerValue,
  centerLabel,
}: {
  items: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const summary = items.map((i) => i.label + " " + i.value).join(", ");
  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} role="img" aria-label={"Breakdown. " + summary}>
        <title>{"Breakdown. " + summary}</title>
        <circle cx={size / 2} cy={size / 2} r={r} className="donut-track" strokeWidth={thickness} />
        {items.map((it, i) => {
          const len = (it.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={thickness}
              strokeDasharray={len.toFixed(2) + " " + (c - len).toFixed(2)}
              strokeDashoffset={(-offset).toFixed(2)}
              transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
              style={{ stroke: it.color }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <div className="donut-value mono">{centerValue ?? total}</div>
        <div className="donut-label">{centerLabel ?? "TOTAL"}</div>
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; value: string; color: string }[] }) {
  return (
    <ul className="legend">
      {items.map((it, i) => (
        <li key={i}>
          <span className="legend-swatch" style={{ background: it.color }} aria-hidden="true" />
          <span className="legend-label">{it.label}</span>
          <span className="legend-value mono">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Vertical columns ---------- */

export function Columns({
  items,
  unit = "",
  height = 220,
}: {
  items: { label: string; value: number; tone?: "accent" | "ok" | "warn" | "danger" }[];
  unit?: string;
  height?: number;
}) {
  const W = 720;
  const H = height;
  const padL = 48;
  const padR = 12;
  const padT = 24;
  const padB = 28;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const maxV = niceMax(Math.max(...items.map((i) => i.value), 1) * 1.15);
  const bw = Math.min(64, iw / Math.max(1, items.length) * 0.55);

  return (
    <svg
      className="chart"
      viewBox={"0 0 " + W + " " + H}
      width="100%"
      role="img"
      aria-label={"Bar chart. " + items.map((i) => i.label + " " + i.value).join(", ")}
    >
      <title>{"Bar chart. " + items.map((i) => i.label + " " + i.value).join(", ")}</title>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const gy = padT + ih - f * ih;
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={gy} y2={gy} className="chart-grid" />
            <text x={padL - 8} y={gy + 4} className="chart-axis" textAnchor="end">
              {Math.round(maxV * f)}
            </text>
          </g>
        );
      })}
      {items.map((it, i) => {
        const cx = padL + (iw / items.length) * (i + 0.5);
        const bh = (it.value / maxV) * ih;
        return (
          <g key={i}>
            <rect
              x={cx - bw / 2}
              y={padT + ih - bh}
              width={bw}
              height={Math.max(2, bh)}
              rx="3"
              className={"col col-" + (it.tone ?? "accent")}
            />
            <text x={cx} y={padT + ih - bh - 8} className="chart-value-label" textAnchor="middle">
              {it.value}
              {unit}
            </text>
            <text x={cx} y={H - 8} className="chart-axis" textAnchor="middle">
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Burndown ---------- */

export function Burndown({
  labels,
  ideal,
  actual,
  unit = "",
}: {
  labels: string[];
  ideal: number[];
  actual: number[];
  unit?: string;
}) {
  const W = 720;
  const H = 260;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const maxV = niceMax(Math.max(...ideal, ...actual, 1) * 1.1);
  const x = (i: number) => padL + (labels.length === 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / maxV) * ih;
  const toPath = (arr: number[]) =>
    arr.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");

  return (
    <svg
      className="chart"
      viewBox={"0 0 " + W + " " + H}
      width="100%"
      role="img"
      aria-label={"Burndown chart. Ideal " + ideal.join(", ") + ". Actual " + actual.join(", ")}
    >
      <title>{"Burndown. Ideal " + ideal.join(", ") + ". Actual " + actual.join(", ")}</title>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const gy = padT + ih - f * ih;
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={gy} y2={gy} className="chart-grid" />
            <text x={padL - 8} y={gy + 4} className="chart-axis" textAnchor="end">
              {Math.round(maxV * f)}
            </text>
          </g>
        );
      })}
      <path d={toPath(ideal)} className="chart-line-dashed" />
      <path d={toPath(actual)} className="chart-line" />
      {labels.map((l, i) =>
        i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1 ? (
          <text key={i} x={x(i)} y={H - 8} className="chart-axis" textAnchor="middle">
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}
