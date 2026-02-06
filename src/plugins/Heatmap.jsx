import { useMemo, useEffect } from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";

/**
 * Heatmap Plugin
 *
 * Takes Sigma's column-oriented data and renders a matrix heatmap.
 * Great for: day-of-week × hour analysis, campaign × metric grids,
 * channel × month performance, etc.
 *
 * Required columns:
 *   - dimension1: row labels (e.g., "Monday", "Campaign A")
 *   - dimension2: column labels (e.g., "9 AM", "Impressions")
 *   - measure: numeric value for each cell
 */
export default function Heatmap({ config, sigmaData, setLoading }) {
  const chartData = useMemo(() => {
    const rowCol = sigmaData[config.dimension1];
    const colCol = sigmaData[config.dimension2];
    const valCol = sigmaData[config.measure];

    if (!rowCol || !colCol || !valCol) return [];

    // Aggregate: { rowLabel: { colLabel: sumOfValues } }
    const matrix = {};
    const allCols = new Set();

    for (let i = 0; i < rowCol.length; i++) {
      const row = String(rowCol[i] ?? "null");
      const col = String(colCol[i] ?? "null");
      const val = Number(valCol[i]) || 0;

      if (!matrix[row]) matrix[row] = {};
      matrix[row][col] = (matrix[row][col] || 0) + val;
      allCols.add(col);
    }

    // Convert to Nivo format: [{ id: rowLabel, data: [{ x: colLabel, y: value }, ...] }]
    const sortedCols = [...allCols].sort();

    return Object.entries(matrix).map(([rowLabel, cols]) => ({
      id: rowLabel,
      data: sortedCols.map((colLabel) => ({
        x: colLabel,
        y: cols[colLabel] ?? null,
      })),
    }));
  }, [sigmaData, config.dimension1, config.dimension2, config.measure]);

  useEffect(() => {
    if (chartData.length > 0) setLoading(false);
  }, [chartData, setLoading]);

  if (!chartData.length) {
    return <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
      No data to display. Check column mappings.
    </div>;
  }

  // Estimate margins based on label lengths
  const maxRowLabel = Math.max(...chartData.map((d) => d.id.length));
  const leftMargin = Math.min(Math.max(maxRowLabel * 7, 60), 200);

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
        <ResponsiveHeatMap
          data={chartData}
          margin={{ top: 60, right: 90, bottom: 30, left: leftMargin }}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
          }}
          colors={{
            type: "sequential",
            scheme: config.colorScheme || "blues",
          }}
          emptyColor="#f5f5f5"
          borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
          borderWidth={1}
          cellOpacity={1}
          labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          enableLabels={config.showLabels ?? true}
          hoverTarget="cell"
          tooltip={({ cell }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
            }}>
              <strong>{cell.serieId}</strong> × <strong>{cell.data.x}</strong>
              <br />
              {cell.formattedValue}
            </div>
          )}
          legends={[
            {
              anchor: "right",
              translateX: 40,
              length: 160,
              thickness: 10,
              direction: "column",
              tickPosition: "after",
              tickSize: 3,
              tickSpacing: 4,
            },
          ]}
        />
      </div>
    </div>
  );
}
