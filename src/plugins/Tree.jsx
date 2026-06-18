import { useMemo, useEffect } from "react";
import { ResponsiveTree } from "@nivo/tree";
import { aggregate } from "../aggregate";

/**
 * Tree / Dendrogram Plugin
 *
 * Renders a node-link tree (dendrogram) of a category → sub-category hierarchy.
 * Great for: org structures, taxonomy drill-downs, file/folder trees,
 * decision paths, category breakdowns.
 *
 * Required columns:
 *   - dimension1: parent category (branch)
 *   - dimension2: child / sub-category (leaf) — optional (flat tree if omitted)
 *   - measure: numeric value (shown in tooltip)
 *
 * Uses the same hierarchy builder as Sunburst / Treemap.
 */

// Depth color ramps (root → leaf), matching the repo's color-scheme vocabulary.
const RAMP = {
  blues:        ["#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1"],
  greens:       ["#005a32", "#238b45", "#41ab5d", "#74c476", "#a1d99b"],
  reds:         ["#99000d", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272"],
  oranges:      ["#8c2d04", "#d94801", "#f16913", "#fd8d3c", "#fdae6b"],
  purples:      ["#4a1486", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc"],
  blue_green:   ["#0868ac", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5"],
  yellow_green: ["#005a32", "#238443", "#41ab5d", "#78c679", "#addd8e"],
};

export default function Tree({ config, sigmaData, setLoading, onSelect, theme }) {
  const treeData = useMemo(() => {
    const cats = sigmaData[config.dimension1];
    const subcats = config.dimension2 ? sigmaData[config.dimension2] : null;
    const vals = sigmaData[config.measure];
    if (!cats || !vals) return null;

    const tree = {};
    for (let i = 0; i < cats.length; i++) {
      const cat = String(cats[i] ?? "Other");
      const val = Math.abs(Number(vals[i]) || 0);
      if (subcats) {
        const sub = String(subcats[i] ?? "Other");
        if (!tree[cat]) tree[cat] = {};
        (tree[cat][sub] ||= []).push(val);
      } else {
        (tree[cat] ||= []).push(val);
      }
    }

    const method = config.aggregation || "Sum";

    if (subcats) {
      return {
        id: config.title || "root",
        children: Object.entries(tree).map(([cat, subs]) => ({
          id: cat,
          children: Object.entries(subs).map(([sub, val]) => ({ id: sub, value: aggregate(val, method) })),
        })),
      };
    }
    return {
      id: config.title || "root",
      children: Object.entries(tree).map(([cat, val]) => ({ id: cat, value: aggregate(val, method) })),
    };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.title]);

  useEffect(() => {
    if (treeData) setLoading(false);
  }, [treeData, setLoading]);

  if (!treeData || !treeData.children?.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check column mappings.
      </div>
    );
  }

  const ramp = RAMP[config.colorScheme] || RAMP.blues;

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
        <ResponsiveTree
          data={treeData}
          theme={theme?.nivo}
          identity="id"
          mode="dendrogram"
          layout="top-to-bottom"
          margin={{ top: 40, right: 50, bottom: 40, left: 50 }}
          nodeSize={14}
          activeNodeSize={22}
          inactiveNodeSize={10}
          nodeColor={(node) => ramp[Math.min(node.ancestorUids?.length ?? 0, ramp.length - 1)]}
          fixNodeColorAtDepth={2}
          linkThickness={2}
          activeLinkThickness={5}
          inactiveLinkThickness={1}
          linkColor={{ from: "target.color", modifiers: [["opacity", 0.5]] }}
          enableLabel={config.showLabels ?? true}
          label="id"
          labelsPosition="outward"
          orientLabel={false}
          motionConfig="stiff"
          meshDetectionRadius={80}
          onNodeClick={(node) => {
            if (onSelect && node.id) onSelect(String(node.id));
          }}
          nodeTooltip={({ node }) => (
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
                <strong>{node.id}</strong>
                {node.data?.value != null && `: ${Number(node.data.value).toLocaleString()}`}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
