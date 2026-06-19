import { useMemo, useEffect } from "react";
import { catColors } from "../palette";
import { ResponsivePie } from "@nivo/pie";
import { aggregate } from "../aggregate";

/**
 * Pie / Donut Plugin
 *
 * Renders a pie or donut chart for part-to-whole breakdowns.
 * Great for: channel mix, spend distribution, audience segments,
 * market share, portfolio allocation.
 *
 * Required columns:
 *   - dimension1: category/slice label
 *   - measure: numeric value
 */
export default function Pie({ config, sigmaData, setLoading, onSelect, theme }) {
  const pieData = useMemo(() => {
    const labelCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!labelCol || !valCol) return [];

    const agg = {};
    for (let i = 0; i < labelCol.length; i++) {
      const label = String(labelCol[i] ?? "Other");
      const val = Math.abs(Number(valCol[i]) || 0);
      (agg[label] ||= []).push(val);
    }

    const method = config.aggregation || "Sum";
    return Object.entries(agg)
      .map(([label, values]) => ({ id: label, label, value: aggregate(values, method) }))
      .sort((a, b) => b.value - a.value);
  }, [sigmaData, config.dimension1, config.measure]);

  useEffect(() => {
    if (pieData.length > 0) setLoading(false);
  }, [pieData, setLoading]);

  if (!pieData.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: theme?.titleSize ?? 16,
          fontWeight: 600, fontFamily: theme?.font ?? "'Inter Variable', system-ui, sans-serif", color: theme?.text ?? "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsivePie
          data={pieData}
          theme={theme?.nivo}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={catColors(config)}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
          enableArcLabels={config.showLabels ?? true}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          enableArcLinkLabels={config.showLabels ?? true}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          tooltip={({ datum }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 12, height: 12,
                backgroundColor: datum.color, borderRadius: 2,
              }} />
              <span>
                <strong>{datum.id}</strong>: {datum.formattedValue}
                {datum.data.percentage != null && ` (${datum.data.percentage}%)`}
              </span>
            </div>
          )}
          onClick={(node) => {
            if (onSelect) onSelect(String(node.id));
          }}
        />
      </div>
    </div>
  );
}
