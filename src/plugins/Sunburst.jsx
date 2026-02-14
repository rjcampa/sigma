import { useMemo, useEffect } from "react";
import { ResponsiveSunburst } from "@nivo/sunburst";

/**
 * Sunburst Plugin
 *
 * Renders a radial hierarchical chart (concentric rings).
 * Great for: category/subcategory breakdowns, org structures,
 * file-size distributions, budget allocation, etc.
 *
 * Required columns:
 *   - dimension1: parent category (e.g., "Marketing", "Engineering")
 *   - dimension2: child/subcategory (optional — flat ring if omitted)
 *   - measure: numeric value (e.g., spend, revenue, count)
 *
 * Uses the same data transformation pattern as Treemap.
 */
export default function Sunburst({ config, sigmaData, setLoading, onSelect }) {
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
    blues: "blues",
    greens: "greens",
    reds: "reds",
    oranges: "oranges",
    purples: "purples",
    blue_green: "blue_green",
    yellow_green: "yellow_green",
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, fontFamily: "sans-serif", color: "#333",
          flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveSunburst
          data={treeData}
          id="id"
          value="value"
          valueFormat=">,.0f"
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          cornerRadius={2}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          childColor={{ from: "color", modifiers: [["brighter", 0.3]] }}
          inheritColorFromParent={true}
          enableArcLabels={config.showLabels ?? true}
          arcLabel="id"
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.5]] }}
          animate={true}
          motionConfig="gentle"
          tooltip={(node) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 12, height: 12,
                backgroundColor: node.color, borderRadius: 2,
              }} />
              <span>
                <strong>{node.id}</strong>: {node.formattedValue}
                {node.percentage != null && ` (${node.percentage.toFixed(1)}%)`}
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
