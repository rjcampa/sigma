# Sigma Custom Plugins

Custom visualization plugins for [Sigma Computing](https://sigmacomputing.com) workbooks.
Built with React + [Nivo](https://nivo.rocks/) charts, deployed to GitHub Pages.

## Included Visualizations

**35 chart types**, selectable from the **Chart Type** dropdown. Built on
[Nivo](https://nivo.rocks/), [Observable Plot](https://observablehq.com/plot/),
and [react-force-graph](https://github.com/vasturiano/react-force-graph) (all d3-based).

| Group | Charts |
|-------|--------|
| **Matrix / Grid** | Heatmap, Calendar |
| **Hierarchical** | Treemap, Sunburst, CirclePacking, Tree, Icicle |
| **Part-to-Whole** | Pie, Waffle, Funnel |
| **Flow / Relationship** | Sankey, Chord, Network, ForceGraph |
| **Ranking / Time-series** | Line, Bump, AreaBump, Stream |
| **Comparison** | Radar, RadialBar, Bullet, Marimekko, ParallelCoordinates |
| **Distribution** | Scatter, SwarmPlot, BoxPlot, Voronoi |
| **Statistical** | Histogram, Ridgeline, Hexbin |
| **KPI / Business** | KPI, Gauge, Waterfall, CohortRetention, CohortPnL |

Most charts map **dimension1 / dimension2 / measure**; some add a second numeric
measure (Voronoi, Hexbin, Scatter) for an X/Y pair.

**Author formatting** (in the plugin panel, for every chart): color **Palette**
(11 built-in + Custom swatches + Reverse), **Aggregation** (Sum/Avg/Count/Min/Max/
Median), **Number Format**, **Font**, **Text Size**, **Background**, **Accent**, and
**Appearance** (Auto/Light/Dark, Auto follows the workbook theme).

> **For contributors / AI tools:** see [CLAUDE.md](CLAUDE.md) for architecture,
> conventions, the chart-component contract, and Sigma plugin gotchas.

## Quick Start

**Live:**
- Plugin (use as the Production URL in Sigma) → `https://rjcampa.github.io/sigma/`
- Standalone preview, no Sigma needed → `https://rjcampa.github.io/sigma/?demo`

```bash
# 1. Clone and install
git clone https://github.com/rjcampa/sigma.git
cd sigma
npm install

# 2. Run locally (serves HTTPS at https://localhost:5173/sigma/)
npm run dev

# 3. Deploy (auto-deploys on push to main via GitHub Actions)
git push origin main
```

> **Tip:** to eyeball the charts without Sigma, open the `?demo` URL (live or
> `https://localhost:5173/sigma/?demo`). It renders every chart on mock data and
> has dropdowns for chart type, color scheme, and light/dark — pick a specific
> chart with `?demo&chart=Network`.

## Setup

### Register the Plugin in Sigma

1. In Sigma, go to **Administration** → **Account** → **Custom Plugins** → **Add**
2. **Name:** e.g. "Custom Viz"
3. **Production URL:** `https://rjcampa.github.io/sigma/`
4. **Development URL:** `https://localhost:5173/sigma/` (note **https** and the `/sigma/` path)
5. **Create Plugin**

### Use the Plugin in a Workbook

1. Open/create a workbook with a data table
2. **Edit** → **+ Add Element** → **UI** → **Plugins** → select your plugin
3. In the right panel: pick a **Data Source**, map **dimension1 / dimension2 / measure**
   (labels change per chart), and choose a **Chart Type**
4. Use the element's **••• → Point to Development URL** to test local changes live

> **GitHub Pages** is already configured (Settings → Pages → Source: GitHub Actions).
> Pushing to `main` builds and deploys automatically. The `base` in `vite.config.js`
> is `"/sigma/"` to match the repo name.

## Local Development

```bash
npm run dev   # https://localhost:5173/sigma/
```

The dev server runs over **HTTPS** (via `@vitejs/plugin-basic-ssl`) because Sigma
runs on HTTPS and browsers block an insecure (`http://`) plugin iframe inside it.
The cert is self-signed, so the first time, open `https://localhost:5173/sigma/`
directly and accept the browser warning, then point the plugin element at the
Development URL. If Safari keeps blocking the self-signed iframe, use Chrome or the
deployed Production URL.

## Adding More Chart Types

1. Create `src/plugins/MyNewChart.jsx` accepting `{ config, sigmaData, columns, setLoading, onSelect, theme }`
2. Register it in `src/charts.js` (`CHART_TYPES` + `CHART_COMPONENTS`)
3. Add panel labels in `src/App.jsx` (`DIM1_LABELS` / `DIM2_LABELS`, and `HIDE_DIM2` /
   `NEEDS_MEASURE2` if it omits a sub-category or needs an X/Y pair)
4. Add a mock mapping in `src/DevPreview.jsx` so it shows in `?demo`
5. Push to `main` — auto-deploys

## Tech Stack

- **Vite** + **React 18** — build & UI
- **@sigmacomputing/plugin** — Sigma data bridge (config, data, variables, actions, theme)
- **Nivo** (d3-based) — most chart rendering
- **Observable Plot** — statistical charts (histogram, ridgeline, hexbin)
- **GitHub Pages** — hosting (free, auto-deploy)
