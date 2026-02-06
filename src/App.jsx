import {
  useEditorPanelConfig,
  useConfig,
  useElementData,
  useElementColumns,
  useLoadingState,
} from "@sigmacomputing/plugin";
import Heatmap from "./plugins/Heatmap";
import Treemap from "./plugins/Treemap";

const CHART_TYPES = ["Heatmap", "Treemap"];

export default function App() {
  const [loading, setLoading] = useLoadingState(true);

  // --------------------------------------------------
  // Define config panel (shows in Sigma's right sidebar)
  // --------------------------------------------------
  useEditorPanelConfig([
    // Chart type selector
    { type: "dropdown", name: "chartType", label: "Chart Type",
      values: CHART_TYPES, defaultValue: "Heatmap" },

    // Data source — user picks a table/element from the workbook
    { type: "element", name: "source", label: "Data Source" },

    // Column mappings — shared across chart types
    { type: "column", name: "dimension1", label: "Category (rows/parent)",
      source: "source", allowMultiple: false },
    { type: "column", name: "dimension2", label: "Sub-category (cols/child)",
      source: "source", allowMultiple: false },
    { type: "column", name: "measure", label: "Value (numeric)",
      source: "source", allowMultiple: false,
      allowedTypes: ["number", "integer"] },

    // Display options
    { type: "text", name: "title", label: "Title", defaultValue: "" },
    { type: "dropdown", name: "colorScheme", label: "Color Scheme",
      values: ["blues", "greens", "reds", "oranges", "purples", "blue_green", "yellow_green"],
      defaultValue: "blues" },
    { type: "toggle", name: "showLabels", label: "Show Labels", defaultValue: true },
  ]);

  const config = useConfig();
  const columns = useElementColumns(config.source);
  const sigmaData = useElementData(config.source);

  // Check if we have enough config to render
  const isConfigured = config.source && config.dimension1 && config.measure;
  const hasData = sigmaData && Object.keys(sigmaData).length > 0;

  if (!isConfigured) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderIcon}>📊</div>
        <div style={styles.placeholderTitle}>Custom Visualization Plugin</div>
        <div style={styles.placeholderText}>
          Select a <strong>Data Source</strong>, then map your{" "}
          <strong>Category</strong>, <strong>Sub-category</strong>, and{" "}
          <strong>Value</strong> columns in the panel to the right.
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.placeholderText}>Waiting for data...</div>
      </div>
    );
  }

  // Route to the selected chart type
  const chartProps = { config, sigmaData, columns, setLoading };

  switch (config.chartType) {
    case "Treemap":
      return <Treemap {...chartProps} />;
    case "Heatmap":
    default:
      return <Heatmap {...chartProps} />;
  }
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
