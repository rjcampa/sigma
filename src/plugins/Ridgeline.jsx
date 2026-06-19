import { useMemo, useEffect, useCallback } from "react";
import * as Plot from "@observablehq/plot";
import PlotFigure from "./PlotFigure";
import { catColors } from "../palette";

const colorKey = (c) =>
  [c.colorScheme, c.reverseColors, c.color1, c.color2, c.color3, c.color4, c.color5, c.color6].join("|");

/**
 * Ridgeline Plugin (Observable Plot)
 *
 * Stacks one distribution per group as faceted area curves — great for
 * comparing how a value is distributed across many categories at a glance
 * (the classic "joy plot"). Nivo has no equivalent.
 *
 * Required columns:
 *   - dimension1: group (one ridge/row per distinct value)
 *   - measure: numeric value whose distribution is drawn
 */
export default function Ridgeline({ config, sigmaData, columns, setLoading, theme }) {
  const rows = useMemo(() => {
    const grpCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!grpCol || !valCol) return [];
    const out = [];
    for (let i = 0; i < valCol.length; i++) {
      const v = Number(valCol[i]);
      if (!Number.isFinite(v)) continue;
      out.push({ v, g: String(grpCol[i] ?? "—") });
    }
    return out;
  }, [sigmaData, config.dimension1, config.measure]);

  useEffect(() => {
    if (rows.length) setLoading(false);
  }, [rows, setLoading]);

  const measureName = columns?.[config.measure]?.name || "Value";
  const ckey = colorKey(config);
  const font = theme?.font ?? "'Inter Variable', system-ui, sans-serif";
  const text = theme?.text ?? "#333";
  const border = theme?.border ?? "#e5e5e5";

  const render = useCallback((width, height) => ({
    width, height,
    marginLeft: 96, marginRight: 20, marginTop: 16, marginBottom: 40,
    style: { background: "transparent", color: text, fontFamily: font },
    x: { label: measureName },
    y: { axis: null },
    fy: { label: null },
    color: { range: catColors(config) },
    marks: [
      Plot.areaY(rows, Plot.binX({ y2: "count" }, {
        x: "v", fy: "g", fill: "g", fillOpacity: 0.75, curve: "basis",
      })),
      Plot.ruleY([0], { stroke: border }),
    ],
  }), [rows, measureName, ckey, font, text, border]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rows.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map a group column and a numeric value column.
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
