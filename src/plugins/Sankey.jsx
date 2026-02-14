import { useMemo, useEffect } from "react";
import { ResponsiveSankey } from "@nivo/sankey";

/**
 * Sankey Plugin
 *
 * Renders a flow/alluvial diagram showing how values flow between nodes.
 * Great for: attribution flow, customer journey paths, budget allocation,
 * source→destination analysis, traffic flow.
 *
 * Required columns:
 *   - dimension1: source node label
 *   - dimension2: target node label
 *   - measure: flow value
 */
export default function Sankey({ config, sigmaData, setLoading, onSelect }) {
  const sankeyData = useMemo(() => {
    const srcCol = sigmaData[config.dimension1];
    const tgtCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!srcCol || !tgtCol || !valCol) return null;

    const nodeSet = new Set();
    const linkMap = {};

    for (let i = 0; i < srcCol.length; i++) {
      const src = String(srcCol[i] ?? "Other");
      const tgt = String(tgtCol[i] ?? "Other");
      const val = Math.abs(Number(valCol[i]) || 0);
      if (val === 0 || src === tgt) continue;

      nodeSet.add(src);
      nodeSet.add(tgt);
      const key = `${src}\0${tgt}`;
      if (!linkMap[key]) linkMap[key] = { source: src, target: tgt, value: 0 };
      linkMap[key].value += val;
    }

    if (!nodeSet.size) return null;

    return {
      nodes: [...nodeSet].map((id) => ({ id })),
      links: Object.values(linkMap),
    };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (sankeyData) setLoading(false);
  }, [sankeyData, setLoading]);

  if (!sankeyData || !sankeyData.links.length) {
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
        <ResponsiveSankey
          data={sankeyData}
          margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
          align="justify"
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderRadius={3}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          linkContract={3}
          enableLinkGradient={true}
          enableLabels={config.showLabels ?? true}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={16}
          labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
          tooltip={({ node }) => (
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
                <strong>{node.label}</strong>: {node.value.toLocaleString()}
              </span>
            </div>
          )}
          onClick={(data) => {
            if (onSelect) {
              const label = data.id || data.label || `${data.source?.id} → ${data.target?.id}`;
              onSelect(String(label));
            }
          }}
        />
      </div>
    </div>
  );
}
