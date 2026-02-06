import { useMemo, useEffect } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";

/**
 * Treemap Plugin
 *
 * Takes Sigma's column-oriented data and renders a hierarchical treemap.
 * Great for: spend breakdowns, category/subcategory analysis,
 * portfolio composition, budget allocation, etc.
 *
 * Required columns:
 *   - dimension1: parent category (e.g., "Marketing", "Engineering")
 *   - dimension2: child/subcategory (e.g., "Facebook Ads", "Google Ads")
 *   - measure: numeric value (e.g., spend, revenue, count)
 *
 * If dimension2 is not mapped, renders a flat treemap of dimension1.
 */
export default function Treemap({ config, sigmaData, setLoading }) {
  const treeData = useMemo(() => {
    const cats = sigmaData[config.dimension1];
    const subcats = config.dimension2 ? sigmaData[config.dimension2] : null;
    const vals = sigmaData[config.measure];

    if (!cats || !vals) return null;

    // Build hierarchy: { parent: { child: sumValue } }
    const tree = {};

    for (let i = 0; i < cats.length; i++) {
      const cat = String(cats[i] ?? "Other");
      const val = Math.abs(Number(vals[i]) || 0); // treemaps need positive values

      if (val === 0) continue;

      if (subcats) {
        const sub = String(subcats[i] ?? "Other");
        if (!tree[cat]) tree[cat] = {};
        tree[cat][sub] = (tree[cat][sub] || 0) + val;
      } else {
        tree[cat] = (tree[cat] || 0) + val;
      }
    }

    // Convert to Nivo's tree format
    if (subcats) {
      return {
        name: config.title || "root",
        children: Object.entries(tree).map(([cat, subs]) => ({
          name: cat,
          children: Object.entries(subs).map(([sub, val]) => ({
            name: sub,
            value: val,
          })),
        })),
      };
    } else {
      return {
        name: config.title || "root",
        children: Object.entries(tree).map(([cat, val]) => ({
          name: cat,
          value: val,
        })),
      };
    }
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.title]);

  useEffect(() => {
    if (treeData) setLoading(false);
  }, [treeData, setLoading]);

  if (!treeData || !treeData.children?.length) {
    return <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
      No data to display. Check column mappings.
    </div>;
  }

  // Map color scheme names to Nivo treemap-compatible schemes
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
        <ResponsiveTreeMap
          data={treeData}
          identity="name"
          value="value"
          valueFormat=">,.0f"
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          tile="squarify"
          leavesOnly={false}
          innerPadding={3}
          outerPadding={3}
          borderWidth={2}
          borderColor={{ from: "color", modifiers: [["darker", 0.5]] }}
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          nodeOpacity={1}
          enableLabel={config.showLabels ?? true}
          label={(node) => {
            // Only show label if the node is big enough
            if (node.width < 40 || node.height < 25) return "";
            const val = node.value.toLocaleString();
            return node.width > 80 ? `${node.id}\n${val}` : node.id;
          }}
          labelSkipSize={24}
          labelTextColor={{ from: "color", modifiers: [["darker", 2.5]] }}
          parentLabelPosition="left"
          parentLabelTextColor={{ from: "color", modifiers: [["darker", 3]] }}
          tooltip={({ node }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
            }}>
              <strong>{node.pathComponents.join(" → ")}</strong>
              <br />
              {node.formattedValue}
            </div>
          )}
        />
      </div>
    </div>
  );
}
