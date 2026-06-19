import { useMemo, useEffect } from "react";
import { catColors } from "../palette";
import { ResponsiveIcicle } from "@nivo/icicle";
import { aggregate } from "../aggregate";
import { makeFormatter } from "../format";

/**
 * Icicle Plugin
 *
 * Renders a rectangular partition (the "flame graph" cousin of Sunburst).
 * Great for: hierarchical spend/size breakdowns, profiling-style views,
 * category → sub-category composition where proportion matters.
 *
 * Required columns:
 *   - dimension1: parent category
 *   - dimension2: child / sub-category — optional (flat bar if omitted)
 *   - measure: numeric value (rectangle size)
 *
 * Shares the exact hierarchy shape used by Sunburst / Treemap / Tree.
 */
export default function Icicle({ config, sigmaData, setLoading, onSelect, theme }) {
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
        <ResponsiveIcicle
          data={treeData}
          theme={theme?.nivo}
          identity="id"
          value="value"
          valueFormat={fmtVal}
          orientation="top"
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          gapX={2}
          gapY={2}
          borderRadius={2}
          borderWidth={1}
          borderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
          colors={catColors(config)}
          inheritColorFromParent={true}
          childColor={{ from: "color", modifiers: [["brighter", 0.3]] }}
          enableLabels={config.showLabels ?? true}
          label="id"
          labelTextColor={{ from: "color", modifiers: [["darker", 2.5]] }}
          animate={true}
          motionConfig="gentle"
          onClick={(node) => {
            if (onSelect && node.id) onSelect(String(node.id));
          }}
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
                <strong>{node.id}</strong>: {node.formattedValue ?? fmtVal(node.value)}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
