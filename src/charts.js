// Chart registry — imports ONLY the Nivo-based chart components (no Sigma
// plugin package). This lets the standalone DevPreview render charts without
// pulling in @sigmacomputing/plugin, whose pre-initialized client throws
// ("Unexpected end of JSON input") when evaluated outside a Sigma iframe.
import Heatmap from "./plugins/Heatmap";
import Treemap from "./plugins/Treemap";
import Sunburst from "./plugins/Sunburst";
import Calendar from "./plugins/Calendar";
import Funnel from "./plugins/Funnel";
import Pie from "./plugins/Pie";
import Sankey from "./plugins/Sankey";
import Chord from "./plugins/Chord";
import Bump from "./plugins/Bump";
import Radar from "./plugins/Radar";
import RadialBar from "./plugins/RadialBar";
import CirclePacking from "./plugins/CirclePacking";
import Stream from "./plugins/Stream";
import Waffle from "./plugins/Waffle";
import Bullet from "./plugins/Bullet";
import Marimekko from "./plugins/Marimekko";
import SwarmPlot from "./plugins/SwarmPlot";
import Tree from "./plugins/Tree";
import Icicle from "./plugins/Icicle";
import Network from "./plugins/Network";
import ParallelCoordinates from "./plugins/ParallelCoordinates";
import BoxPlot from "./plugins/BoxPlot";
import Voronoi from "./plugins/Voronoi";
import AreaBump from "./plugins/AreaBump";

export const CHART_TYPES = [
  // Matrix / Grid
  "Heatmap", "Calendar",
  // Hierarchical
  "Treemap", "Sunburst", "CirclePacking", "Tree", "Icicle",
  // Part-to-Whole
  "Pie", "Waffle", "Funnel",
  // Flow / Relationship
  "Sankey", "Chord", "Network",
  // Ranking / Time Series
  "Bump", "AreaBump", "Stream",
  // Comparison
  "Radar", "RadialBar", "Bullet", "Marimekko", "ParallelCoordinates",
  // Distribution
  "SwarmPlot", "BoxPlot", "Voronoi",
];

export const CHART_COMPONENTS = {
  Heatmap, Treemap, Sunburst, Calendar, Funnel, Pie, Sankey, Chord,
  Bump, Radar, RadialBar, CirclePacking, Stream, Waffle, Bullet,
  Marimekko, SwarmPlot, Tree, Icicle, Network, ParallelCoordinates,
  BoxPlot, Voronoi, AreaBump,
};
