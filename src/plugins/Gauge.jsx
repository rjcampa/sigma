import { useMemo, useEffect } from "react";
import { aggregate } from "../aggregate";
import { formatNum } from "../format";

/**
 * Gauge
 *
 * Radial gauge of an aggregated value vs a target/max (270° sweep).
 *
 * Required columns:
 *   - measure: the value (aggregated)
 *   - dimension2: optional numeric target/max (aggregated); defaults to value×1.25
 */

const ACCENT = {
  blues: "#2171b5", greens: "#238b45", reds: "#cb181d", oranges: "#d94801",
  purples: "#6a51a3", blue_green: "#2b8cbe", yellow_green: "#41ab5d",
};

const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const arc = (cx, cy, r, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
};

export default function Gauge({ config, sigmaData, setLoading, theme }) {
  const { value, max } = useMemo(() => {
    const valCol = sigmaData[config.measure];
    if (!valCol) return { value: null, max: null };
    const method = config.aggregation || "Sum";
    const vals = [];
    for (let i = 0; i < valCol.length; i++) {
      const v = Number(valCol[i]);
      if (Number.isFinite(v)) vals.push(v);
    }
    const value = aggregate(vals, method);

    let max = null;
    const tgtCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    if (tgtCol) {
      const t = [];
      for (let i = 0; i < tgtCol.length; i++) {
        const v = Number(tgtCol[i]);
        if (Number.isFinite(v)) t.push(v);
      }
      max = aggregate(t, method);
    }
    if (!max || max <= 0) max = value > 0 ? value * 1.25 : 1;
    return { value, max };
  }, [sigmaData, config.measure, config.dimension2, config.aggregation]);

  useEffect(() => {
    if (value != null) setLoading(false);
  }, [value, setLoading]);

  const accent = ACCENT[config.colorScheme] || ACCENT.blues;
  if (value == null) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Map a numeric value column.
      </div>
    );
  }

  const ratio = max ? value / max : 0;          // true ratio (may exceed 1)
  const pct = Math.max(0, Math.min(1, ratio));   // clamped for the arc/needle
  const START = -135, END = 135;
  const valDeg = START + (END - START) * pct;
  const cx = 100, cy = 100, r = 76;
  const track = theme?.isDark ? "#3a4156" : "#e8ebf0";
  const ink = theme?.text ?? "#333";
  const muted = theme?.muted ?? "#777";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, color: ink, flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <svg viewBox="0 0 200 175" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
          <path d={arc(cx, cy, r, START, END)} fill="none" stroke={track} strokeWidth={16} strokeLinecap="round" />
          {pct > 0 && (
            <path d={arc(cx, cy, r, START, valDeg)} fill="none" stroke={accent} strokeWidth={16} strokeLinecap="round" />
          )}
          <line x1={cx} y1={cy} x2={polar(cx, cy, r - 12, valDeg)[0]} y2={polar(cx, cy, r - 12, valDeg)[1]}
            stroke={ink} strokeWidth={3} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={6} fill={ink} />
          <text x={cx} y={cy + 46} textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: ink }}>
            {formatNum(value)}
          </text>
          <text x={cx} y={cy + 64} textAnchor="middle" style={{ fontSize: 12, fill: muted }}>
            {Math.round(ratio * 100)}% of {formatNum(max)}
          </text>
        </svg>
      </div>
    </div>
  );
}
