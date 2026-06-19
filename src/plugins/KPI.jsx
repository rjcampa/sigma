import { useMemo, useEffect } from "react";
import { aggregate } from "../aggregate";
import { formatNum } from "../format";
import { useContainerSize } from "./useContainerSize";

/**
 * KPI / Big-Number Card
 *
 * A single headline metric (aggregated), with an optional period-over-period
 * delta and a sparkline when a trend column is mapped.
 *
 * Required columns:
 *   - measure: the metric (aggregated per the Aggregation control)
 *   - dimension1: optional ordered period → drives the sparkline + Δ vs prev
 */

const ACCENT = {
  blues: "#2171b5", greens: "#238b45", reds: "#cb181d", oranges: "#d94801",
  purples: "#6a51a3", blue_green: "#2b8cbe", yellow_green: "#41ab5d",
};

export default function KPI({ config, sigmaData, columns, setLoading, theme }) {
  const { value, delta, spark } = useMemo(() => {
    const valCol = sigmaData[config.measure];
    if (!valCol) return { value: null, delta: null, spark: [] };
    const method = config.aggregation || "Sum";
    const periodCol = config.dimension1 ? sigmaData[config.dimension1] : null;

    if (periodCol) {
      const map = {};
      const order = [];
      for (let i = 0; i < valCol.length; i++) {
        const v = Number(valCol[i]);
        if (!Number.isFinite(v)) continue;
        const p = String(periodCol[i] ?? "");
        if (!(p in map)) { map[p] = []; order.push(p); }
        map[p].push(v);
      }
      order.sort();
      const series = order.map((p) => aggregate(map[p], method));
      const value = series.length ? series[series.length - 1] : null;
      const prev = series.length > 1 ? series[series.length - 2] : null;
      const delta = prev != null && prev !== 0 ? (value - prev) / Math.abs(prev) : null;
      return { value, delta, spark: series };
    }

    const all = [];
    for (let i = 0; i < valCol.length; i++) {
      const v = Number(valCol[i]);
      if (Number.isFinite(v)) all.push(v);
    }
    return { value: aggregate(all, method), delta: null, spark: [] };
  }, [sigmaData, config.measure, config.dimension1, config.aggregation]);

  useEffect(() => {
    if (value != null) setLoading(false);
  }, [value, setLoading]);

  const [ref, size] = useContainerSize();
  const accent = config.accentColor || ACCENT[config.colorScheme] || ACCENT.blues;
  const label = config.title || columns?.[config.measure]?.name || "Metric";

  if (value == null) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Map a numeric value column.
      </div>
    );
  }

  const numStr = formatNum(value, config.numberFormat);
  const fontSize = Math.max(
    28,
    Math.min((size.height || 200) * 0.34, (size.width || 300) / (numStr.length * 0.62))
  );
  const up = delta != null && delta >= 0;
  const deltaColor = delta == null ? theme?.muted : up ? "#16a34a" : "#dc2626";

  let sparkPath = "";
  if (spark.length > 1) {
    const min = Math.min(...spark), max = Math.max(...spark), rng = max - min || 1;
    sparkPath = spark
      .map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (spark.length - 1)) * 100} ${29 - ((v - min) / rng) * 28}`)
      .join(" ");
  }

  return (
    <div ref={ref} style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 10, padding: 16,
      color: theme?.text ?? "#333", textAlign: "center",
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
        textTransform: "uppercase", color: theme?.muted ?? "#777",
      }}>
        {label}
      </div>
      <div style={{ fontSize, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {numStr}
      </div>
      {delta != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600, color: deltaColor }}>
          <span>{up ? "▲" : "▼"}</span>
          <span>{Math.abs(delta * 100).toFixed(1)}%</span>
          <span style={{ color: theme?.muted ?? "#777", fontWeight: 400, fontSize: 12 }}>vs prev</span>
        </div>
      )}
      {spark.length > 1 && (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none"
          style={{ width: "72%", height: 38, marginTop: 4, overflow: "visible" }}>
          <path d={sparkPath} fill="none" stroke={accent} strokeWidth={2}
            vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
