import { useMemo, useEffect } from "react";
import { ResponsiveChord } from "@nivo/chord";

/**
 * Chord Diagram Plugin
 *
 * Renders a circular relationship/flow chart showing connections between entities.
 * Great for: cross-channel attribution overlap, audience segment intersection,
 * inter-department transfers, trade flow between regions.
 *
 * Required columns:
 *   - dimension1: source entity
 *   - dimension2: target entity
 *   - measure: relationship value
 */
export default function Chord({ config, sigmaData, setLoading, onSelect }) {
  const { matrix, keys } = useMemo(() => {
    const srcCol = sigmaData[config.dimension1];
    const tgtCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!srcCol || !tgtCol || !valCol) return { matrix: [], keys: [] };

    const nodeSet = new Set();
    const links = {};

    for (let i = 0; i < srcCol.length; i++) {
      const src = String(srcCol[i] ?? "Other");
      const tgt = String(tgtCol[i] ?? "Other");
      const val = Math.abs(Number(valCol[i]) || 0);
      nodeSet.add(src);
      nodeSet.add(tgt);
      const key = `${src}\0${tgt}`;
      links[key] = (links[key] || 0) + val;
    }

    const sortedKeys = [...nodeSet].sort();
    const idx = Object.fromEntries(sortedKeys.map((k, i) => [k, i]));
    const mat = sortedKeys.map(() => sortedKeys.map(() => 0));

    for (const [key, val] of Object.entries(links)) {
      const [src, tgt] = key.split("\0");
      mat[idx[src]][idx[tgt]] = val;
    }

    return { matrix: mat, keys: sortedKeys };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (keys.length > 0) setLoading(false);
  }, [keys, setLoading]);

  if (!keys.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Map source, target, and value columns.
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
        <ResponsiveChord
          matrix={matrix}
          keys={keys}
          margin={{ top: 60, right: 60, bottom: 90, left: 60 }}
          valueFormat=">,.0f"
          padAngle={0.02}
          innerRadiusRatio={0.96}
          innerRadiusOffset={0.02}
          inactiveArcOpacity={0.25}
          arcBorderColor={{ from: "color", modifiers: [["darker", 0.6]] }}
          activeRibbonOpacity={0.75}
          inactiveRibbonOpacity={0.25}
          ribbonBorderColor={{ from: "color", modifiers: [["darker", 0.6]] }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          enableLabel={config.showLabels ?? true}
          label="id"
          labelOffset={12}
          labelRotation={-90}
          labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
          legends={[
            {
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: 70,
              itemWidth: 80,
              itemHeight: 14,
              itemsSpacing: 0,
              itemTextColor: "#999",
              itemDirection: "left-to-right",
              symbolSize: 12,
              symbolShape: "circle",
            },
          ]}
          onClick={(ribbon) => {
            if (onSelect) {
              const label = ribbon.id || ribbon.source?.id || "";
              onSelect(String(label));
            }
          }}
        />
      </div>
    </div>
  );
}
