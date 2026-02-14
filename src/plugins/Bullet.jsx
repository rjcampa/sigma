import { useMemo, useEffect } from "react";
import { ResponsiveBullet } from "@nivo/bullet";

/**
 * Bullet Chart Plugin
 *
 * Renders horizontal bullet charts comparing actual values against targets/ranges.
 * Great for: KPI vs target, actual spend vs budget, ROAS goals,
 * performance benchmarking.
 *
 * Required columns:
 *   - dimension1: metric label (e.g., "Revenue", "ROAS")
 *   - measure: actual value
 *   - dimension2 (optional, numeric): target value (shown as marker line)
 */
export default function Bullet({ config, sigmaData, setLoading, onSelect }) {
  const bulletData = useMemo(() => {
    const labelCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    const targetCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    if (!labelCol || !valCol) return [];

    // Aggregate by label
    const agg = {};
    for (let i = 0; i < labelCol.length; i++) {
      const label = String(labelCol[i] ?? "Other");
      const val = Number(valCol[i]) || 0;
      const target = targetCol ? (Number(targetCol[i]) || 0) : null;
      if (!agg[label]) agg[label] = { sum: 0, target: null, count: 0 };
      agg[label].sum += val;
      agg[label].count++;
      if (target != null && target > 0) agg[label].target = target;
    }

    const maxVal = Math.max(...Object.values(agg).map((v) => Math.max(v.sum, v.target || 0)));

    return Object.entries(agg).map(([label, { sum, target }]) => ({
      id: label,
      ranges: [0, maxVal * 0.5, maxVal * 0.8, maxVal * 1.1],
      measures: [sum],
      markers: target != null ? [target] : [],
    }));
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (bulletData.length > 0) setLoading(false);
  }, [bulletData, setLoading]);

  if (!bulletData.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
      </div>
    );
  }

  const schemeMap = {
    blues: ["#c6dbef", "#6baed6", "#2171b5", "#084594"],
    greens: ["#c7e9c0", "#74c476", "#238b45", "#005a32"],
    reds: ["#fcbba1", "#fb6a4a", "#cb181d", "#67000d"],
    oranges: ["#fdd0a2", "#fd8d3c", "#d94801", "#7f2704"],
    purples: ["#dadaeb", "#9e9ac8", "#6a51a3", "#3f007d"],
    blue_green: ["#ccece6", "#66c2a4", "#238b45", "#00441b"],
    yellow_green: ["#d9f0a3", "#addd8e", "#41ab5d", "#005a32"],
  };
  const rangeColors = schemeMap[config.colorScheme] || schemeMap.blues;

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
        <ResponsiveBullet
          data={bulletData}
          margin={{ top: 50, right: 90, bottom: 50, left: 90 }}
          spacing={46}
          titleAlign="start"
          titleOffsetX={-70}
          measureSize={0.6}
          rangeColors={rangeColors}
          measureColors={["#333"]}
          markerColors={["#e53935"]}
          markerSize={0.8}
          animate={true}
          motionConfig="gentle"
          onClick={(datum) => {
            if (onSelect) onSelect(String(datum.id || ""));
          }}
        />
      </div>
    </div>
  );
}
