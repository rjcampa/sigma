import { useMemo, useEffect } from "react";
import { ResponsiveStream } from "@nivo/stream";

/**
 * Stream / Stacked Area Plugin
 *
 * Renders a stacked stream/area chart showing proportional composition over time.
 * Great for: revenue mix over time, traffic sources evolution,
 * category trends, seasonal patterns.
 *
 * Required columns:
 *   - dimension1: time period (x-axis, e.g., "Jan", "2024-01")
 *   - dimension2: category (the layers, e.g., "Organic", "Paid")
 *   - measure: numeric value
 */
export default function Stream({ config, sigmaData, setLoading, onSelect }) {
  const { streamData, streamKeys, timeLabels } = useMemo(() => {
    const timeCol = sigmaData[config.dimension1];
    const catCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!timeCol || !catCol || !valCol)
      return { streamData: [], streamKeys: [], timeLabels: [] };

    // Pivot: { time: { category: value } }
    const map = {};
    const cats = new Set();
    const times = new Set();
    for (let i = 0; i < timeCol.length; i++) {
      const time = String(timeCol[i] ?? "");
      const cat = String(catCol[i] ?? "Other");
      const val = Number(valCol[i]) || 0;
      if (!map[time]) map[time] = {};
      map[time][cat] = (map[time][cat] || 0) + val;
      cats.add(cat);
      times.add(time);
    }

    const sortedTimes = [...times].sort();
    const keys = [...cats].sort();

    // Each array element = one time point with all categories
    const data = sortedTimes.map((time) => {
      const row = {};
      for (const cat of keys) {
        row[cat] = map[time]?.[cat] || 0;
      }
      return row;
    });

    return { streamData: data, streamKeys: keys, timeLabels: sortedTimes };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (streamData.length > 0) setLoading(false);
  }, [streamData, setLoading]);

  if (!streamData.length || !streamKeys.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Map time, category, and value columns.
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
        <ResponsiveStream
          data={streamData}
          keys={streamKeys}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          axisBottom={{
            orient: "bottom",
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            format: (v) => timeLabels[v] || v,
          }}
          axisLeft={{
            orient: "left",
            tickSize: 5,
            tickPadding: 5,
          }}
          curve="basis"
          offsetType="silhouette"
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          fillOpacity={0.85}
          borderWidth={0}
          enableDots={false}
          enableStackTooltip={true}
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              translateX: 100,
              itemWidth: 80,
              itemHeight: 20,
              itemTextColor: "#999",
              symbolSize: 12,
              symbolShape: "circle",
            },
          ]}
        />
      </div>
    </div>
  );
}
