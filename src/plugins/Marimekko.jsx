import { useMemo, useEffect } from "react";
import { ResponsiveMarimekko } from "@nivo/marimekko";
import { aggregate } from "../aggregate";

/**
 * Marimekko / Mosaic Plugin
 *
 * Renders a proportional stacked bar chart where bar WIDTH varies by category total.
 * Great for: market share by segment, revenue by region × product,
 * audience composition across channels.
 *
 * Required columns:
 *   - dimension1: primary category (bar label, e.g., "Region")
 *   - dimension2: sub-category (stacking dimension, e.g., "Product")
 *   - measure: numeric value
 */
export default function Marimekko({ config, sigmaData, setLoading, onSelect, theme }) {
  const { mariData, dimensions } = useMemo(() => {
    const catCol = sigmaData[config.dimension1];
    const subCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!catCol || !subCol || !valCol)
      return { mariData: [], dimensions: [] };

    // Pivot: { category: { sub: value } }
    const map = {};
    const subs = new Set();
    for (let i = 0; i < catCol.length; i++) {
      const cat = String(catCol[i] ?? "Other");
      const sub = String(subCol[i] ?? "Other");
      const val = Number(valCol[i]) || 0;
      if (!map[cat]) map[cat] = {};
      (map[cat][sub] ||= []).push(val);
      subs.add(sub);
    }

    const method = config.aggregation || "Sum";
    const subList = [...subs].sort();
    const dims = subList.map((s) => ({ id: s, value: s }));
    const data = Object.entries(map).map(([cat, vals]) => {
      const aggregated = Object.fromEntries(
        subList.map((s) => [s, vals[s] ? aggregate(vals[s], method) : 0])
      );
      const total = Object.values(aggregated).reduce((s, v) => s + v, 0);
      return {
        id: cat,
        _total: total,
        ...aggregated,
      };
    });

    return { mariData: data, dimensions: dims };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (mariData.length > 0) setLoading(false);
  }, [mariData, setLoading]);

  if (!mariData.length || !dimensions.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map category, sub-category, and value columns.
      </div>
    );
  }

  const schemeMap = {
    blues: "blues", greens: "greens", reds: "reds", oranges: "oranges",
    purples: "purples", blue_green: "blue_green", yellow_green: "yellow_green",
  };

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
        <ResponsiveMarimekko
          data={mariData}
          theme={theme?.nivo}
          id="id"
          value="_total"
          dimensions={dimensions}
          margin={{ top: 40, right: 80, bottom: 100, left: 80 }}
          innerPadding={9}
          axisTop={null}
          axisBottom={{
            orient: "bottom",
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
          }}
          axisLeft={{
            orient: "left",
            tickSize: 5,
            tickPadding: 5,
          }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
          enableGridY={true}
          legends={[
            {
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: 80,
              itemsSpacing: 0,
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: "#999",
              itemDirection: "left-to-right",
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: "square",
            },
          ]}
          onClick={(bar) => {
            if (onSelect) onSelect(String(bar.id || ""));
          }}
        />
      </div>
    </div>
  );
}
