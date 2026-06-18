import { useMemo, useEffect } from "react";
import { ResponsiveAreaBump } from "@nivo/bump";

/**
 * Area Bump Plugin (ranked streamgraph)
 *
 * Like the Bump chart, but ribbon thickness encodes magnitude — series flow
 * and re-stack over time while their vertical order tracks rank. Reads the
 * same shape as Bump (entity × time × value).
 * Great for: market-share over time, category mix evolution, audience shift,
 * "who's winning and by how much" stories.
 *
 * Required columns:
 *   - dimension1: series / entity
 *   - dimension2: time period (ordered)
 *   - measure: value (ribbon thickness)
 */
export default function AreaBump({ config, sigmaData, setLoading, onSelect, theme }) {
  const data = useMemo(() => {
    const entityCol = sigmaData[config.dimension1];
    const timeCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!entityCol || !timeCol || !valCol) return [];

    const map = {};
    const times = new Set();
    for (let i = 0; i < entityCol.length; i++) {
      const entity = String(entityCol[i] ?? "Other");
      const time = String(timeCol[i] ?? "");
      const val = Math.abs(Number(valCol[i]) || 0);
      if (!map[entity]) map[entity] = {};
      map[entity][time] = (map[entity][time] || 0) + val;
      times.add(time);
    }

    const sortedTimes = [...times].sort();
    return Object.entries(map).map(([entity, byTime]) => ({
      id: entity,
      data: sortedTimes.map((t) => ({ x: t, y: byTime[t] || 0 })),
    }));
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (data.length > 0) setLoading(false);
  }, [data, setLoading]);

  if (!data.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map entity, time period, and value columns.
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
          fontWeight: 600, fontFamily: "'Inter Variable', system-ui, sans-serif", color: theme?.text ?? "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveAreaBump
          data={data}
          theme={theme?.nivo}
          margin={{ top: 40, right: 100, bottom: 40, left: 100 }}
          spacing={8}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          blendMode="multiply"
          borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
          startLabel={config.showLabels ?? true ? "id" : false}
          endLabel={config.showLabels ?? true ? "id" : false}
          axisTop={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
          motionConfig="gentle"
          onClick={(serie) => {
            if (onSelect && serie?.id) onSelect(String(serie.id));
          }}
        />
      </div>
    </div>
  );
}
