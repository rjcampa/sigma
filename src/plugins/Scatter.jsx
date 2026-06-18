import { useMemo, useEffect } from "react";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";

/**
 * Scatter Plot
 *
 * Plots each row as a point at (Value X, Value Y), colored by an optional group.
 * Great for: spend-efficiency (spend × ROAS), correlation, outliers — anywhere
 * two metrics relate per entity.
 *
 * Required columns:
 *   - measure:   Value X (numeric)
 *   - measure2:  Value Y (numeric)
 *   - dimension1: optional group → colors the points into series
 */
export default function Scatter({ config, sigmaData, columns, setLoading, onSelect, theme }) {
  const data = useMemo(() => {
    const xCol = sigmaData[config.measure];
    const yCol = config.measure2 ? sigmaData[config.measure2] : null;
    const gCol = config.dimension1 ? sigmaData[config.dimension1] : null;
    if (!xCol || !yCol) return [];

    const groups = {};
    const order = [];
    for (let i = 0; i < xCol.length; i++) {
      const x = Number(xCol[i]);
      const y = Number(yCol[i]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const g = gCol ? String(gCol[i] ?? "—") : "All";
      if (!groups[g]) { groups[g] = { id: g, data: [] }; order.push(g); }
      groups[g].data.push({ x, y });
    }
    return order.map((g) => groups[g]);
  }, [sigmaData, config.measure, config.measure2, config.dimension1]);

  useEffect(() => {
    if (data.length) setLoading(false);
  }, [data, setLoading]);

  if (!config.measure2) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Scatter needs two numeric measures — map <strong>Value X</strong> and{" "}
        <strong>Value Y</strong>.
      </div>
    );
  }
  if (!data.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check that X and Y columns are numeric.
      </div>
    );
  }

  const schemeMap = {
    blues: "blues", greens: "greens", reds: "reds", oranges: "oranges",
    purples: "purples", blue_green: "blue_green", yellow_green: "yellow_green",
  };
  const xName = columns?.[config.measure]?.name || "Value X";
  const yName = columns?.[config.measure2]?.name || "Value Y";
  const hasGroups = !!config.dimension1;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, color: theme?.text ?? "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveScatterPlot
          data={data}
          theme={theme?.nivo}
          margin={{ top: 24, right: hasGroups ? 120 : 24, bottom: 56, left: 64 }}
          xScale={{ type: "linear", min: "auto", max: "auto" }}
          yScale={{ type: "linear", min: "auto", max: "auto" }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          nodeSize={8}
          blendMode={theme?.isDark ? "lighten" : "multiply"}
          useMesh={true}
          axisBottom={{ tickSize: 5, tickPadding: 5, legend: xName, legendPosition: "middle", legendOffset: 42 }}
          axisLeft={{ tickSize: 5, tickPadding: 5, legend: yName, legendPosition: "middle", legendOffset: -52 }}
          legends={hasGroups ? [
            {
              anchor: "bottom-right", direction: "column", translateX: 112,
              itemWidth: 96, itemHeight: 18, itemsSpacing: 2, symbolSize: 10,
              symbolShape: "circle", itemTextColor: theme?.muted ?? "#777",
            },
          ] : []}
          onClick={(node) => {
            if (onSelect && node?.serieId != null) onSelect(String(node.serieId));
          }}
        />
      </div>
    </div>
  );
}
