import { useMemo, useEffect } from "react";
import { catColors } from "../palette";
import { ResponsiveStream } from "@nivo/stream";
import { aggregate } from "../aggregate";
import { makeFormatter } from "../format";

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
export default function Stream({ config, sigmaData, setLoading, onSelect, theme }) {
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
      (map[time][cat] ||= []).push(val);
      cats.add(cat);
      times.add(time);
    }

    const sortedTimes = [...times].sort();
    const keys = [...cats].sort();

    // Each array element = one time point with all categories
    const method = config.aggregation || "Sum";
    const data = sortedTimes.map((time) => {
      const row = {};
      for (const cat of keys) {
        row[cat] = map[time]?.[cat] ? aggregate(map[time][cat], method) : 0;
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
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map time, category, and value columns.
      </div>
    );
  }

  const fmtVal = makeFormatter(config);

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
        <ResponsiveStream
          data={streamData}
          keys={streamKeys}
          theme={theme?.nivo}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          valueFormat={fmtVal}
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
          colors={catColors(config)}
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
