import { useMemo, useEffect } from "react";
import { ResponsiveParallelCoordinates } from "@nivo/parallel-coordinates";
import { aggregate } from "../aggregate";

/**
 * Parallel Coordinates Plugin ("spaghetti" multi-axis chart)
 *
 * Each line is an entity (dimension1) traced across several numeric axes.
 * Axes are the distinct values of dimension2; the height on each axis is the
 * aggregated measure for that entity × axis. This is a pivot of the same
 * (entity × category × value) shape the Heatmap uses.
 * Great for: multi-metric comparison, segment profiling, spotting outliers
 * and crossing patterns across many measures at once.
 *
 * Required columns:
 *   - dimension1: entity / line (e.g. "Campaign A")
 *   - dimension2: axis / variable (e.g. "CTR", "CPC", "ROAS")
 *   - measure: numeric value at each entity × axis
 */
export default function ParallelCoordinates({ config, sigmaData, setLoading, theme }) {
  const { data, variables } = useMemo(() => {
    const entityCol = sigmaData[config.dimension1];
    const axisCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    const valCol = sigmaData[config.measure];
    if (!entityCol || !axisCol || !valCol) return { data: [], variables: [] };

    // pivot: { entity: { axis: sum } }
    const pivot = {};
    const axes = new Set();
    for (let i = 0; i < entityCol.length; i++) {
      const entity = String(entityCol[i] ?? "Other");
      const axis = String(axisCol[i] ?? "Other");
      const val = Number(valCol[i]) || 0;
      if (!pivot[entity]) pivot[entity] = {};
      (pivot[entity][axis] ||= []).push(val);
      axes.add(axis);
    }

    const sortedAxes = [...axes].sort();
    if (sortedAxes.length < 2) return { data: [], variables: [] };

    const variables = sortedAxes.map((axis, idx) => ({
      id: axis,
      value: axis,
      label: axis,
      min: "auto",
      max: "auto",
      ticksPosition: "before",
      legendPosition: "start",
      legendOffset: idx % 2 === 0 ? -20 : -36,
    }));

    const method = config.aggregation || "Sum";
    const data = Object.entries(pivot).map(([entity, byAxis]) => {
      const row = { _entity: entity };
      for (const axis of sortedAxes) row[axis] = byAxis[axis] ? aggregate(byAxis[axis], method) : 0;
      return row;
    });

    return { data, variables };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (data.length > 0) setLoading(false);
  }, [data, setLoading]);

  if (!data.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map an entity, an axis column (needs ≥2 distinct
        values), and a numeric value.
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
        <ResponsiveParallelCoordinates
          data={data}
          theme={theme?.nivo}
          variables={variables}
          margin={{ top: 50, right: 60, bottom: 50, left: 60 }}
          layout="horizontal"
          curve="monotoneX"
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          lineWidth={2}
          lineOpacity={0.55}
          strokeWidth={2}
          axesTicksPosition="before"
          motionConfig="gentle"
        />
      </div>
    </div>
  );
}
