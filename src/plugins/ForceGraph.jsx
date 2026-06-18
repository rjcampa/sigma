import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";

/**
 * Force Graph Plugin (animated network, canvas/WebGL via react-force-graph)
 *
 * A physics-driven node-link graph with **directional moving particles** along
 * each link — the literal "animated spaghetti" of flow between entities. Scales
 * to far more nodes than the SVG-based Network chart.
 *
 * Required columns:
 *   - dimension1: source node
 *   - dimension2: target node
 *   - measure: relationship weight (link strength / particle density)
 */

const ROLE_COLORS = {
  blues:        ["#2171b5", "#6baed6", "#084594"],
  greens:       ["#238b45", "#74c476", "#005a32"],
  reds:         ["#cb181d", "#fb6a4a", "#99000d"],
  oranges:      ["#d94801", "#fd8d3c", "#8c2d04"],
  purples:      ["#6a51a3", "#9e9ac8", "#4a1486"],
  blue_green:   ["#2b8cbe", "#7bccc4", "#0868ac"],
  yellow_green: ["#41ab5d", "#addd8e", "#238443"],
};

export default function ForceGraph({ config, sigmaData, setLoading, onSelect, theme }) {
  const graph = useMemo(() => {
    const srcCol = sigmaData[config.dimension1];
    const tgtCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];
    if (!srcCol || !tgtCol || !valCol) return null;

    const isSource = new Set();
    const isTarget = new Set();
    const degree = {};
    const linkMap = {};
    let maxWeight = 0;

    for (let i = 0; i < srcCol.length; i++) {
      const src = String(srcCol[i] ?? "Other");
      const tgt = String(tgtCol[i] ?? "Other");
      const val = Math.abs(Number(valCol[i]) || 0);
      if (val === 0 || src === tgt) continue;
      isSource.add(src);
      isTarget.add(tgt);
      degree[src] = (degree[src] || 0) + val;
      degree[tgt] = (degree[tgt] || 0) + val;
      const key = `${src}\0${tgt}`;
      if (!linkMap[key]) linkMap[key] = { source: src, target: tgt, value: 0 };
      linkMap[key].value += val;
      maxWeight = Math.max(maxWeight, linkMap[key].value);
    }

    const ids = new Set([...isSource, ...isTarget]);
    if (!ids.size) return null;

    const [cSrc, cTgt, cBoth] = ROLE_COLORS[config.colorScheme] || ROLE_COLORS.blues;
    const maxDeg = Math.max(1, ...Object.values(degree));

    const nodes = [...ids].map((id) => {
      const both = isSource.has(id) && isTarget.has(id);
      return {
        id,
        color: both ? cBoth : isTarget.has(id) ? cTgt : cSrc,
        val: 2 + 8 * ((degree[id] || 0) / maxDeg),
      };
    });

    const links = Object.values(linkMap).map((l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
      width: 0.5 + 3 * (l.value / (maxWeight || 1)),
      particles: 1 + Math.round(4 * (l.value / (maxWeight || 1))),
    }));

    return { nodes, links };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.colorScheme]);

  useEffect(() => {
    if (graph) setLoading(false);
  }, [graph, setLoading]);

  // Measure the container — react-force-graph needs explicit width/height.
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) => {
        const width = Math.floor(r.width), height = Math.floor(r.height);
        return prev.width === width && prev.height === height ? prev : { width, height };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const linkColor = useCallback(() => (theme?.isDark ? "#586089" : "#cbd5e1"), [theme]);

  if (!graph || !graph.links.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Map source, target, and weight columns.
      </div>
    );
  }

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
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {size.width > 0 && size.height > 0 && (
          <ForceGraph2D
            width={size.width}
            height={size.height}
            graphData={graph}
            backgroundColor={theme?.background ?? "#ffffff"}
            nodeId="id"
            nodeColor="color"
            nodeVal="val"
            nodeRelSize={5}
            nodeLabel="id"
            linkColor={linkColor}
            linkWidth="width"
            linkDirectionalParticles="particles"
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.006}
            cooldownTicks={120}
            onNodeClick={(node) => {
              if (onSelect && node?.id != null) onSelect(String(node.id));
            }}
          />
        )}
      </div>
    </div>
  );
}
