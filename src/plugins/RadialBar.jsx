import { useMemo, useEffect } from "react";
import { catColors } from "../palette";
import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { aggregate } from "../aggregate";
import { makeFormatter } from "../format";

/**
 * Radial Bar Plugin
 *
 * Renders circular bar/gauge rings — one ring per category.
 * Great for: KPI gauges, budget pacing, goal completion,
 * progress indicators, cyclic comparisons.
 *
 * Required columns:
 *   - dimension1: category label
 *   - measure: numeric value
 *   - dimension2 (optional): sub-category for multi-segment rings
 */
export default function RadialBar({ config, sigmaData, setLoading, onSelect, theme }) {
  const radialData = useMemo(() => {
    const labelCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    const subCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    if (!labelCol || !valCol) return [];

    const method = config.aggregation || "Sum";

    if (subCol) {
      // Multi-segment: { category: { sub: value } }
      const map = {};
      for (let i = 0; i < labelCol.length; i++) {
        const cat = String(labelCol[i] ?? "Other");
        const sub = String(subCol[i] ?? "Other");
        const val = Math.abs(Number(valCol[i]) || 0);
        if (!map[cat]) map[cat] = {};
        (map[cat][sub] ||= []).push(val);
      }
      return Object.entries(map).map(([cat, subs]) => ({
        id: cat,
        data: Object.entries(subs).map(([sub, value]) => ({ x: sub, y: aggregate(value, method) })),
      }));
    } else {
      // Single-segment per category
      const agg = {};
      for (let i = 0; i < labelCol.length; i++) {
        const label = String(labelCol[i] ?? "Other");
        const val = Math.abs(Number(valCol[i]) || 0);
        (agg[label] ||= []).push(val);
      }
      return Object.entries(agg).map(([label, value]) => ({
        id: label,
        data: [{ x: "value", y: aggregate(value, method) }],
      }));
    }
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (radialData.length > 0) setLoading(false);
  }, [radialData, setLoading]);

  if (!radialData.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
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
        <ResponsiveRadialBar
          data={radialData}
          theme={theme?.nivo}
          valueFormat={fmtVal}
          margin={{ top: 40, right: 120, bottom: 40, left: 40 }}
          padding={0.4}
          cornerRadius={2}
          colors={catColors(config)}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
          enableTracks={true}
          tracksColor="#eeeeee"
          enableRadialGrid={true}
          enableCircularGrid={true}
          radialAxisStart={{ tickSize: 5, tickPadding: 5 }}
          circularAxisOuter={{ tickSize: 5, tickPadding: 12 }}
          enableLabels={config.showLabels ?? true}
          labelsSkipAngle={10}
          labelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          animate={true}
          motionConfig="gentle"
          legends={[
            {
              anchor: "right",
              direction: "column",
              justify: false,
              translateX: 80,
              translateY: 0,
              itemsSpacing: 6,
              itemDirection: "left-to-right",
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: "#999",
              symbolSize: 18,
              symbolShape: "square",
            },
          ]}
          onClick={(bar) => {
            if (onSelect) onSelect(String(bar.groupId || bar.id || ""));
          }}
        />
      </div>
    </div>
  );
}
