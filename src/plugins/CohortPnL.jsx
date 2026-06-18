import { useMemo, useEffect } from "react";
import { aggregate } from "../aggregate";
import { formatNum } from "../format";

/**
 * Cohort P&L (financial matrix)
 *
 * A line-item × period table of aggregated amounts, accounting-formatted
 * (negatives in red parentheses) with a per-row Total column. Sticky header and
 * first column for scrolling large statements.
 *
 * Required columns:
 *   - dimension1: line item / account (row)
 *   - dimension2: period (column) — ordered
 *   - measure: amount (aggregated per row × period; may be +/-)
 */
export default function CohortPnL({ config, sigmaData, columns, setLoading, theme }) {
  const { rows, cols, matrix, rowTotals } = useMemo(() => {
    const rowCol = sigmaData[config.dimension1];
    const colCol = config.dimension2 ? sigmaData[config.dimension2] : null;
    const valCol = sigmaData[config.measure];
    if (!rowCol || !colCol || !valCol) return { rows: [], cols: [], matrix: {}, rowTotals: {} };
    const method = config.aggregation || "Sum";

    const m = {};
    const rowOrder = [];
    const colSet = new Set();
    for (let i = 0; i < rowCol.length; i++) {
      const v = Number(valCol[i]);
      if (!Number.isFinite(v)) continue;
      const r = String(rowCol[i] ?? "—");
      const c = String(colCol[i] ?? "");
      if (!m[r]) { m[r] = {}; rowOrder.push(r); }
      (m[r][c] ||= []).push(v);
      colSet.add(c);
    }
    const cols = [...colSet].sort((a, b) => {
      const na = Number(a), nb = Number(b);
      return Number.isFinite(na) && Number.isFinite(nb) ? na - nb : a.localeCompare(b);
    });

    const matrix = {};
    const rowTotals = {};
    for (const r of rowOrder) {
      matrix[r] = {};
      let t = 0, any = false;
      for (const c of cols) {
        if (m[r][c] != null) {
          const val = aggregate(m[r][c], method);
          matrix[r][c] = val;
          t += val;
          any = true;
        } else matrix[r][c] = null;
      }
      rowTotals[r] = any ? t : null;
    }
    return { rows: rowOrder, cols, matrix, rowTotals };
  }, [sigmaData, config.dimension1, config.dimension2, config.measure, config.aggregation]);

  useEffect(() => {
    if (rows.length) setLoading(false);
  }, [rows, setLoading]);

  if (!rows.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        Map a line-item (row), a period (column), and an amount.
      </div>
    );
  }

  const ink = theme?.text ?? "#1f2937";
  const muted = theme?.muted ?? "#777";
  const border = theme?.border ?? "#e5e7eb";
  const bg = theme?.background ?? "#ffffff";
  const headBg = theme?.isDark ? "#262b3a" : "#f8fafc";
  const zebra = theme?.isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.02)";
  const neg = "#dc2626";

  const fmt = (v) => (v == null ? "—" : v < 0 ? `(${formatNum(Math.abs(v))})` : formatNum(v));
  const valColor = (v) => (v == null ? muted : v < 0 ? neg : ink);

  const th = {
    position: "sticky", top: 0, background: headBg, color: muted, fontWeight: 600,
    fontSize: 12, padding: "8px 14px", textAlign: "right", whiteSpace: "nowrap",
    borderBottom: `2px solid ${border}`,
  };
  const tdBase = {
    padding: "7px 14px", textAlign: "right", fontSize: 13, whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums", borderBottom: `1px solid ${border}`,
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{ textAlign: "center", padding: "8px 0", fontSize: 16, fontWeight: 600, color: ink, flexShrink: 0 }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: bg }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", color: ink }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", left: 0, zIndex: 3 }}>
                {columns?.[config.dimension1]?.name || "Line item"}
              </th>
              {cols.map((c) => <th key={c} style={{ ...th, zIndex: 1 }}>{c}</th>)}
              <th style={{ ...th, color: ink, zIndex: 1, borderLeft: `2px solid ${border}` }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => {
              const rowBg = ri % 2 ? zebra : bg;
              return (
                <tr key={r}>
                  <td style={{
                    ...tdBase, textAlign: "left", fontWeight: 600, color: ink,
                    position: "sticky", left: 0, zIndex: 1, background: rowBg,
                  }}>
                    {r}
                  </td>
                  {cols.map((c) => {
                    const v = matrix[r][c];
                    return <td key={c} style={{ ...tdBase, color: valColor(v), background: rowBg }}>{fmt(v)}</td>;
                  })}
                  <td style={{
                    ...tdBase, fontWeight: 700, color: valColor(rowTotals[r]),
                    background: rowBg, borderLeft: `2px solid ${border}`,
                  }}>
                    {fmt(rowTotals[r])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
