import { useMemo, useEffect } from "react";
import { ResponsiveWaffle } from "@nivo/waffle";

/**
 * Waffle Chart Plugin
 *
 * Renders a grid of small squares filled proportionally by category.
 * Great for: budget allocation progress, survey results,
 * goal completion, proportion visualization.
 *
 * Required columns:
 *   - dimension1: category label
 *   - measure: numeric value
 */
export default function Waffle({ config, sigmaData, setLoading, onSelect }) {
  const waffleData = useMemo(() => {
    const labelCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!labelCol || !valCol) return [];

    const agg = {};
    for (let i = 0; i < labelCol.length; i++) {
      const label = String(labelCol[i] ?? "Other");
      const val = Math.abs(Number(valCol[i]) || 0);
      agg[label] = (agg[label] || 0) + val;
    }

    return Object.entries(agg)
      .map(([label, value]) => ({ id: label, label, value }))
      .sort((a, b) => b.value - a.value);
  }, [sigmaData, config.dimension1, config.measure]);

  useEffect(() => {
    if (waffleData.length > 0) setLoading(false);
  }, [waffleData, setLoading]);

  if (!waffleData.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
      </div>
    );
  }

  const total = waffleData.reduce((s, d) => s + d.value, 0);

  const schemeMap = {
    blues: "blues", greens: "greens", reds: "reds", oranges: "oranges",
    purples: "purples", blue_green: "blue_green", yellow_green: "yellow_green",
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, fontFamily: "sans-serif", color: "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveWaffle
          data={waffleData}
          total={total}
          rows={18}
          columns={14}
          padding={1}
          margin={{ top: 10, right: 10, bottom: 10, left: 120 }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          borderRadius={3}
          borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
          animate={true}
          motionStiffness={90}
          motionDamping={11}
          legends={[
            {
              anchor: "top-left",
              direction: "column",
              justify: false,
              translateX: -100,
              translateY: 0,
              itemsSpacing: 4,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 1,
              itemTextColor: "#777",
              symbolSize: 20,
            },
          ]}
          onClick={(node) => {
            if (onSelect) onSelect(String(node.id || node.data?.id || ""));
          }}
        />
      </div>
    </div>
  );
}
