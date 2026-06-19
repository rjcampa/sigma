import { useMemo, useEffect, useCallback } from "react";
import * as Plot from "@observablehq/plot";
import PlotFigure from "./PlotFigure";

/**
 * Hexbin Plugin (Observable Plot)
 *
 * Bins two numeric measures into hexagons colored by density — the right tool
 * for dense scatter where points would overplot. Nivo has no equivalent.
 * Great for: X/Y relationship with thousands of rows, density hot-spots.
 *
 * Required columns:
 *   - measure:  Value X (numeric)
 *   - measure2: Value Y (numeric)   ← unique to this chart
 *   - dimension1: optional label (ignored by the plot)
 */
export default function Hexbin({ config, sigmaData, columns, setLoading, theme }) {
  const rows = useMemo(() => {
    const xCol = sigmaData[config.measure];
    const yCol = config.measure2 ? sigmaData[config.measure2] : null;
    if (!xCol || !yCol) return [];
    const out = [];
    for (let i = 0; i < xCol.length; i++) {
      const x = Number(xCol[i]);
      const y = Number(yCol[i]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      out.push({ x, y });
    }
    return out;
  }, [sigmaData, config.measure, config.measure2]);

  useEffect(() => {
    if (rows.length) setLoading(false);
  }, [rows, setLoading]);

  const xName = columns?.[config.measure]?.name || "Value X";
  const yName = columns?.[config.measure2]?.name || "Value Y";
  const scheme = config.colorScheme || "blues";
  const text = theme?.text ?? "#333";

  const render = useCallback((width, height) => ({
    width, height,
    marginLeft: 54, marginRight: 16, marginTop: 16, marginBottom: 44,
    style: { background: "transparent", color: text, fontFamily: theme?.font ?? "'Inter Variable', system-ui, sans-serif" },
    x: { label: xName, grid: true },
    y: { label: yName, grid: true },
    color: { scheme, legend: true, label: "Count" },
    marks: [
      Plot.hexagon(rows, Plot.hexbin({ fill: "count" }, { x: "x", y: "y", tip: true })),
    ],
  }), [rows, xName, yName, scheme, text]);

  if (!config.measure2) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Hexbin needs two numeric measures — map <strong>Value X</strong> and{" "}
        <strong>Value Y</strong>.
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check that X and Y columns are numeric.
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
