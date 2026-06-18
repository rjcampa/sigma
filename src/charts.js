import { lazy } from "react";

// Chart registry. Components are LAZY-LOADED (code-split) so each chart — and
// the charting library it pulls in — only downloads when that chart is selected.
// This keeps the initial bundle small even as heavier libs (Observable Plot,
// react-force-graph) are added. Renderers must be wrapped in <Suspense>.
//
// No Sigma plugin imports here, so the standalone DevPreview can use this
// registry without evaluating @sigmacomputing/plugin (whose pre-initialized
// client throws when run outside a Sigma iframe).

export const CHART_TYPES = [
  // Matrix / Grid
  "Heatmap", "Calendar",
  // Hierarchical
  "Treemap", "Sunburst", "CirclePacking", "Tree", "Icicle",
  // Part-to-Whole
  "Pie", "Waffle", "Funnel",
  // Flow / Relationship
  "Sankey", "Chord", "Network", "ForceGraph",
  // Ranking / Time Series
  "Bump", "AreaBump", "Stream",
  // Comparison
  "Radar", "RadialBar", "Bullet", "Marimekko", "ParallelCoordinates",
  // Distribution
  "SwarmPlot", "BoxPlot", "Voronoi",
  // Statistical / Density (Observable Plot)
  "Histogram", "Ridgeline", "Hexbin",
  // KPI / Business
  "KPI", "Gauge", "Waterfall", "CohortRetention",
];

export const CHART_COMPONENTS = {
  Heatmap: lazy(() => import("./plugins/Heatmap")),
  Calendar: lazy(() => import("./plugins/Calendar")),
  Treemap: lazy(() => import("./plugins/Treemap")),
  Sunburst: lazy(() => import("./plugins/Sunburst")),
  CirclePacking: lazy(() => import("./plugins/CirclePacking")),
  Tree: lazy(() => import("./plugins/Tree")),
  Icicle: lazy(() => import("./plugins/Icicle")),
  Pie: lazy(() => import("./plugins/Pie")),
  Waffle: lazy(() => import("./plugins/Waffle")),
  Funnel: lazy(() => import("./plugins/Funnel")),
  Sankey: lazy(() => import("./plugins/Sankey")),
  Chord: lazy(() => import("./plugins/Chord")),
  Network: lazy(() => import("./plugins/Network")),
  ForceGraph: lazy(() => import("./plugins/ForceGraph")),
  Bump: lazy(() => import("./plugins/Bump")),
  AreaBump: lazy(() => import("./plugins/AreaBump")),
  Stream: lazy(() => import("./plugins/Stream")),
  Radar: lazy(() => import("./plugins/Radar")),
  RadialBar: lazy(() => import("./plugins/RadialBar")),
  Bullet: lazy(() => import("./plugins/Bullet")),
  Marimekko: lazy(() => import("./plugins/Marimekko")),
  ParallelCoordinates: lazy(() => import("./plugins/ParallelCoordinates")),
  SwarmPlot: lazy(() => import("./plugins/SwarmPlot")),
  BoxPlot: lazy(() => import("./plugins/BoxPlot")),
  Voronoi: lazy(() => import("./plugins/Voronoi")),
  Histogram: lazy(() => import("./plugins/Histogram")),
  Ridgeline: lazy(() => import("./plugins/Ridgeline")),
  Hexbin: lazy(() => import("./plugins/Hexbin")),
  KPI: lazy(() => import("./plugins/KPI")),
  Gauge: lazy(() => import("./plugins/Gauge")),
  Waterfall: lazy(() => import("./plugins/Waterfall")),
  CohortRetention: lazy(() => import("./plugins/CohortRetention")),
};
