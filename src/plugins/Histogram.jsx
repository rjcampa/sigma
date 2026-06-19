import { useMemo, useEffect, useCallback } from "react";
import * as Plot from "@observablehq/plot";
import PlotFigure from "./PlotFigure";

/**
 * Histogram Plugin (Observable Plot)
 *
 * Bins a numeric column and plots the frequency — a true histogram, which Nivo
 * doesn't offer. Optionally split/colored by a category.
 * Great for: distribution shape, spotting skew/outliers, value-frequency.
 *
 * Required columns:
 *   - measure: numeric value to bin
 *   - dimension1: optional group (stacks/colors the bars)
 */

const SOLID = {
  blues: "#2171b5", greens: "#238b45", reds: "#cb181d", oranges: "#d94801",
  purples: "#6a51a3", blue_green: "#2b8cbe", yellow_green: "#41ab5d",
};

export default function Histogram({ config, sigmaData, columns, setLoading, theme }) {
  const rows = useMemo(() => {
    const valCol = sigmaData[config.measure];
    const grpCol = config.dimension1 ? sigmaData[config.dimension1] : null;
    if (!valCol) return [];
    const out = [];
    for (let i = 0; i < valCol.length; i++) {
      const v = Number(valCol[i]);
      if (!Number.isFinite(v)) continue;
      out.push({ v, g: grpCol ? String(grpCol[i] ?? "—") : null });
    }
    return out;
  }, [sigmaData, config.measure, config.dimension1]);

  useEffect(() => {
    if (rows.length) setLoading(false);
  }, [rows, setLoading]);

  const hasGroup = !!config.dimension1;
  const measureName = columns?.[config.measure]?.name || "Value";
  const scheme = config.colorScheme || "blues";
  const solid = SOLID[scheme] || SOLID.blues;
  const text = theme?.text ?? "#333";
  const border = theme?.border ?? "#e5e5e5";

  const render = useCallback((width, height) => ({
    width, height,
    marginLeft: 54, marginRight: 16, marginTop: 16, marginBottom: 44,
    style: { background: "transparent", color: text, fontFamily: theme?.font ?? "'Inter Variable', system-ui, sans-serif" },
    x: { label: measureName, labelAnchor: "center" },
    y: { label: "Count", grid: true },
    ...(hasGroup ? { color: { legend: true, scheme } } : {}),
    marks: [
      Plot.rectY(rows, Plot.binX({ y: "count" }, {
        x: "v", ...(hasGroup ? { fill: "g" } : { fill: solid }), tip: true, inset: 0.5,
      })),
      Plot.ruleY([0], { stroke: border }),
    ],
  }), [rows, hasGroup, measureName, scheme, solid, text, border]);

  if (!rows.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map a numeric value column.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: theme?.titleSize ?? 16,
          fontWeight: 600, fontFamily: theme?.font ?? "'Inter Variable', system-ui, sans-serif", color: text, flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <PlotFigure render={render} />
      </div>
    </div>
  );
}
