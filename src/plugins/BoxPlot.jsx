import { useMemo, useEffect } from "react";
import { ResponsiveBoxPlot } from "@nivo/boxplot";

/**
 * Box Plot Plugin (distribution / quartiles)
 *
 * Feeds RAW observations to Nivo, which computes quartiles, median, and
 * whiskers per group. Each data row is one observation.
 * Great for: distribution comparison across groups, latency/spend spread,
 * A/B outcome ranges, spotting skew and outliers.
 *
 * Required columns:
 *   - dimension1: group (x-axis bucket)
 *   - dimension2: sub-group (optional — clustered boxes, colored)
 *   - measure: numeric observation value
 */
export default function BoxPlot({ config, sigmaData, setLoading, onSelect, theme }) {
  const { data, groups, subGroups } = useMemo(() => {
    const groupCol = sigmaData[config.dimension1];
    const subCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    const valCol = sigmaData[config.measure];
    if (!groupCol || !valCol) return { data: [], groups: [], subGroups: [] };

    const groupSet = new Set();
    const subSet = new Set();
    const rows = [];
    for (let i = 0; i < groupCol.length; i++) {
      const v = Number(valCol[i]);
      if (!Number.isFinite(v)) continue;
      const group = String(groupCol[i] ?? "Other");
      const subGroup = subCol ? String(subCol[i] ?? "Other") : "all";
      rows.push({ group, subGroup, value: v });
      groupSet.add(group);
      subSet.add(subGroup);
    }

    return {
      data: rows,
      groups: [...groupSet],
      subGroups: [...subSet],
    };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (data.length > 0) setLoading(false);
  }, [data, setLoading]);

  if (!data.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map a group column and a numeric value column.
      </div>
    );
  }

  const schemeMap = {
    blues: "blues", greens: "greens", reds: "reds", oranges: "oranges",
    purples: "purples", blue_green: "blue_green", yellow_green: "yellow_green",
  };
  const hasSub = !!config.dimension2;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, fontFamily: "sans-serif", color: theme?.text ?? "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveBoxPlot
          data={data}
          theme={theme?.nivo}
          groupBy="group"
          subGroupBy="subGroup"
          groups={groups}
          subGroups={subGroups}
          value="value"
          margin={{ top: 40, right: hasSub ? 140 : 40, bottom: 60, left: 70 }}
          padding={0.3}
          colorBy={hasSub ? "subGroup" : "group"}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          borderWidth={2}
          borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
          medianWidth={2}
          medianColor={{ from: "color", modifiers: [["darker", 0.6]] }}
          whiskerWidth={2}
          whiskerEndSize={0.6}
          whiskerColor={{ from: "color", modifiers: [["darker", 0.4]] }}
          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
          axisLeft={{ tickSize: 5, tickPadding: 5 }}
          motionConfig="stiff"
          legends={hasSub ? [
            {
              anchor: "right",
              direction: "column",
              translateX: 100,
              itemWidth: 80,
              itemHeight: 20,
              itemsSpacing: 3,
              symbolSize: 14,
            },
          ] : []}
          onClick={(box) => {
            if (onSelect && box?.group) onSelect(String(box.group));
          }}
        />
      </div>
    </div>
  );
}
