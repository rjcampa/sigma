import { useMemo, useEffect } from "react";
import { ResponsiveSwarmPlot } from "@nivo/swarmplot";

/**
 * Swarm Plot Plugin
 *
 * Renders a beeswarm/jitter plot showing distribution of data points by group.
 * Great for: CPA distribution by campaign, salary spread by department,
 * response time by service, price distribution by category.
 *
 * Required columns:
 *   - dimension1: group label (e.g., "Campaign A")
 *   - measure: numeric value (position on the axis)
 *
 * Each row becomes a dot. No aggregation — shows individual data points.
 */
export default function SwarmPlot({ config, sigmaData, setLoading, onSelect }) {
  const { swarmData, groups } = useMemo(() => {
    const groupCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!groupCol || !valCol) return { swarmData: [], groups: [] };

    const groupSet = new Set();
    const data = [];
    for (let i = 0; i < groupCol.length; i++) {
      const group = String(groupCol[i] ?? "Other");
      const value = Number(valCol[i]);
      if (isNaN(value)) continue;
      groupSet.add(group);
      data.push({ id: `${i}`, group, value });
    }

    return { swarmData: data, groups: [...groupSet].sort() };
  }, [sigmaData, config.dimension1, config.measure]);

  useEffect(() => {
    if (swarmData.length > 0) setLoading(false);
  }, [swarmData, setLoading]);

  if (!swarmData.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
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
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, fontFamily: "sans-serif", color: "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveSwarmPlot
          data={swarmData}
          groups={groups}
          value="value"
          valueScale={{ type: "linear", min: "auto", max: "auto" }}
          size={6}
          forceStrength={4}
          simulationIterations={100}
          margin={{ top: 80, right: 100, bottom: 80, left: 100 }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          borderWidth={0}
          borderColor={{ from: "color", modifiers: [["darker", 0.6]] }}
          enableGridX={true}
          enableGridY={true}
          axisTop={{
            orient: "top",
            tickSize: 10,
            tickPadding: 5,
          }}
          axisBottom={{
            orient: "bottom",
            tickSize: 10,
            tickPadding: 5,
          }}
          axisLeft={{
            orient: "left",
            tickSize: 10,
            tickPadding: 5,
          }}
          tooltip={({ node }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 12, height: 12,
                backgroundColor: node.color, borderRadius: "50%",
              }} />
              <span>
                <strong>{node.group}</strong>: {node.value.toLocaleString()}
              </span>
            </div>
          )}
          onClick={(node) => {
            if (onSelect) onSelect(String(node.group));
          }}
        />
      </div>
    </div>
  );
}
