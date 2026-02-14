import {
  useEditorPanelConfig,
  useConfig,
  useElementData,
  useElementColumns,
  useLoadingState,
  useActionTrigger,
  useVariable,
} from "@sigmacomputing/plugin";
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

const CHART_TYPES = [
  // Matrix / Grid
  "Heatmap", "Calendar",
  // Hierarchical
  "Treemap", "Sunburst", "CirclePacking",
  // Part-to-Whole
  "Pie", "Waffle", "Funnel",
  // Flow / Relationship
  "Sankey", "Chord",
  // Ranking / Time Series
  "Bump", "Stream",
  // Comparison
  "Radar", "RadialBar", "Bullet", "Marimekko",
  // Distribution
  "SwarmPlot",
];

const CHART_COMPONENTS = {
  Heatmap, Treemap, Sunburst, Calendar, Funnel, Pie, Sankey, Chord,
  Bump, Radar, RadialBar, CirclePacking, Stream, Waffle, Bullet,
  Marimekko, SwarmPlot,
};

// Dynamic sidebar labels per chart type
const DIM1_LABELS = {
  Heatmap: "Category (rows)", Treemap: "Parent category", Sunburst: "Parent category",
  CirclePacking: "Parent category", Calendar: "Date column", Funnel: "Stage / Step",
  Pie: "Category / Slice", Sankey: "Source node", Chord: "Source",
  Bump: "Series / Entity", Radar: "Entity", RadialBar: "Category",
  Stream: "Time period", Waffle: "Category", Bullet: "Metric name",
  Marimekko: "Category", SwarmPlot: "Group",
};

const DIM2_LABELS = {
  Heatmap: "Sub-category (columns)", Treemap: "Sub-category (child)",
  Sunburst: "Sub-category (child)", CirclePacking: "Sub-category (child)",
  Sankey: "Target node", Chord: "Target", Bump: "Time period",
  Radar: "Metric", RadialBar: "Sub-category", Stream: "Category",
  Bullet: "Target value", Marimekko: "Sub-category",
};

// Charts that do NOT use dimension2 at all
const HIDE_DIM2 = new Set(["Calendar", "Funnel", "Pie", "Waffle", "SwarmPlot"]);

export default function App() {
  const [loading, setLoading] = useLoadingState(true);
  const config = useConfig();

  const chartType = config.chartType || "Heatmap";
  const showDim2 = !HIDE_DIM2.has(chartType);

  // --------------------------------------------------
  // Build config panel dynamically based on chart type
  // --------------------------------------------------
  const panelConfig = [
    { type: "dropdown", name: "chartType", label: "Chart Type",
      values: CHART_TYPES, defaultValue: "Heatmap" },

    { type: "element", name: "source", label: "Data Source" },

    // Primary dimension
    { type: "column", name: "dimension1",
      label: DIM1_LABELS[chartType] || "Dimension",
      source: "source", allowMultiple: false,
      ...(chartType === "Calendar" ? { allowedTypes: ["datetime"] } : {}) },

    // Secondary dimension (conditional)
    ...(showDim2
      ? [{ type: "column", name: "dimension2",
           label: DIM2_LABELS[chartType] || "Sub-category",
           source: "source", allowMultiple: false,
           ...(chartType === "Bullet"
             ? { allowedTypes: ["number", "integer"] }
             : {}) }]
      : []),

    // Measure
    { type: "column", name: "measure", label: "Value (numeric)",
      source: "source", allowMultiple: false,
      allowedTypes: ["number", "integer"] },

    // Display options
    { type: "text", name: "title", label: "Title", defaultValue: "" },
    { type: "dropdown", name: "colorScheme", label: "Color Scheme",
      values: ["blues", "greens", "reds", "oranges", "purples", "blue_green", "yellow_green"],
      defaultValue: "blues" },
    { type: "toggle", name: "showLabels", label: "Show Labels", defaultValue: true },

    // Actions — fire when a user clicks a chart element
    { type: "action-trigger", name: "onSelect", label: "On Element Click" },
    // Variable — passes the clicked value to a workbook control
    { type: "variable", name: "selectedValue", label: "Selected Value" },
  ];

  useEditorPanelConfig(panelConfig);

  // --------------------------------------------------
  // Data & actions
  // --------------------------------------------------
  const columns = useElementColumns(config.source);
  const sigmaData = useElementData(config.source);
  const triggerAction = useActionTrigger("onSelect");
  const [, setSelectedValue] = useVariable("selectedValue");

  /** Called by every chart component when the user clicks an element. */
  const onSelect = (value) => {
    try { if (typeof setSelectedValue === "function") setSelectedValue(String(value)); } catch (_) {}
    try { if (typeof triggerAction === "function") triggerAction(); } catch (_) {}
  };

  // --------------------------------------------------
  // Guards
  // --------------------------------------------------
  const isConfigured = config.source && config.dimension1 && config.measure;
  const hasData = sigmaData && Object.keys(sigmaData).length > 0;

  if (!isConfigured) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderIcon}>📊</div>
        <div style={styles.placeholderTitle}>Custom Visualization Plugin</div>
        <div style={styles.placeholderText}>
          Select a <strong>Data Source</strong>, then map your columns
          in the panel to the right.
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderText}>Waiting for data…</div>
      </div>
    );
  }

  // --------------------------------------------------
  // Route to chart component
  // --------------------------------------------------
  const ChartComponent = CHART_COMPONENTS[chartType] || Heatmap;
  const chartProps = { config, sigmaData, columns, setLoading, onSelect };

  return <ChartComponent {...chartProps} />;
}

const styles = {
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: 32,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#555",
    textAlign: "center",
    backgroundColor: "#fafafa",
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
    color: "#333",
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: 400,
    color: "#777",
  },
};
