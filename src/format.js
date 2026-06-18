// Compact number formatting for KPI/Gauge/Waterfall labels.
export function formatNum(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(abs >= 1e4 ? 0 : 1) + "K";
  if (Number.isInteger(n)) return n.toLocaleString();
  return (Math.round(n * 100) / 100).toLocaleString();
}
