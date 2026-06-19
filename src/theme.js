// Shared theming for the plugin shell and Nivo charts.
//
// Sigma's usePluginStyle() exposes only the workbook's plugin BACKGROUND color.
// We derive everything else (text, muted, borders, dark-mode) from its
// luminance, and expose a ready-to-spread Nivo `theme` so every chart can flip
// its axis/label/tooltip/text colors with a single `theme={theme.nivo}` prop.

// Shared UI font stack (Inter is bundled & self-hosted via @fontsource).
export const FONT =
  "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Selectable font families (the editor-panel "Font" control).
export const FONT_STACKS = {
  Inter: FONT,
  System: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  Serif: "Georgia, Cambria, 'Times New Roman', serif",
  Mono: "ui-monospace, 'SF Mono', 'Cascadia Mono', 'Roboto Mono', Menlo, Consolas, monospace",
};
export const FONT_OPTIONS = Object.keys(FONT_STACKS); // ["Inter","System","Serif","Mono"]

// Text-size control → multiplier applied to all chart/label/title type.
const SIZE_SCALE = { Small: 0.9, Medium: 1, Large: 1.18 };
export const SIZE_OPTIONS = Object.keys(SIZE_SCALE); // ["Small","Medium","Large"]

// Padding & border controls for the chart frame (keeps charts off the edge).
const PAD = { None: 0, Small: 10, Medium: 18, Large: 30 };
const BORDER_W = { None: 0, Subtle: 1, Bold: 2 };
export const PADDING_OPTIONS = Object.keys(PAD);   // ["None","Small","Medium","Large"]
export const BORDER_OPTIONS = Object.keys(BORDER_W); // ["None","Subtle","Bold"]

/** Inline style for the chart wrapper — padding + optional border/rounding. */
export function frameStyle(config, theme) {
  const pad = PAD[config?.padding] ?? PAD.Small;
  const bw = BORDER_W[config?.border] ?? 0;
  return {
    padding: pad,
    boxSizing: "border-box",
    ...(bw
      ? { border: `${bw}px solid ${theme?.border ?? "#e5e5e5"}`, borderRadius: 10 }
      : {}),
  };
}

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
 * @param {"Inter"|"System"|"Serif"|"Mono"} [opts.font]   font family choice
 * @param {"Small"|"Medium"|"Large"} [opts.size]    text-size choice
 * @param {string} [opts.background]                author background override (beats Auto)
 */
export function buildTheme({ appearance = "Auto", pluginBackground, accent, font, size, background } = {}) {
  // A background override drives light/dark text too, so text always contrasts.
  const hasOverride = !!parseColor(background);
  let dark;
  if (hasOverride) dark = isDarkColor(background);
  else if (appearance === "Dark") dark = true;
  else if (appearance === "Light") dark = false;
  else dark = isDarkColor(pluginBackground); // Auto: follow the workbook

  const base = dark ? DARK : LIGHT;

  // Background precedence: explicit author override → workbook (Auto) → theme default.
  const bg = hasOverride
    ? background
    : appearance === "Auto" && parseColor(pluginBackground)
      ? pluginBackground
      : base.background;

  const accentColor = accent || (dark ? "#5b8cff" : "#2f6feb");
  const fontFamily = FONT_STACKS[font] || FONT;
  const k = SIZE_SCALE[size] ?? 1;
  const fs = (n) => Math.round(n * k); // size-scaled font size

  return {
    isDark: dark,
    background: bg,
    text: base.text,
    muted: base.muted,
    border: base.border,
    panel: base.panel,
    accent: accentColor,
    font: fontFamily,
    titleSize: fs(16),
    // Spread into any Nivo Responsive* component via `theme={theme.nivo}`.
    // background mirrors the container so charts that use `{ theme: "background" }`
    // (e.g. punched-out points) still resolve to the right color.
    nivo: {
      background: bg,
      fontFamily,
      fontSize: fs(12),
      text: { fontFamily, fontSize: fs(12), fill: base.text },
      axis: {
        domain: { line: { stroke: base.border, strokeWidth: 1 } },
        ticks: {
          line: { stroke: base.border, strokeWidth: 1 },
          text: { fontFamily, fontSize: fs(11), fill: base.muted },
        },
        legend: { text: { fontFamily, fontSize: fs(12), fontWeight: 600, fill: base.text } },
      },
      grid: { line: { stroke: base.border, strokeWidth: 1, strokeDasharray: "2 4" } },
      legends: { text: { fontFamily, fontSize: fs(11), fill: base.muted } },
      labels: { text: { fontFamily, fontSize: fs(11), fontWeight: 600 } },
      tooltip: {
        container: {
          background: base.tooltipBg,
          color: base.text,
          fontFamily,
          fontSize: fs(12),
          borderRadius: 8,
          border: `1px solid ${base.border}`,
          boxShadow: dark
            ? "0 6px 20px rgba(0,0,0,0.5)"
            : "0 6px 20px rgba(15,23,42,0.14)",
          padding: "6px 10px",
        },
      },
    },
  };
}
