# CLAUDE.md — AI jumpstart for the Sigma Custom Plugins repo

This repo is **ONE Sigma Computing custom plugin** (a Vite + React 18 SPA) that
hosts **35 chart types** behind a chart-type dropdown, deployed to GitHub Pages.
Read this first to orient quickly. Companion details live in the session memory
files; this file is the authoritative architecture + conventions doc.

- **Prod URL (plugin Production URL):** `https://rjcampa.github.io/sigma/`
- **Standalone preview (no Sigma):** `https://rjcampa.github.io/sigma/?demo`
- **Local dev:** `npm run dev` → `https://localhost:5173/sigma/` (HTTPS, self-signed)

---

## 1. What it is

A single Sigma plugin that switches its renderer based on a `chartType` config
value. Not 35 plugins — one plugin, 35 chart components. Charting libs:
- **Nivo 0.99** — most charts (d3-based)
- **Observable Plot** — Histogram, Ridgeline, Hexbin (statistical)
- **react-force-graph-2d** — ForceGraph (animated-particle network, canvas)
- **Inter** — bundled UI font (`@fontsource-variable/inter`)

Every chart is: themeable (light/dark + font/size/background), **author-formattable**
(color palettes, number format), **aggregation-aware**, code-split (lazy), with
click→cross-filter selection and pagination past Sigma's row cap.

---

## 2. Architecture / key files

| File | Role |
|---|---|
| `index.html` | Root; sets the global Inter font + antialiasing on `#root` |
| `vite.config.js` | `base: "/sigma/"`, React plugin, **basicSsl** (HTTPS dev server) |
| `src/main.jsx` | Entry. `?demo` → `DevPreview`; else **dynamically** imports `@sigmacomputing/plugin` + `App`. Imports the Inter font. |
| `src/App.jsx` | The Sigma-connected shell: builds the editor panel dynamically per chart, reads data/config, derives `theme`, routes to the lazy chart, renders the selection chip. Holds the per-chart **label maps + sets** (see §4). |
| `src/charts.js` | **Plugin-free** registry: `CHART_TYPES` (ordered) + `CHART_COMPONENTS` (`React.lazy` map). Imported by both App and DevPreview. |
| `src/theme.js` | `buildTheme({appearance, pluginBackground, accent, font, size, background})` → theme object (incl. ready-to-spread `theme.nivo`). `FONT_STACKS`, `FONT_OPTIONS`, `SIZE_OPTIONS`. Derives light/dark from luminance. |
| `src/palette.js` | The color system: 11 named `PALETTES` + Custom + Reverse + legacy mapping. Resolvers: `catColors / seqColors / rampColors / solidColor / roleColors`. |
| `src/aggregate.js` | `aggregate(values, method)`, `AGG_METHODS` (Sum/Average/Count/Min/Max/Median). |
| `src/format.js` | `formatNum(n, mode)`, `makeFormatter(config)` (bind to Nivo `valueFormat`). |
| `src/DevPreview.jsx` | Standalone `?demo` harness: mock data + toolbar + URL deep-links. |
| `src/plugins/*.jsx` | The 35 chart components, plus `PlotFigure.jsx` (Observable Plot→React wrapper) and `useContainerSize.js` (measure hook for hand-rolled SVG charts). |

---

## 3. The chart component contract

Every `src/plugins/X.jsx` is `export default function X({ config, sigmaData, columns, setLoading, onSelect, selectedValue, theme })`:

- **`sigmaData`** is **column-oriented**: `{ [columnId]: [...values] }` (parallel
  arrays, NOT row objects). Index `sigmaData[config.dimension1]` etc. Reshape in a
  `useMemo`.
- Call **`setLoading(false)`** once data is ready.
- Call **`onSelect(value)`** on element click (drives the workbook variable + action).
- **Nivo charts:** spread `theme={theme?.nivo}` (fonts/axes/legend/tooltip/dark-mode).
- **Colors:** never hardcode — use the `palette.js` resolvers keyed on `config`:
  - ordinal/categorical → `colors={catColors(config)}` (plain `string[]`)
  - sequential (heatmaps) → `colors={seqColors(config)}` (`{type:'sequential',colors:[a,b]}`)
  - inline ramps (Calendar/Tree/Bullet) → `rampColors(config)`
  - single color (Voronoi, business accent fallback) → `solidColor(config)`
  - role colors (Network/ForceGraph) → `roleColors(config)` → `[src,tgt,both]`
  - Observable Plot → `color: { range: catColors(config) }` (or `rampColors`)
- **Numbers:** `const fmtVal = makeFormatter(config)` → Nivo `valueFormat={fmtVal}`;
  wrap raw tooltip values with `fmtVal(...)`. Leave `formattedValue` (auto-routed),
  percentages, ranks, counts, and category labels alone.
- **Aggregation:** collect raw measure **arrays per group**, then
  `aggregate(values, config.aggregation || "Sum")`. Default "Sum" preserves output.
- **Title block** uses `fontFamily: theme?.font` and `fontSize: theme?.titleSize`.

Custom (non-Nivo) charts (KPI/Gauge/Waterfall/CohortPnL, ForceGraph) hand-roll
SVG/canvas/HTML and use `useContainerSize()` for responsive sizing.

---

## 4. App.jsx panel + the categorization sets

The panel is rebuilt every render from `config.chartType`. **Config keys** (=
panel control names): `chartType, source, dimension1, dimension2, measure,
measure2, title, colorScheme` (holds the **palette name**), `reverseColors,
color1..color6` (Custom swatches), `showLabels, appearance, accentColor, font,
textSize, padding, border, background, numberFormat, aggregation, cumulative`,
plus `onSelect` (action-trigger) and `selectedValue` (variable).

**Chart Type dropdown carries an emoji glyph** (Sigma panel dropdowns are plain
`string[]` — no SVG icons possible). `charts.js` exports `CHART_ICONS`,
`CHART_TYPE_LABELS` (iconed, used as the dropdown `values`), and `cleanChartType()`
which strips the glyph back to the clean name for routing. `App.jsx` does
`const chartType = cleanChartType(config.chartType)` — always route on the clean
name. Padding/Border apply via `frameStyle(config, theme)` on the chart wrapper
(in both App.jsx and DevPreview).

Per-chart behavior is driven by **Sets in App.jsx** — add a new chart's name here:
- `DIM1_LABELS / DIM2_LABELS / MEASURE_LABELS` — panel field labels per chart
- `HIDE_DIM2` — charts that don't use dimension2
- `NEEDS_MEASURE2` — charts needing an X/Y pair (Voronoi, Hexbin, Scatter)
- `NO_DIM1` — charts where dimension1 is optional (Histogram, Hexbin, KPI, Gauge, Scatter)
- `HIDE_AGG` — raw/distribution charts (hide Aggregation control)
- `CUMULATIVE_CHARTS` — charts with the Cumulative toggle (Line)

---

## 5. How to add a chart

1. Create `src/plugins/MyChart.jsx` following the §3 contract.
2. Register in `src/charts.js`: add to `CHART_TYPES` (in a group) + `CHART_COMPONENTS`
   (`MyChart: lazy(() => import("./plugins/MyChart"))`).
3. In `src/App.jsx`: add `DIM1_LABELS` / `DIM2_LABELS` / `MEASURE_LABELS`, and add to
   `HIDE_DIM2` / `NEEDS_MEASURE2` / `NO_DIM1` / `HIDE_AGG` / `CUMULATIVE_CHARTS` as needed.
4. In `src/DevPreview.jsx`: add a `demoConfigFor` case (column mapping for mock data;
   add mock columns if it needs a new shape).
5. Build + verify (§7) + push to `main` (auto-deploys).

The 35 charts today, by group: **Matrix** (Heatmap, Calendar) · **Hierarchical**
(Treemap, Sunburst, CirclePacking, Tree, Icicle) · **Part-to-Whole** (Pie, Waffle,
Funnel) · **Flow** (Sankey, Chord, Network, ForceGraph) · **Ranking/Time** (Line,
Bump, AreaBump, Stream) · **Comparison** (Radar, RadialBar, Bullet, Marimekko,
ParallelCoordinates) · **Distribution** (Scatter, SwarmPlot, BoxPlot, Voronoi) ·
**Statistical** (Histogram, Ridgeline, Hexbin) · **KPI/Business** (KPI, Gauge,
Waterfall, CohortRetention, CohortPnL).

---

## 6. Sigma plugin gotchas (CRITICAL — most cost real debugging time)

1. **`@sigmacomputing/plugin` is pinned to `1.0.10`** (commit history: 1.1.0's build
   was broken). 1.2.0 is latest and adds `useUrlParameter`/`useActionEffect` parity
   but is an **untested upgrade** — test the build if you bump it.
2. **The exported `client` singleton parses Sigma's init payload AT IMPORT TIME** →
   throws `Unexpected end of JSON input` and blanks the page when imported **outside a
   Sigma iframe** (e.g. headless). This is why `charts.js` is **plugin-free** and
   `main.jsx` **dynamically** imports the plugin package only in the non-demo branch.
   Never let the `?demo` path import `@sigmacomputing/plugin`.
3. **`useElementData` caps at 25,000 VALUES (cells, not rows).** App uses
   `usePaginatedElementData` + an auto-fetch loop (`MAX_PAGES=12`) that calls
   `fetchMore()` until the row count plateaus (no total-count signal exists).
4. **`useVariable` value is at `.defaultValue.value`** (NOT `.value`). Only write to it
   when a control is **bound** (`!!selectedVar`), else Sigma reports "control variable
   not found". Setter is **variadic** for list/range control types.
5. **`usePluginStyle()` exposes ONLY `backgroundColor`** — NOT the workbook theme font
   or palette. So we can't auto-match the workbook font; we offer our own Font control.
6. **Panel control types:** `dropdown, text, toggle, checkbox, radio, color, column,
   element, group, action-trigger, action-effect, variable` (+ `url-parameter` in ≥1.1.0).
   **NO `slider`, NO `number` type** → use S/M/L dropdowns or text+`parseFloat`. `group`
   can only contain `text`. `color` has no `defaultValue` (seed a fallback in code).
   `number` and `integer` are SEPARATE `allowedTypes`; dates are `datetime` (no `date`).
   Conditional fields = compute the panel array (`...(cond ? [field] : [])`); keep
   field `name`s stable across chart types or saved mappings drop.
7. **Sigma's native element Format already styles the plugin container** (background,
   border, padding, corner shape) — no code needed. Our in-plugin Background control is
   an additional override that also drives light/dark text contrast.
8. **Aggregation is NOT exposed to plugins** (column config has no aggregate option) —
   it's done in the browser in `aggregate.js`. For huge data, point the plugin at a
   pre-grouped Sigma table instead.
9. Do NOT invent SDK names: `useTableData`, `useElementCellData`, `useThemeColor`,
   `getOverrides`, a synchronous `getElementData` — none exist.

---

## 7. Dev / test / deploy

**Local dev (HTTPS):** `npm run dev` → `https://localhost:5173/sigma/`. The dev server
is HTTPS (`@vitejs/plugin-basic-ssl`) because Sigma is HTTPS and browsers block an
`http://` plugin iframe (mixed content). Self-signed → open the URL once and accept the
cert; Safari often won't carry the exception into the iframe, so **use Chrome** or the
deployed Production URL.

**`?demo` standalone preview** (no Sigma host; mock data). Deep-link params for testing:
`?demo&chart=Pie&palette=Aurora&agg=Average&font=Serif&size=Large&bg=%230f172a&nfmt=Currency&accent=%23e11d48&reverse=1&cumulative=1&colors=ff0000,00aa55&title=Hello`

**Deploy:** push to `main` → GitHub Actions builds + deploys to GitHub Pages. Prod URL
above. The Pages workflow uses Node-24 actions. **Gotcha:** the "Setup Node" step
occasionally **hangs ~6 min** (transient runner issue) — cancel and re-dispatch:
`gh run cancel <id>` then `gh workflow run "Deploy to GitHub Pages" --ref main`. A
hung/failed deploy does NOT affect the live site (previous deploy persists).

**Verification (how this project was built — do this):**
- Headless Chrome screenshot, then **Read the PNG** to visually verify look/correctness:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-sandbox --ignore-certificate-errors --window-size=1000,640 --hide-scrollbars --virtual-time-budget=6500 --screenshot=/tmp/x.png "https://localhost:5173/sigma/?demo&chart=Pie"`
- For pass/fail smoke: `--dump-dom` + grep for `<svg>` / `<canvas>` / `<table>` and
  `INFO:CONSOLE` errors.
- Montage many small screenshots into one grid via a local HTML file + Chrome (no
  ImageMagick installed) to review efficiently.
- **Flakiness:** the dev server buckles under rapid concurrent headless launches — pace
  with `sleep`, raise `--virtual-time-budget`, or verify against the **prod static
  build** (more reliable). Observable Plot / canvas charts need the container measured,
  so give them more time.
- **grep gotcha:** if grep silently finds nothing in a file you KNOW contains the
  string, the file may have a stray non-text byte (a NUL byte once did this) — use
  `grep -a` (force text) and clean the byte.

---

## 8. Feature set already shipped

- **35 chart types** (see §5).
- **Aggregation** (Sum/Avg/Count/Min/Max/Median), per group, measure-only.
- **Color palettes**: 11 curated (Sigma/Aurora/Ocean/Meadow/Ember/Sunset/Berry/Slate/
  Pastel/Viridis/Mono) + **Custom** (6 swatches) + **Reverse**.
- **Number Format** (Auto/Full/Currency/Percent) on value labels + tooltips.
- **Typography**: Font (Inter/System/Serif/Mono), Text Size (S/M/L).
- **Background** override (drives light/dark text contrast).
- **Padding** (None/Small/Medium/Large) + **Border** (None/Subtle/Bold) on the chart frame.
- **Chart Type dropdown** shows an emoji glyph per chart; ordered by type.
- **Accent/brand color** (business charts + selection chip).
- **Appearance** Auto/Light/Dark (Auto follows the workbook via `usePluginStyle`).
- **Selection**: click → sets the `selectedValue` variable + fires the `onSelect` action;
  universal "Selected" chip in App.jsx (works standalone via a local fallback).
- **Pagination** past the 25k-value cap; **code-splitting** (each chart + its lib lazy).

## 9. Open follow-ups (all optional)

- **visx tier** — only if a bespoke shape is needed that Nivo/Plot can't render.
- **Calendar date parsing** — `Calendar.jsx` parses date-only values in local time, so a
  `2024-01-01` can shift to `2023-12-31` in negative-UTC zones (adds an empty year row).
  Fix = parse Y-M-D directly for date-only strings.
- Optionally hide the Number Format / Aggregation controls on the few charts where they
  have no effect (currently shown broadly for simplicity).
