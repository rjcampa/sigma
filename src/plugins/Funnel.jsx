import { useMemo, useEffect } from "react";
import { ResponsiveFunnel } from "@nivo/funnel";

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
export default function Funnel({ config, sigmaData, setLoading, onSelect }) {
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
        seen.get(label).value += val;
      } else {
        seen.set(label, { value: val, order: order++ });
      }
    }

    return [...seen.entries()]
      .sort((a, b) => a[1].order - b[1].order)
      .map(([label, { value }]) => ({
        id: label,
        value,
        label,
      }));
  }, [sigmaData, config.dimension1, config.measure]);

  useEffect(() => {
    if (funnelData.length > 0) setLoading(false);
  }, [funnelData, setLoading]);

  if (!funnelData.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
      </div>
    );
  }

  const schemeMap = {
    blues: "blues",
    greens: "greens",
    reds: "reds",
    oranges: "oranges",
    purples: "purples",
    blue_green: "blue_green",
    yellow_green: "yellow_green",
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, fontFamily: "sans-serif", color: "#333",
          flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveFunnel
          data={funnelData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          valueFormat=">,.0f"
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          borderWidth={0}
          shapeBlending={0.66}
          spacing={2}
          labelColor={{ from: "color", modifiers: [["darker", 3]] }}
          enableLabel={config.showLabels ?? true}
          currentPartSizeExtension={10}
          motionConfig="gentle"
          tooltip={({ part }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 12, height: 12,
                backgroundColor: part.color, borderRadius: 2,
              }} />
              <span>
                <strong>{part.data.label || part.data.id}</strong>:{" "}
                {part.formattedValue}
              </span>
            </div>
          )}
          onClick={(part) => {
            if (onSelect && part.data) onSelect(String(part.data.id));
          }}
        />
      </div>
    </div>
  );
}
