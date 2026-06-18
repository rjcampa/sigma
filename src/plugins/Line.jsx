import { useMemo, useEffect } from "react";
import { ResponsiveLine } from "@nivo/line";
import { aggregate } from "../aggregate";

/**
 * Line / Curve chart (multi-series)
 *
 * One line per series across an ordered X. With the **Cumulative** toggle it
 * running-sums each series — turning it into LTV-by-cohort curves or audience
 * saturation curves; otherwise it's a plain multi-series trend line.
 *
 * Required columns:
 *   - dimension1: series (one line each) — e.g. cohort / channel
 *   - dimension2: X axis (ordered) — e.g. period / month
 *   - measure: Y value (aggregated per series × X)
 */
export default function Line({ config, sigmaData, setLoading, onSelect, theme }) {
  const data = useMemo(() => {
    const seriesCol = sigmaData[config.dimension1];
    const xCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    const valCol = sigmaData[config.measure];
    if (!seriesCol || !xCol || !valCol) return [];
    const method = config.aggregation || "Sum";

    const map = {};
    const seriesOrder = [];
    const xs = new Set();
    for (let i = 0; i < seriesCol.length; i++) {
      const v = Number(valCol[i]);
      if (!Number.isFinite(v)) continue;
      const s = String(seriesCol[i] ?? "—");
      const x = String(xCol[i] ?? "");
      if (!map[s]) { map[s] = {}; seriesOrder.push(s); }
      (map[s][x] ||= []).push(v);
      xs.add(x);
    }
    const sortedX = [...xs].sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return Number.isFinite(na) && Number.isFinite(nb) ? na - nb : a.localeCompare(b);
    });

    return seriesOrder.map((s) => {
      let running = 0;
      return {
        id: s,
        data: sortedX.map((x) => {
          const present = map[s][x] != null;
          const raw = present ? aggregate(map[s][x], method) : null;
          if (config.cumulative) {
            if (present) running += raw;
            return { x, y: present ? running : null };
          }
          return { x, y: raw };
        }),
      };
    });
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.aggregation, config.cumulative]);

  useEffect(() => {
    if (data.length) setLoading(false);
  }, [data, setLoading]);

  if (!data.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Map a series, an ordered X column, and a numeric value.
      </div>
    );
  }

  const schemeMap = {
    blues: "blues", greens: "greens", reds: "reds", oranges: "oranges",
    purples: "purples", blue_green: "blue_green", yellow_green: "yellow_green",
  };
  const xCount = data[0]?.data.length ?? 0;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, color: theme?.text ?? "#333", flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveLine
          data={data}
          theme={theme?.nivo}
          margin={{ top: 24, right: 122, bottom: 56, left: 64 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
          curve="monotoneX"
          colors={{ scheme: schemeMap[config.colorScheme] || "blues" }}
          lineWidth={2.5}
          enablePoints={xCount <= 24}
          pointSize={6}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          enableArea={!!config.cumulative}
          areaOpacity={0.12}
          useMesh={true}
          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: xCount > 8 ? -40 : 0 }}
          axisLeft={{ tickSize: 5, tickPadding: 5 }}
          legends={[
            {
              anchor: "bottom-right", direction: "column", translateX: 112,
              itemWidth: 96, itemHeight: 18, itemsSpacing: 2, symbolSize: 10,
              symbolShape: "circle", itemTextColor: theme?.muted ?? "#777",
            },
          ]}
          onClick={(point) => {
            if (onSelect && point?.serieId != null) onSelect(String(point.serieId));
          }}
        />
      </div>
    </div>
  );
}
