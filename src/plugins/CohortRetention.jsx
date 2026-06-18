import { useMemo, useEffect } from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { aggregate } from "../aggregate";

/**
 * Cohort Retention Heatmap
 *
 * The classic cohort triangle: one row per cohort, one column per period since
 * start, each cell shaded by RETENTION % — the cohort's value in that period
 * relative to its first (baseline) period. Recent cohorts simply have fewer
 * filled cells.
 *
 * Required columns:
 *   - dimension1: cohort (row) — e.g. signup month
 *   - dimension2: period since start (column) — numeric offset 0,1,2,…
 *   - measure: count/users per cohort × period (aggregated; usually Sum)
 */
export default function CohortRetention({ config, sigmaData, setLoading, theme }) {
  const { data, raw } = useMemo(() => {
    const cohortCol = sigmaData[config.dimension1];
    const periodCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    const valCol = sigmaData[config.measure];
    if (!cohortCol || !periodCol || !valCol) return { data: [], raw: {} };
    const method = config.aggregation || "Sum";

    const m = {};
    const cohorts = [];
    const periods = new Set();
    for (let i = 0; i < cohortCol.length; i++) {
      const c = String(cohortCol[i] ?? "?");
      const p = Number(periodCol[i]);
      const v = Number(valCol[i]);
      if (!Number.isFinite(p) || !Number.isFinite(v)) continue;
      if (!m[c]) { m[c] = {}; cohorts.push(c); }
      (m[c][p] ||= []).push(v);
      periods.add(p);
    }
    const sortedPeriods = [...periods].sort((a, b) => a - b);
    cohorts.sort();

    const raw = {};
    const data = cohorts.map((c) => {
      const row = m[c];
      const baseP = sortedPeriods.find((p) => row[p] != null);
      const baseVal = baseP != null ? aggregate(row[baseP], method) : null;
      return {
        id: c,
        data: sortedPeriods.map((p) => {
          const cell = row[p] != null ? aggregate(row[p], method) : null;
          if (cell != null) raw[`${c}|${p}`] = cell;
          const ret = cell != null && baseVal ? (cell / baseVal) * 100 : null;
          return { x: `P${p}`, y: ret };
        }),
      };
    });
    return { data, raw };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.aggregation]);

  useEffect(() => {
    if (data.length) setLoading(false);
  }, [data, setLoading]);

  if (!data.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Map a cohort, a numeric period-since-start, and a count column.
      </div>
    );
  }

  const schemeMap = {
    blues: "blues", greens: "greens", reds: "reds", oranges: "oranges",
    purples: "purples", blue_green: "blue_green", yellow_green: "yellow_green",
  };
  const ink = theme?.text ?? "#333";
  const maxRowLabel = Math.max(...data.map((d) => d.id.length));
  const leftMargin = Math.min(Math.max(maxRowLabel * 7, 70), 200);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{ textAlign: "center", padding: "8px 0", fontSize: 16, fontWeight: 600, color: ink, flexShrink: 0 }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveHeatMap
          data={data}
          theme={theme?.nivo}
          margin={{ top: 40, right: 24, bottom: 24, left: leftMargin }}
          valueFormat={(v) => (v == null ? "" : `${Math.round(v)}%`)}
          axisTop={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
          axisLeft={{ tickSize: 5, tickPadding: 5 }}
          colors={{ type: "sequential", scheme: schemeMap[config.colorScheme] || "blues", minValue: 0, maxValue: 100 }}
          emptyColor={theme?.isDark ? "#23283a" : "#f3f4f6"}
          borderColor={theme?.isDark ? "#23283a" : "#ffffff"}
          borderWidth={2}
          enableLabels={config.showLabels ?? true}
          labelTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          hoverTarget="cell"
          tooltip={({ cell }) => (
            <div style={{
              background: theme?.isDark ? "#2b3142" : "white", color: ink,
              padding: "8px 12px", borderRadius: 8, boxShadow: "0 6px 20px rgba(15,23,42,0.14)",
              fontSize: 13, border: `1px solid ${theme?.border ?? "#e5e5e5"}`,
            }}>
              <strong>{cell.serieId}</strong> · {cell.data.x}
              <br />
              {cell.data.y == null ? "—" : `${Math.round(cell.data.y)}% retained`}
              {raw[`${cell.serieId}|${String(cell.data.x).replace(/^P/, "")}`] != null &&
                ` (${raw[`${cell.serieId}|${String(cell.data.x).replace(/^P/, "")}`].toLocaleString()})`}
            </div>
          )}
        />
      </div>
    </div>
  );
}
