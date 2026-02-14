import { useMemo, useEffect } from "react";
import { ResponsiveBump } from "@nivo/bump";

/**
 * Bump Chart Plugin
 *
 * Renders a ranking chart showing how entities change position over time.
 * Great for: campaign ranking over time, product position changes,
 * team leaderboards, brand ranking evolution.
 *
 * Required columns:
 *   - dimension1: entity/series (e.g., "Campaign A")
 *   - dimension2: time period (e.g., "Week 1", "Jan")
 *   - measure: value used to compute rank (higher = rank 1)
 */
export default function Bump({ config, sigmaData, setLoading, onSelect }) {
  const bumpData = useMemo(() => {
    const entityCol = sigmaData[config.dimension1];
    const timeCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!entityCol || !timeCol || !valCol) return [];

    // Build { entity: { time: value } }
    const map = {};
    const times = new Set();
    for (let i = 0; i < entityCol.length; i++) {
      const entity = String(entityCol[i] ?? "Other");
      const time = String(timeCol[i] ?? "");
      const val = Number(valCol[i]) || 0;
      if (!map[entity]) map[entity] = {};
      map[entity][time] = (map[entity][time] || 0) + val;
      times.add(time);
    }

    const sortedTimes = [...times].sort();

    // Compute ranks per time period (descending value → rank 1)
    const rankings = {};
    for (const time of sortedTimes) {
      const vals = Object.entries(map)
        .map(([entity, timesMap]) => ({ entity, value: timesMap[time] || 0 }))
        .sort((a, b) => b.value - a.value);
      vals.forEach((v, idx) => {
        if (!rankings[v.entity]) rankings[v.entity] = {};
        rankings[v.entity][time] = idx + 1;
      });
    }

    return Object.entries(rankings).map(([entity, ranks]) => ({
      id: entity,
      data: sortedTimes.map((t) => ({ x: t, y: ranks[t] || null })),
    }));
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (bumpData.length > 0) setLoading(false);
  }, [bumpData, setLoading]);

  if (!bumpData.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
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
          fontWeight: 600, fontFamily: "sans-serif", color: "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveBump
          data={bumpData}
          margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          lineWidth={3}
          activeLineWidth={6}
          inactiveLineWidth={3}
          inactiveOpacity={0.15}
          pointSize={10}
          activePointSize={16}
          inactivePointSize={0}
          pointColor={{ theme: "background" }}
          pointBorderWidth={3}
          activePointBorderWidth={3}
          pointBorderColor={{ from: "serie.color" }}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
          }}
          tooltip={({ serie }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 12, height: 12,
                backgroundColor: serie.color, borderRadius: 2,
              }} />
              <strong>{serie.id}</strong>
            </div>
          )}
          onClick={(serie) => {
            if (onSelect && serie.id) onSelect(String(serie.id));
          }}
        />
      </div>
    </div>
  );
}
