// Shared aggregation used by the charts. Sigma does NOT expose a native
// per-column aggregation to plugins, so we collect the raw measure values per
// group and reduce them here, in the browser, per the author's choice. Default
// is "Sum" so behavior matches the original (sum-only) charts.

export const AGG_METHODS = ["Sum", "Average", "Count", "Min", "Max", "Median"];

/**
 * Reduce an array of numbers to a single value.
 * @param {number[]} values
 * @param {"Sum"|"Average"|"Count"|"Min"|"Max"|"Median"} method
 * @returns {number}
 */
export function aggregate(values, method = "Sum") {
  if (!values || values.length === 0) return 0;
  switch (method) {
    case "Count":
      return values.length;
    case "Average":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "Min":
      // reduce (not Math.min(...spread)) to stay safe on very large arrays
      return values.reduce((a, b) => (b < a ? b : a), values[0]);
    case "Max":
      return values.reduce((a, b) => (b > a ? b : a), values[0]);
    case "Median": {
      const s = [...values].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }
    case "Sum":
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}
