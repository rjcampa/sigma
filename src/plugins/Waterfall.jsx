import { useMemo, useEffect } from "react";
import { aggregate } from "../aggregate";
import { formatNum } from "../format";
import { useContainerSize } from "./useContainerSize";

/**
 * Waterfall (bridge) chart
 *
 * Shows how an ordered set of +/- changes build to a running total, ending with
 * a Total bar. Increases use the accent color, decreases red.
 *
 * Required columns:
 *   - dimension1: step / category (ordered, first-seen)
 *   - measure: the change for each step (may be +/-), aggregated per step
 */

const ACCENT = {
  blues: "#2171b5", greens: "#238b45", reds: "#cb181d", oranges: "#d94801",
  purples: "#6a51a3", blue_green: "#2b8cbe", yellow_green: "#41ab5d",
};

export default function Waterfall({ config, sigmaData, setLoading, theme }) {
  const steps = useMemo(() => {
    const labelCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!labelCol || !valCol) return [];
    const method = config.aggregation || "Sum";
    const map = {};
    const order = [];
    for (let i = 0; i < labelCol.length; i++) {
      const v = Number(valCol[i]);
      if (!Number.isFinite(v)) continue;
      const l = String(labelCol[i] ?? "—");
      if (!(l in map)) { map[l] = []; order.push(l); }
      map[l].push(v);
    }
    return order.map((l) => ({ label: l, delta: aggregate(map[l], method) }));
  }, [sigmaData, config.dimension1, config.measure, config.aggregation]);

  useEffect(() => {
    if (steps.length) setLoading(false);
  }, [steps, setLoading]);

  const [ref, { width, height }] = useContainerSize();
  const accent = ACCENT[config.colorScheme] || ACCENT.blues;

  if (!steps.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Map a step column and a change (+/−) value.
      </div>
    );
  }

  // running totals → bars, plus a final Total bar
  let cum = 0;
  const bars = [];
  for (const s of steps) {
    const start = cum;
    cum += s.delta;
    bars.push({ label: s.label, start, end: cum, delta: s.delta, total: false });
  }
  bars.push({ label: "Total", start: 0, end: cum, delta: cum, total: true });

  const ink = theme?.text ?? "#333";
  const muted = theme?.muted ?? "#777";
  const border = theme?.border ?? "#e5e5e5";
  const red = "#dc2626";

  const W = width || 600, H = height || 360;
  const mL = 56, mR = 16, mT = 18, mB = 52;
  const iw = Math.max(10, W - mL - mR), ih = Math.max(10, H - mT - mB);

  const allVals = bars.flatMap((b) => [b.start, b.end]).concat(0);
  let vmin = Math.min(...allVals), vmax = Math.max(...allVals);
  if (vmin === vmax) { vmin -= 1; vmax += 1; }
  const padv = (vmax - vmin) * 0.1;
  vmin -= padv; vmax += padv;
  const y = (v) => mT + ih * (1 - (v - vmin) / (vmax - vmin));
  const band = iw / bars.length;
  const bw = Math.min(band * 0.6, 64);
  const tickVals = Array.from({ length: 5 }, (_, i) => vmin + ((vmax - vmin) * i) / 4);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{ textAlign: "center", padding: "8px 0", fontSize: 16, fontWeight: 600, color: ink, flexShrink: 0 }}>
          {config.title}
        </div>
      )}
      <div ref={ref} style={{ flex: 1, minHeight: 0 }}>
        {width > 0 && (
          <svg width={W} height={H}>
            {tickVals.map((tv, i) => (
              <g key={i}>
                <line x1={mL} x2={W - mR} y1={y(tv)} y2={y(tv)} stroke={border} strokeWidth={1} strokeDasharray="2 4" />
                <text x={mL - 8} y={y(tv) + 4} textAnchor="end" style={{ fontSize: 11, fill: muted }}>{formatNum(tv)}</text>
              </g>
            ))}
            <line x1={mL} x2={W - mR} y1={y(0)} y2={y(0)} stroke={muted} strokeWidth={1} />
            {bars.map((b, i) => {
              const cx = mL + band * i + band / 2;
              const x = cx - bw / 2;
              const yTop = y(Math.max(b.start, b.end));
              const h = Math.max(1, y(Math.min(b.start, b.end)) - yTop);
              const color = b.total ? ink : b.delta >= 0 ? accent : red;
              return (
                <g key={i}>
                  {i > 0 && (
                    <line
                      x1={mL + band * (i - 1) + band / 2 + bw / 2}
                      x2={x}
                      y1={y(bars[i - 1].end)}
                      y2={y(bars[i - 1].end)}
                      stroke={border} strokeWidth={1.5} strokeDasharray="3 3"
                    />
                  )}
                  <rect x={x} y={yTop} width={bw} height={h} fill={color} rx={2} opacity={0.92} />
                  <text x={cx} y={yTop - 5} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: ink }}>
                    {(b.delta >= 0 && !b.total ? "+" : "") + formatNum(b.delta)}
                  </text>
                  <text x={cx} y={H - mB + 18} textAnchor="middle" style={{ fontSize: 11, fill: muted }}>
                    {b.label.length > 11 ? b.label.slice(0, 10) + "…" : b.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
