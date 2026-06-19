import { useMemo, useEffect } from "react";
import { catColors } from "../palette";
import { ResponsiveFunnel } from "@nivo/funnel";
import { aggregate } from "../aggregate";
import { makeFormatter } from "../format";

/**
 * Funnel Plugin
 *
 * Renders a conversion-funnel / pipeline chart.
 * Great for: sales funnels, signup flows, marketing pipelines,
 * support ticket stages, hiring pipelines, etc.
 *
 * Required columns:
 *   - dimension1: stage/step label (e.g., "Sent", "Opened", "Clicked")
 *   - measure: numeric value for each stage
 *
 * Stages are displayed in the order they appear in the data.
 * If your data has duplicate stage labels they are aggregated (summed).
 * Sort your source data in Sigma to control the stage order.
 */
export default function Funnel({ config, sigmaData, setLoading, onSelect, theme }) {
  const funnelData = useMemo(() => {
    const labelCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!labelCol || !valCol) return [];

    // Aggregate by label, preserving first-seen order
    const seen = new Map();
    let order = 0;

    for (let i = 0; i < labelCol.length; i++) {
      const label = String(labelCol[i] ?? "Other");
      const val = Number(valCol[i]) || 0;

      if (seen.has(label)) {
        seen.get(label).values.push(val);
      } else {
        seen.set(label, { values: [val], order: order++ });
      }
    }

    const method = config.aggregation || "Sum";

    return [...seen.entries()]
      .sort((a, b) => a[1].order - b[1].order)
      .map(([label, { values }]) => ({
        id: label,
        value: aggregate(values, method),
        label,
      }));
  }, [sigmaData, config.dimension1, config.measure, config.aggregation]);

  // Conversion lookups: % of the first stage (top) and % from the previous stage.
  const conv = useMemo(() => {
    const top = funnelData[0]?.value || 0;
    const m = {};
    funnelData.forEach((d, i) => {
      const prev = i > 0 ? funnelData[i - 1].value : null;
      m[d.id] = {
        pctTop: top ? (d.value / top) * 100 : null,
        pctPrev: i === 0 ? null : prev ? (d.value / prev) * 100 : null,
      };
    });
    return m;
  }, [funnelData]);

  useEffect(() => {
    if (funnelData.length > 0) setLoading(false);
  }, [funnelData, setLoading]);

  if (!funnelData.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
      </div>
    );
  }

  const fmtVal = makeFormatter(config);

  // Custom layer: step-to-step conversion %, in the left margin at each band.
  const ConversionLayer = ({ parts }) => (
    <g>
      {parts.map((p, i) => {
        if (i === 0) return null;
        const pv = parts[i - 1]?.data?.value;
        const v = p?.data?.value;
        if (!pv || v == null) return null;
        const pct = (v / pv) * 100;
        const down = pct < 100;
        return (
          <text
            key={p.data.id ?? i}
            x={-10}
            y={p.y ?? 0}
            textAnchor="end"
            dominantBaseline="central"
            style={{ fontSize: 11, fontWeight: 700, fill: down ? "#dc2626" : "#16a34a" }}
          >
            {down ? "▼" : "▲"} {Math.round(pct)}%
          </text>
        );
      })}
    </g>
  );

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: theme?.titleSize ?? 16,
          fontWeight: 600, fontFamily: theme?.font ?? "'Inter Variable', system-ui, sans-serif", color: theme?.text ?? "#333",
          flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveFunnel
          data={funnelData}
          theme={theme?.nivo}
          margin={{ top: 20, right: 20, bottom: 20, left: 72 }}
          valueFormat={fmtVal}
          colors={catColors(config)}
          borderWidth={0}
          shapeBlending={0.66}
          spacing={2}
          labelColor={{ from: "color", modifiers: [["darker", 3]] }}
          enableLabel={config.showLabels ?? true}
          currentPartSizeExtension={10}
          motionConfig="gentle"
          layers={["separators", "parts", "labels", "annotations", ConversionLayer]}
          tooltip={({ part }) => {
            const c = conv[part.data.id] || {};
            return (
              <div style={{
                background: theme?.isDark ? "#2b3142" : "white", color: theme?.text ?? "#333",
                padding: "8px 12px", borderRadius: 8, fontSize: 13,
                boxShadow: "0 6px 20px rgba(15,23,42,0.14)", border: `1px solid ${theme?.border ?? "#e5e5e5"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: part.color, borderRadius: 2 }} />
                  <strong>{part.data.label || part.data.id}</strong>: {part.formattedValue}
                </div>
                <div style={{ color: theme?.muted ?? "#777", fontSize: 12 }}>
                  {c.pctTop != null && `${Math.round(c.pctTop)}% of top`}
                  {c.pctPrev != null && ` · ${Math.round(c.pctPrev)}% from previous`}
                </div>
              </div>
            );
          }}
          onClick={(part) => {
            if (onSelect && part.data) onSelect(String(part.data.id));
          }}
        />
      </div>
    </div>
  );
}
