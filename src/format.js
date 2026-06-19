// Number formatting for KPI/Gauge/Waterfall/Cohort P&L value labels.
// mode is the editor-panel "Number format" choice.

function compact(n) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(abs >= 1e4 ? 0 : 1) + "K";
  return Number.isInteger(n) ? n.toLocaleString() : (Math.round(n * 100) / 100).toLocaleString();
}

/** A value formatter bound to a chart's config — pass to Nivo `valueFormat`. */
export const makeFormatter = (config) => (v) => formatNum(v, config?.numberFormat);

/**
 * @param {number} n
 * @param {"Auto"|"Full"|"Currency"|"Percent"} [mode]
 */
export function formatNum(n, mode = "Auto") {
  if (n == null || !Number.isFinite(n)) return "—";
  switch (mode) {
    case "Full":
      return (Math.round(n * 100) / 100).toLocaleString();
    case "Currency":
      return (n < 0 ? "-$" : "$") + compact(Math.abs(n));
    case "Percent":
      return compact(n) + "%";
    case "Auto":
    default:
      return compact(n);
  }
}
