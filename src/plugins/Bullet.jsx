import { useMemo, useEffect } from "react";
import { rampColors } from "../palette";
import { ResponsiveBullet } from "@nivo/bullet";
import { aggregate } from "../aggregate";

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
export default function Bullet({ config, sigmaData, setLoading, onSelect, theme }) {
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
      if (!agg[label]) agg[label] = { vals: [], target: null, count: 0 };
      agg[label].vals.push(val);
      agg[label].count++;
      if (target != null && target > 0) agg[label].target = target;
    }

    const method = config.aggregation || "Sum";

    const maxVal = Math.max(...Object.values(agg).map((v) => Math.max(aggregate(v.vals, method), v.target || 0)));

    return Object.entries(agg).map(([label, { vals, target }]) => ({
      id: label,
      ranges: [0, maxVal * 0.5, maxVal * 0.8, maxVal * 1.1],
      measures: [aggregate(vals, method)],
      markers: target != null ? [target] : [],
    }));
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (bulletData.length > 0) setLoading(false);
  }, [bulletData, setLoading]);

  if (!bulletData.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
      </div>
    );
  }
  const rangeColors = rampColors(config);

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
        <ResponsiveBullet
          data={bulletData}
          theme={theme?.nivo}
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
