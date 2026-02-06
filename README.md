# Sigma Custom Plugins

Custom visualization plugins for [Sigma Computing](https://sigmacomputing.com) workbooks.
Built with React + [Nivo](https://nivo.rocks/) charts, deployed to GitHub Pages.

## Included Visualizations

| Chart Type | Use Case |
|-----------|----------|
| **Heatmap** | Day × hour analysis, campaign × metric grids, correlation matrices |
| **Treemap** | Spend breakdowns, category hierarchies, portfolio composition |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install

# 2. Run locally
npm run dev
# → opens at http://localhost:5173

# 3. Deploy (auto-deploys on push to main via GitHub Actions)
git add . && git commit -m "initial" && git push origin main
```

## One-Time Setup

### A. Configure the base path

In `vite.config.js`, change the `base` value to match your repo name:

```js
base: "/your-repo-name/"
```

### B. Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the Action will build and deploy automatically

Your plugin will be live at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

### C. Register the Plugin in Sigma

1. In Sigma, go to **Administration** → **Account** → **Custom Plugins**
2. Click **Add**
3. Set **Name** to something like "Custom Viz"
4. Set **Production URL** to your GitHub Pages URL above
5. Set **Development URL** to `http://localhost:5173` (for local dev)
6. Click **Create Plugin**

### D. Use the Plugin in a Workbook

1. Open/create a workbook that has a data table
2. Click **Edit** → **+ Add New** → **Plugins**
3. Select your registered plugin
4. In the right panel:
   - Pick your **Data Source** (a table in the workbook)
   - Map **Category**, **Sub-category**, and **Value** columns
   - Choose a **Chart Type** from the dropdown
5. Your visualization renders live!

## Local Development

```bash
npm run dev
```

Then in Sigma, add the plugin using the Dev Playground (or your registered
plugin's development URL). Changes hot-reload in the workbook.

## Adding More Chart Types

1. Create a new component in `src/plugins/MyNewChart.jsx`
2. Add the chart name to `CHART_TYPES` array in `src/App.jsx`
3. Add a `case` in the switch statement to route to it
4. Push to `main` — auto-deploys

## Tech Stack

- **Vite** — build tool
- **React 18** — UI framework
- **@sigmacomputing/plugin** — Sigma data bridge
- **@nivo/heatmap** + **@nivo/treemap** — chart rendering
- **GitHub Pages** — hosting (free)
