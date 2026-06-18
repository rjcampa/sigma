import { useEffect, useRef, useState, Suspense } from "react";
import {
  useEditorPanelConfig,
  useConfig,
  usePaginatedElementData,
  useElementColumns,
  useLoadingState,
  useActionTrigger,
  useVariable,
  usePluginStyle,
} from "@sigmacomputing/plugin";
import { buildTheme } from "./theme";
import { AGG_METHODS } from "./aggregate";
import { CHART_TYPES, CHART_COMPONENTS } from "./charts";

// Dynamic sidebar labels per chart type
const DIM1_LABELS = {
  Heatmap: "Category (rows)", Treemap: "Parent category", Sunburst: "Parent category",
  CirclePacking: "Parent category", Calendar: "Date column", Funnel: "Stage / Step",
  Pie: "Category / Slice", Sankey: "Source node", Chord: "Source",
  Bump: "Series / Entity", Radar: "Entity", RadialBar: "Category",
  Stream: "Time period", Waffle: "Category", Bullet: "Metric name",
  Marimekko: "Category", SwarmPlot: "Group",
  Tree: "Parent category", Icicle: "Parent category", Network: "Source node",
  ParallelCoordinates: "Series / Line (entity)", BoxPlot: "Group",
  Voronoi: "Point label", AreaBump: "Series / Entity",
  Histogram: "Group / Color (optional)", Ridgeline: "Group (ridge)",
  Hexbin: "Label (optional)", ForceGraph: "Source node",
  KPI: "Trend period (optional)", Gauge: "Label (optional)",
  Waterfall: "Step / Category", CohortRetention: "Cohort (row)",
  Line: "Series (line)", Scatter: "Group / Color (optional)",
};

const DIM2_LABELS = {
  Heatmap: "Sub-category (columns)", Treemap: "Sub-category (child)",
  Sunburst: "Sub-category (child)", CirclePacking: "Sub-category (child)",
  Sankey: "Target node", Chord: "Target", Bump: "Time period",
  Radar: "Metric", RadialBar: "Sub-category", Stream: "Category",
  Bullet: "Target value", Marimekko: "Sub-category",
  Tree: "Sub-category (child)", Icicle: "Sub-category (child)",
  Network: "Target node", ParallelCoordinates: "Axis / Variable",
  BoxPlot: "Sub-group (optional)", AreaBump: "Time period",
  ForceGraph: "Target node", Gauge: "Target (optional)",
  CohortRetention: "Period since start", Line: "X axis (ordered)",
};

// Primary-measure label overrides (defaults to "Value (numeric)")
const MEASURE_LABELS = {
  Voronoi: "Value X (numeric)", BoxPlot: "Value (observation)",
  Network: "Relationship weight", Histogram: "Value (to bin)",
  Ridgeline: "Value (distribution)", Hexbin: "Value X (numeric)",
  ForceGraph: "Relationship weight", KPI: "Metric value", Gauge: "Value",
  Waterfall: "Change (+/−)", CohortRetention: "Users / Count",
  Line: "Value (Y)", Scatter: "Value X (numeric)",
};

// Charts that do NOT use dimension2 at all
const HIDE_DIM2 = new Set([
  "Calendar", "Funnel", "Pie", "Waffle", "SwarmPlot", "Voronoi",
  "Histogram", "Ridgeline", "Hexbin", "KPI", "Waterfall", "Scatter",
]);

// Charts that need a SECOND numeric measure (an X/Y pair)
const NEEDS_MEASURE2 = new Set(["Voronoi", "Hexbin", "Scatter"]);

// Charts where dimension1 is OPTIONAL (don't block rendering on it)
const NO_DIM1 = new Set(["Histogram", "Hexbin", "KPI", "Gauge", "Scatter"]);

// Distribution/raw charts that plot EVERY row — aggregation doesn't apply,
// so hide the Aggregation control for them.
const HIDE_AGG = new Set([
  "SwarmPlot", "BoxPlot", "Voronoi", "Histogram", "Ridgeline", "Hexbin", "Scatter",
]);

// Charts that expose a "Cumulative" toggle (running-sum the series).
const CUMULATIVE_CHARTS = new Set(["Line"]);

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
           ...(["Bullet", "Gauge"].includes(chartType)
             ? { allowedTypes: ["number", "integer"] }
             : {}) }]
      : []),

    // Measure
    { type: "column", name: "measure",
      label: MEASURE_LABELS[chartType] || "Value (numeric)",
      source: "source", allowMultiple: false,
      allowedTypes: ["number", "integer"] },

    // Second measure (only for charts that plot an X/Y pair, e.g. Voronoi)
    ...(NEEDS_MEASURE2.has(chartType)
      ? [{ type: "column", name: "measure2", label: "Value Y (numeric)",
           source: "source", allowMultiple: false,
           allowedTypes: ["number", "integer"] }]
      : []),

    // Aggregation — how to combine measure values within each group
    ...(!HIDE_AGG.has(chartType)
      ? [{ type: "dropdown", name: "aggregation", label: "Aggregation",
           values: AGG_METHODS, defaultValue: "Sum" }]
      : []),

    // Cumulative running-sum (LTV / saturation curves)
    ...(CUMULATIVE_CHARTS.has(chartType)
      ? [{ type: "toggle", name: "cumulative", label: "Cumulative (LTV / saturation)", defaultValue: false }]
      : []),

    // Display options
    { type: "text", name: "title", label: "Title", defaultValue: "" },
    { type: "dropdown", name: "colorScheme", label: "Color Scheme",
      values: ["blues", "greens", "reds", "oranges", "purples", "blue_green", "yellow_green"],
      defaultValue: "blues" },
    { type: "toggle", name: "showLabels", label: "Show Labels", defaultValue: true },

    // Appearance — Auto follows the workbook theme (via usePluginStyle)
    { type: "radio", name: "appearance", label: "Appearance",
      values: ["Auto", "Light", "Dark"], defaultValue: "Auto", singleLine: true },
    // Native Sigma color picker — themes the selection chip & chart accents
    { type: "color", name: "accentColor", label: "Accent Color" },

    // Actions — fire when a user clicks a chart element
    { type: "action-trigger", name: "onSelect", label: "On Element Click" },
    // Variable — passes the clicked value to a workbook control
    { type: "variable", name: "selectedValue", label: "Selected Value" },
  ];

  useEditorPanelConfig(panelConfig);

  // --------------------------------------------------
  // Data & actions
  // --------------------------------------------------
  // Workbook theme background (Auto appearance follows this) → derived theme.
  const pluginStyle = usePluginStyle();
  const theme = buildTheme({
    appearance: config.appearance,
    pluginBackground: pluginStyle?.backgroundColor,
    accent: config.accentColor,
  });

  const columns = useElementColumns(config.source);
  // Paginated feed: useElementData caps at 25,000 VALUES (cells, not rows).
  // usePaginatedElementData returns [data, fetchMore]; fetchMore() appends the
  // next 25k-value page. We auto-fetch below until the source is fully loaded
  // (or a safety ceiling is hit) so dense charts stop truncating.
  const [sigmaData, fetchMore] = usePaginatedElementData(config.source);
  const triggerAction = useActionTrigger("onSelect");
  // Two-way variable binding: the value lives at defaultValue.value (NOT .value).
  // selectedVar is undefined until the author binds a workbook control to the
  // "Selected Value" field — writing to it when unbound makes Sigma report
  // "control variable selectedValue not found", so we guard on it below.
  const [selectedVar, setSelectedValue] = useVariable("selectedValue");
  const variableBound = !!selectedVar;
  const boundValue = selectedVar?.defaultValue?.value;
  // Local fallback so the selection chip / highlighting work even when no
  // control is bound (e.g. while testing). A bound control takes precedence.
  const [localSelection, setLocalSelection] = useState(null);
  const selectedValue =
    boundValue != null && String(boundValue).length > 0 ? boundValue : localSelection;

  // ---- Auto-paginate past the 25k-value cap --------------------------------
  // There is no total-count signal, so we keep fetching while the row count
  // grows and stop once it plateaus (or MAX_PAGES is reached).
  const loadedRowsRef = useRef(0);
  const pagesRef = useRef(0);
  const MAX_PAGES = 12; // 12 × 25k = 300k values ceiling — tune as needed

  useEffect(() => {
    // reset bookkeeping whenever the bound source changes
    loadedRowsRef.current = 0;
    pagesRef.current = 0;
  }, [config.source]);

  useEffect(() => {
    if (!config.source || typeof fetchMore !== "function" || !sigmaData) return;
    const keys = Object.keys(sigmaData);
    if (!keys.length) return;
    const loaded = sigmaData[keys[0]]?.length ?? 0;
    if (loaded > loadedRowsRef.current && pagesRef.current < MAX_PAGES) {
      loadedRowsRef.current = loaded;
      pagesRef.current += 1;
      fetchMore();
    }
  }, [sigmaData, config.source, fetchMore]);

  /** Called by every chart component when the user clicks an element. */
  const onSelect = (value) => {
    setLocalSelection(value == null ? null : String(value));
    // Only push to the workbook control if one is actually bound.
    try { if (variableBound && typeof setSelectedValue === "function") setSelectedValue(String(value)); } catch (_) {}
    try { if (typeof triggerAction === "function") triggerAction(); } catch (_) {}
  };

  /** Clear the current selection (and any control bound to it). */
  const clearSelection = () => {
    setLocalSelection(null);
    try { if (variableBound && typeof setSelectedValue === "function") setSelectedValue(""); } catch (_) {}
    try { if (typeof triggerAction === "function") triggerAction(); } catch (_) {}
  };

  // --------------------------------------------------
  // Guards
  // --------------------------------------------------
  const isConfigured =
    config.source && config.measure &&
    (NO_DIM1.has(chartType) || config.dimension1);
  const hasData = sigmaData && Object.keys(sigmaData).length > 0;

  if (!isConfigured) {
    return (
      <div style={{ ...styles.placeholder, backgroundColor: theme.background }}>
        <div style={styles.placeholderIcon}>📊</div>
        <div style={{ ...styles.placeholderTitle, color: theme.text }}>Custom Visualization Plugin</div>
        <div style={{ ...styles.placeholderText, color: theme.muted }}>
          Select a <strong>Data Source</strong>, then map your columns
          in the panel to the right.
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={{ ...styles.placeholder, backgroundColor: theme.background }}>
        <div style={{ ...styles.placeholderText, color: theme.muted }}>Waiting for data…</div>
      </div>
    );
  }

  // --------------------------------------------------
  // Route to chart component
  // --------------------------------------------------
  const ChartComponent = CHART_COMPONENTS[chartType] || CHART_COMPONENTS.Heatmap;
  const chartProps = { config, sigmaData, columns, setLoading, onSelect, selectedValue, theme };

  // A non-empty selectedValue means either a chart element was clicked or a
  // workbook control bound to "Selected Value" is set. Surface it universally.
  const hasSelection = selectedValue != null && String(selectedValue).length > 0;

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      backgroundColor: theme.background,
    }}>
      {hasSelection && (
        <div style={{
          ...styles.selectionBar,
          background: theme.panel,
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <span style={{ ...styles.selectionLabel, color: theme.accent }}>Selected</span>
          <span style={{ ...styles.selectionValue, color: theme.text }} title={String(selectedValue)}>
            {String(selectedValue)}
          </span>
          <button
            style={{ ...styles.selectionClear, color: theme.accent }}
            onClick={clearSelection}
            title="Clear selection"
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Suspense fallback={
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", fontFamily: "'Inter Variable', system-ui, sans-serif", fontSize: 13,
            color: theme.muted, background: theme.background,
          }}>
            Loading chart…
          </div>
        }>
          <ChartComponent {...chartProps} />
        </Suspense>
      </div>
    </div>
  );
}

const styles = {
  selectionBar: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    fontFamily: "'Inter Variable', system-ui, -apple-system, sans-serif",
    fontSize: 12,
    background: "#eef4fb",
    borderBottom: "1px solid #d6e3f3",
  },
  selectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: 600,
    color: "#5a7fb0",
    fontSize: 10,
  },
  selectionValue: {
    fontWeight: 600,
    color: "#1f3c5f",
    maxWidth: "70%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  selectionClear: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#5a7fb0",
    cursor: "pointer",
    fontSize: 13,
    lineHeight: 1,
    padding: 2,
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: 32,
    fontFamily: "'Inter Variable', system-ui, -apple-system, sans-serif",
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
