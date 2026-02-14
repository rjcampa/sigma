import { useMemo, useEffect } from "react";
import { ResponsiveRadar } from "@nivo/radar";

/**
 * Radar / Spider Chart Plugin
 *
 * Renders a multi-axis radar chart comparing entities across metrics.
 * Great for: campaign performance scorecards, product comparison,
 * skill assessment, competitive benchmarking.
 *
 * Required columns:
 *   - dimension1: entity being compared (e.g., "Campaign A")
 *   - dimension2: metric name (e.g., "CTR", "CPA", "ROAS")
 *   - measure: metric value
 *
 * The chart pivots the data so each metric is an axis and each entity
 * is a polygon overlay.
 */
export default function Radar({ config, sigmaData, setLoading, onSelect }) {
  const { radarData, radarKeys } = useMemo(() => {
    const entityCol = sigmaData[config.dimension1];
    const metricCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!entityCol || !metricCol || !valCol)
      return { radarData: [], radarKeys: [] };

    // Pivot: { metric: { entity: value } }
    const map = {};
    const entities = new Set();
    for (let i = 0; i < entityCol.length; i++) {
      const entity = String(entityCol[i] ?? "Other");
      const metric = String(metricCol[i] ?? "Other");
      const val = Number(valCol[i]) || 0;
      if (!map[metric]) map[metric] = {};
      map[metric][entity] = (map[metric][entity] || 0) + val;
      entities.add(entity);
    }

    const keys = [...entities];
    const data = Object.entries(map).map(([metric, vals]) => ({
      metric,
      ...Object.fromEntries(keys.map((e) => [e, vals[e] || 0])),
    }));

    return { radarData: data, radarKeys: keys };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (radarData.length > 0) setLoading(false);
  }, [radarData, setLoading]);

  if (!radarData.length || !radarKeys.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Map entity, metric, and value columns.
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
        <ResponsiveRadar
          data={radarData}
          keys={radarKeys}
          indexBy="metric"
          maxValue="auto"
          margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
          curve="linearClosed"
          borderWidth={2}
          borderColor={{ from: "color" }}
          gridLevels={5}
          gridShape="circular"
          gridLabelOffset={36}
          enableDots={true}
          dotSize={10}
          dotColor={{ theme: "background" }}
          dotBorderWidth={2}
          dotBorderColor={{ from: "color" }}
          enableDotLabel={false}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          fillOpacity={0.25}
          blendMode="multiply"
          animate={true}
          motionConfig="wobbly"
          legends={[
            {
              anchor: "top-left",
              direction: "column",
              translateX: -50,
              translateY: -40,
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
