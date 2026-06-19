// Central color system for every chart.
//
// One "Palette" control drives all 35 charts. Each named palette supplies:
//   cat   – categorical swatches (ordinal charts pass these straight to Nivo as
//           a string[] / inline categorical use)
//   seq   – [light, dark] endpoints for sequential ramps (Heatmap, Cohort heatmap)
//   ramp  – a 5-stop light→dark ramp (inline ramp charts: Calendar, Tree)
//   solid – a single representative color (single-color charts, accent fallback)
//
// "Custom" lets the author pick their own swatches (color1…color6); sequential /
// ramp variants are derived from the first swatch. A Reverse toggle flips order.

// ---- curated palettes (dominant hue + cohesive accents, accessible contrast) ----
export const PALETTES = {
  Sigma: {
    cat: ["#2E6BE6", "#11A7B4", "#7C5CFF", "#15A34A", "#F5A524", "#EF4444", "#DB2777", "#5B6B7E"],
    seq: ["#E3EDFD", "#1E40AF"],
    ramp: ["#E3EDFD", "#93B4F7", "#3B82F6", "#1D4ED8", "#172F8C"],
    solid: "#2E6BE6",
  },
  Aurora: {
    cat: ["#4F46E5", "#0891B2", "#06B6D4", "#10B981", "#8B5CF6", "#EC4899", "#3B82F6", "#14B8A6"],
    seq: ["#CFFAFE", "#0E7490"],
    ramp: ["#CFFAFE", "#67E8F9", "#22D3EE", "#0891B2", "#155E75"],
    solid: "#0891B2",
  },
  Ocean: {
    cat: ["#0EA5E9", "#06B6D4", "#0D9488", "#3B82F6", "#22D3EE", "#2DD4BF", "#0284C7", "#5EEAD4"],
    seq: ["#ECFEFF", "#155E75"],
    ramp: ["#ECFEFF", "#A5F3FC", "#22D3EE", "#0891B2", "#155E75"],
    solid: "#0EA5E9",
  },
  Meadow: {
    cat: ["#16A34A", "#65A30D", "#0D9488", "#CA8A04", "#4D7C0F", "#22C55E", "#84CC16", "#34D399"],
    seq: ["#F0FDF4", "#166534"],
    ramp: ["#F0FDF4", "#BBF7D0", "#4ADE80", "#16A34A", "#166534"],
    solid: "#16A34A",
  },
  Ember: {
    cat: ["#EA580C", "#F59E0B", "#DC2626", "#E11D48", "#D97706", "#F97316", "#FB923C", "#B45309"],
    seq: ["#FFF7ED", "#9A3412"],
    ramp: ["#FFF7ED", "#FED7AA", "#FB923C", "#EA580C", "#9A3412"],
    solid: "#EA580C",
  },
  Sunset: {
    cat: ["#F43F5E", "#FB7185", "#FB923C", "#FBBF24", "#F59E0B", "#E11D48", "#FDA4AF", "#FCD34D"],
    seq: ["#FFF1F2", "#9F1239"],
    ramp: ["#FFF1F2", "#FECDD3", "#FB7185", "#E11D48", "#9F1239"],
    solid: "#F43F5E",
  },
  Berry: {
    cat: ["#7C3AED", "#DB2777", "#BE123C", "#9333EA", "#C026D3", "#A21CAF", "#E11D48", "#F472B6"],
    seq: ["#FAF5FF", "#6B21A8"],
    ramp: ["#FAF5FF", "#E9D5FF", "#C084FC", "#9333EA", "#6B21A8"],
    solid: "#9333EA",
  },
  Slate: {
    cat: ["#334155", "#0EA5E9", "#64748B", "#0D9488", "#94A3B8", "#475569", "#38BDF8", "#0F766E"],
    seq: ["#F1F5F9", "#1E293B"],
    ramp: ["#F1F5F9", "#CBD5E1", "#94A3B8", "#475569", "#1E293B"],
    solid: "#334155",
  },
  Pastel: {
    cat: ["#60A5FA", "#FCA5A5", "#86EFAC", "#FCD34D", "#C4B5FD", "#F9A8D4", "#5EEAD4", "#FDBA74"],
    seq: ["#EFF6FF", "#2563EB"],
    ramp: ["#EFF6FF", "#BFDBFE", "#93C5FD", "#60A5FA", "#2563EB"],
    solid: "#60A5FA",
  },
  Viridis: {
    cat: ["#440154", "#414487", "#2A788E", "#22A884", "#7AD151", "#FDE725", "#31688E", "#35B779"],
    seq: ["#FDE725", "#440154"],
    ramp: ["#FDE725", "#5EC962", "#21918C", "#3B528B", "#440154"],
    solid: "#21918C",
  },
  Mono: {
    cat: ["#1E293B", "#0EA5E9", "#475569", "#64748B", "#94A3B8", "#334155", "#7DD3FC", "#CBD5E1"],
    seq: ["#F1F5F9", "#0F172A"],
    ramp: ["#F1F5F9", "#CBD5E1", "#94A3B8", "#475569", "#0F172A"],
    solid: "#334155",
  },
};

// Names shown in the editor-panel dropdown (Custom appended in App.jsx).
export const PALETTE_OPTIONS = Object.keys(PALETTES);

// Map the original 7 scheme names (saved in existing workbooks) to a palette.
const LEGACY = {
  blues: "Sigma", greens: "Meadow", reds: "Ember", oranges: "Ember",
  purples: "Berry", blue_green: "Aurora", yellow_green: "Meadow",
};

// ---- small color math (for Custom seq/ramp derivation) ----
function parseHex(h) {
  if (typeof h !== "string") return null;
  let s = h.trim().replace(/^#/, "");
  if (s.length === 3) s = [...s].map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
const toHex = (rgb) => "#" + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
function mix(hex, target, t) {
  const a = parseHex(hex), b = parseHex(target);
  if (!a) return hex;
  return toHex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t));
}
const lighten = (h, t) => mix(h, "#ffffff", t);
const darken = (h, t) => mix(h, "#000000", t);

function resolve(config) {
  const name = config?.colorScheme;
  if (name === "Custom") {
    const cat = [config.color1, config.color2, config.color3, config.color4, config.color5, config.color6]
      .map((c) => (parseHex(c) ? c : null))
      .filter(Boolean);
    const base = cat.length ? cat : PALETTES.Sigma.cat;
    const c0 = base[0];
    return {
      cat: base,
      seq: [lighten(c0, 0.86), darken(c0, 0.12)],
      ramp: [lighten(c0, 0.86), lighten(c0, 0.45), c0, darken(c0, 0.22), darken(c0, 0.45)],
      solid: c0,
    };
  }
  return PALETTES[name] || PALETTES[LEGACY[name]] || PALETTES.Sigma;
}

const rev = (arr, on) => (on ? [...arr].reverse() : arr);

/** Categorical colors as a plain array (Nivo ordinal `colors` accepts string[]). */
export function catColors(config) {
  return rev(resolve(config).cat, config?.reverseColors);
}
/** Nivo sequential config for heatmap-style charts (custom 2-color ramp). */
export function seqColors(config) {
  const [a, b] = rev(resolve(config).seq, config?.reverseColors);
  return { type: "sequential", colors: [a, b] };
}
/** A light→dark ramp array for inline ramp charts (Calendar, Tree). */
export function rampColors(config) {
  return rev(resolve(config).ramp, config?.reverseColors);
}
/** Single representative color (single-color charts, accent fallback). */
export function solidColor(config) {
  return resolve(config).solid;
}
/** [source, target, both] role colors for Network / ForceGraph. */
export function roleColors(config) {
  const c = catColors(config);
  return [c[0], c[1] || c[0], c[2] || c[0]];
}
