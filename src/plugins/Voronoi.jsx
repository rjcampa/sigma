import { useMemo, useEffect } from "react";
import { ResponsiveVoronoi } from "@nivo/voronoi";

/**
 * Voronoi Plugin (2-measure spatial partition)
 *
 * Plots each row as a point at (Value X, Value Y) and partitions the plane
 * into Voronoi cells — every region is the area closest to one point.
 * Great for: showing "territory"/nearest-neighbor structure of a scatter,
 * spotting clusters and gaps in a two-metric space.
 *
 * Required columns:
 *   - dimension1: point label / id
 *   - measure:    Value X (numeric)
 *   - measure2:   Value Y (numeric)   ← unique to this chart
 */

const DOT_COLOR = {
  blues: "#2171b5", greens: "#238b45", reds: "#cb181d", oranges: "#d94801",
  purples: "#6a51a3", blue_green: "#2b8cbe", yellow_green: "#41ab5d",
};

function pad(min, max) {
  if (min === max) return [min - 1, max + 1];
  const m = (max - min) * 0.05;
  return [min - m, max + m];
}

export default function Voronoi({ config, sigmaData, setLoading, theme }) {
  const { points, xDomain, yDomain } = useMemo(() => {
    const idCol = sigmaData[config.dimension1];
    const xCol = sigmaData[config.measure];
    const yCol = config.measure2 ? sigmaData[config.measure2] : null;
    if (!idCol || !xCol || !yCol) return { points: [], xDomain: [0, 1], yDomain: [0, 1] };

    const points = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < idCol.length; i++) {
      const x = Number(xCol[i]);
      const y = Number(yCol[i]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      points.push({ id: `${String(idCol[i] ?? i)}-${i}`, x, y });
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    if (!points.length) return { points: [], xDomain: [0, 1], yDomain: [0, 1] };
    return { points, xDomain: pad(minX, maxX), yDomain: pad(minY, maxY) };
  }, [sigmaData, config.dimension1, config.measure, config.measure2]);

  useEffect(() => {
    if (points.length > 0) setLoading(false);
  }, [points, setLoading]);

  if (!config.measure2) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Voronoi needs two numeric measures — map <strong>Value X</strong> and{" "}
        <strong>Value Y</strong> in the panel.
      </div>
    );
  }
  if (!points.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Check that X and Y columns are numeric.
      </div>
    );
  }

  const dot = DOT_COLOR[config.colorScheme] || DOT_COLOR.blues;

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
        <ResponsiveVoronoi
          data={points}
          theme={theme?.nivo}
          xDomain={xDomain}
          yDomain={yDomain}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          enableLinks={true}
          linkLineWidth={1}
          linkLineColor="#dddddd"
          enableCells={true}
          cellLineWidth={2}
          cellLineColor={dot}
          enablePoints={true}
          pointSize={6}
          pointColor={dot}
        />
      </div>
    </div>
  );
}
