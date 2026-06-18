import { useMemo, useEffect } from "react";
import { ResponsiveNetwork } from "@nivo/network";
import { aggregate } from "../aggregate";

/**
 * Network / Force-Directed Graph Plugin
 *
 * Renders a force-directed node-link graph. Nodes are colored by role
 * (source-only, target-only, or both); link length encodes weight
 * (heavier relationships pull nodes closer).
 * Great for: co-occurrence, referrals, dependency graphs, account maps,
 * source→target relationships that aren't a clean flow.
 *
 * Required columns:
 *   - dimension1: source node
 *   - dimension2: target node
 *   - measure: relationship weight
 */

// [source-only, target-only, both] role colors per scheme.
const ROLE_COLORS = {
  blues:        ["#2171b5", "#6baed6", "#084594"],
  greens:       ["#238b45", "#74c476", "#005a32"],
  reds:         ["#cb181d", "#fb6a4a", "#99000d"],
  oranges:      ["#d94801", "#fd8d3c", "#8c2d04"],
  purples:      ["#6a51a3", "#9e9ac8", "#4a1486"],
  blue_green:   ["#2b8cbe", "#7bccc4", "#0868ac"],
  yellow_green: ["#41ab5d", "#addd8e", "#238443"],
};

export default function Network({ config, sigmaData, setLoading, onSelect, theme }) {
  const graph = useMemo(() => {
    const srcCol = sigmaData[config.dimension1];
    const tgtCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!srcCol || !tgtCol || !valCol) return null;

    const method = config.aggregation || "Sum";
    const isSource = new Set();
    const isTarget = new Set();
    const degree = {};
    const linkMap = {};

    for (let i = 0; i < srcCol.length; i++) {
      const src = String(srcCol[i] ?? "Other");
      const tgt = String(tgtCol[i] ?? "Other");
      const val = Math.abs(Number(valCol[i]) || 0);
      if (val === 0 || src === tgt) continue;

      isSource.add(src);
      isTarget.add(tgt);
      (degree[src] ||= []).push(val);
      (degree[tgt] ||= []).push(val);

      const key = `${src}\0${tgt}`;
      if (!linkMap[key]) linkMap[key] = { source: src, target: tgt, values: [] };
      linkMap[key].values.push(val);
    }

    const ids = new Set([...isSource, ...isTarget]);
    if (!ids.size) return null;

    let maxWeight = 0;
    for (const l of Object.values(linkMap)) {
      l.value = aggregate(l.values, method);
      maxWeight = Math.max(maxWeight, l.value);
    }

    const [cSrc, cTgt, cBoth] = ROLE_COLORS[config.colorScheme] || ROLE_COLORS.blues;
    const degreeTotals = {};
    for (const id of ids) degreeTotals[id] = degree[id] ? aggregate(degree[id], method) : 0;
    const maxDeg = Math.max(1, ...Object.values(degreeTotals));

    const nodes = [...ids].map((id) => {
      const both = isSource.has(id) && isTarget.has(id);
      const color = both ? cBoth : isTarget.has(id) ? cTgt : cSrc;
      // size scaled 10..30 by weighted degree
      const size = 10 + 20 * Math.sqrt((degreeTotals[id] || 0) / maxDeg);
      return { id, color, size };
    });

    const links = Object.values(linkMap).map((l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
      // heavier links → shorter distance (40..120)
      distance: 120 - 80 * (l.value / (maxWeight || 1)),
    }));

    return { nodes, links, maxWeight };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.colorScheme, config.aggregation]);

  useEffect(() => {
    if (graph) setLoading(false);
  }, [graph, setLoading]);

  if (!graph || !graph.links.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map source, target, and weight columns.
      </div>
    );
  }

  const maxLinkValue = graph.maxWeight || 1;

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
        <ResponsiveNetwork
          data={graph}
          theme={theme?.nivo}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          linkDistance={(link) => link.distance ?? 60}
          centeringStrength={0.3}
          repulsivity={10}
          iterations={90}
          nodeSize={(node) => node.size ?? 14}
          activeNodeSize={(node) => 1.4 * (node.size ?? 14)}
          nodeColor={(node) => node.color ?? "#888"}
          nodeBorderWidth={1}
          nodeBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
          linkThickness={(link) => 1 + Math.min(4, (link.data?.value ?? 1) / (maxLinkValue / 4 || 1))}
          linkColor={{ from: "source.color", modifiers: [["opacity", 0.4]] }}
          motionConfig="wobbly"
          onClick={(node) => {
            if (onSelect && node?.id) onSelect(String(node.id));
          }}
        />
      </div>
    </div>
  );
}
