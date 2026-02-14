import { useMemo, useEffect } from "react";
import { ResponsiveCirclePacking } from "@nivo/circle-packing";

/**
 * Circle Packing Plugin
 *
 * Renders nested circles for hierarchical data — an alternative to treemaps.
 * Great for: org structures, file size distribution, nested category breakdown,
 * budget allocation visualization.
 *
 * Required columns:
 *   - dimension1: parent category
 *   - dimension2 (optional): child/subcategory (flat if omitted)
 *   - measure: numeric value
 *
 * Same data pattern as Treemap and Sunburst.
 */
export default function CirclePacking({ config, sigmaData, setLoading, onSelect }) {
  const treeData = useMemo(() => {
    const cats = sigmaData[config.dimension1];
    const subcats = config.dimension2 ? sigmaData[config.dimension2] : null;
    const vals = sigmaData[config.measure];
    if (!cats || !vals) return null;

    const tree = {};
    for (let i = 0; i < cats.length; i++) {
      const cat = String(cats[i] ?? "Other");
      const val = Math.abs(Number(vals[i]) || 0);
      if (val === 0) continue;

      if (subcats) {
        const sub = String(subcats[i] ?? "Other");
        if (!tree[cat]) tree[cat] = {};
        tree[cat][sub] = (tree[cat][sub] || 0) + val;
      } else {
        tree[cat] = (tree[cat] || 0) + val;
      }
    }

    if (subcats) {
      return {
        id: config.title || "root",
        children: Object.entries(tree).map(([cat, subs]) => ({
          id: cat,
          children: Object.entries(subs).map(([sub, val]) => ({
            id: sub,
            value: val,
          })),
        })),
      };
    } else {
      return {
        id: config.title || "root",
        children: Object.entries(tree).map(([cat, val]) => ({
          id: cat,
          value: val,
        })),
      };
    }
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.title]);

  useEffect(() => {
    if (treeData) setLoading(false);
  }, [treeData, setLoading]);

  if (!treeData || !treeData.children?.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
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
        <ResponsiveCirclePacking
          data={treeData}
          id="id"
          value="value"
          valueFormat=">,.0f"
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          childColor={{ from: "color", modifiers: [["brighter", 0.4]] }}
          padding={4}
          enableLabels={config.showLabels ?? true}
          labelsFilter={(label) => label.node.depth <= 2}
          labelsSkipRadius={20}
          labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
          animate={true}
          motionConfig="gentle"
          tooltip={({ id, value, color }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 12, height: 12,
                backgroundColor: color, borderRadius: "50%",
              }} />
              <span>
                <strong>{id}</strong>: {value.toLocaleString()}
              </span>
            </div>
          )}
          onClick={(node) => {
            if (onSelect && node.id) onSelect(String(node.id));
          }}
        />
      </div>
    </div>
  );
}
