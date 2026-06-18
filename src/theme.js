// Shared theming for the plugin shell and Nivo charts.
//
// Sigma's usePluginStyle() exposes only the workbook's plugin BACKGROUND color.
// We derive everything else (text, muted, borders, dark-mode) from its
// luminance, and expose a ready-to-spread Nivo `theme` so every chart can flip
// its axis/label/tooltip/text colors with a single `theme={theme.nivo}` prop.

const LIGHT = {
  background: "#ffffff",
  text: "#333333",
  muted: "#777777",
  border: "#e5e5e5",
  panel: "#eef4fb",
  tooltipBg: "#ffffff",
};

const DARK = {
  background: "#1f2330",
  text: "#e8eaf0",
  muted: "#9aa0b0",
  border: "#3a4156",
  panel: "#2a3042",
  tooltipBg: "#2b3142",
};

/** Parse a CSS color (#rgb, #rrggbb, or rgb/rgba(...)) to [r,g,b], else null. */
function parseColor(c) {
  if (!c || typeof c !== "string") return null;
  const s = c.trim().toLowerCase();
  if (s === "transparent" || s === "none" || s === "inherit") return null;

  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return [...m[1]].map((x) => parseInt(x + x, 16));

  m = s.match(/^#([0-9a-f]{6})$/);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));

  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p));
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]];
    }
  }
  return null;
}

/** Relative luminance 0..1. Defaults bright (treated as light) when unknown. */
function luminance(rgb) {
  if (!rgb) return 1;
  const [r, g, b] = rgb;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function isDarkColor(c) {
  return luminance(parseColor(c)) < 0.5;
}

/**
 * Build the plugin theme.
 * @param {Object} opts
 * @param {"Auto"|"Light"|"Dark"} opts.appearance  author override (Auto follows workbook)
 * @param {string} [opts.pluginBackground]          backgroundColor from usePluginStyle()
 * @param {string} [opts.accent]                    author-picked accent color
 */
export function buildTheme({ appearance = "Auto", pluginBackground, accent } = {}) {
  let dark;
  if (appearance === "Dark") dark = true;
  else if (appearance === "Light") dark = false;
  else dark = isDarkColor(pluginBackground); // Auto: follow the workbook

  const base = dark ? DARK : LIGHT;

  // In Auto mode, honor the workbook's exact background if we could parse it.
  const background =
    appearance === "Auto" && parseColor(pluginBackground)
      ? pluginBackground
      : base.background;

  const accentColor = accent || (dark ? "#5b8cff" : "#2f6feb");

  return {
    isDark: dark,
    background,
    text: base.text,
    muted: base.muted,
    border: base.border,
    panel: base.panel,
    accent: accentColor,
    // Spread into any Nivo Responsive* component via `theme={theme.nivo}`.
    // background mirrors the container so charts that use `{ theme: "background" }`
    // (e.g. punched-out points) still resolve to the right color.
    nivo: {
      background,
      text: { fill: base.text },
      axis: {
        domain: { line: { stroke: base.border } },
        ticks: { line: { stroke: base.border }, text: { fill: base.muted } },
        legend: { text: { fill: base.text } },
      },
      grid: { line: { stroke: base.border } },
      legends: { text: { fill: base.text } },
      labels: { text: { fill: base.text } },
      tooltip: { container: { background: base.tooltipBg, color: base.text } },
    },
  };
}
