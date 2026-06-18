import { useState, Suspense } from "react";
import { CHART_TYPES, CHART_COMPONENTS } from "./charts";
import { buildTheme } from "./theme";

/**
 * Standalone DEV PREVIEW — renders the chart components with mock data so you
 * can see every visualization in a plain browser tab WITHOUT Sigma.
 *
 * The real plugin (App.jsx) only renders when Sigma feeds it data over
 * postMessage; opened directly the dev server just shows a placeholder. This
 * harness bypasses the Sigma hooks and supplies mock column-oriented data in
 * the same shape useElementData() returns.
 *
 * Open it at:  http://localhost:5173/sigma/?demo
 */

// Deterministic pseudo-random so the preview is stable across reloads.
function makeMockData() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const cats = ["North", "South", "East", "West", "Central"];
  const subs = ["Alpha", "Beta", "Gamma"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const start = new Date("2024-01-01").getTime();

  const cat = [], sub = [], time = [], date = [], value = [], value2 = [];
  const from = [], to = []; // same-set flow (region → region) for Chord
  for (let i = 0; i < 240; i++) {
    cat.push(cats[i % cats.length]);
    sub.push(subs[i % subs.length]);
    time.push(months[i % months.length]);
    date.push(new Date(start + Math.floor(rand() * 360) * 86400000).toISOString().slice(0, 10));
    value.push(Math.round(20 + rand() * 180));
    value2.push(Math.round(10 + rand() * 120));

    const a = Math.floor(rand() * cats.length);
    let b = Math.floor(rand() * cats.length);
    if (b === a) b = (a + 1) % cats.length; // avoid self-loops
    from.push(cats[a]);
    to.push(cats[b]);
  }
  return { cat, sub, time, date, value, value2, from, to };
}

const MOCK = makeMockData();

const COLUMNS = {
  cat: { id: "cat", name: "Region", columnType: "text" },
  sub: { id: "sub", name: "Segment", columnType: "text" },
  time: { id: "time", name: "Month", columnType: "text" },
  date: { id: "date", name: "Date", columnType: "datetime" },
  value: { id: "value", name: "Revenue", columnType: "number" },
  value2: { id: "value2", name: "Cost", columnType: "number" },
  from: { id: "from", name: "Region (from)", columnType: "text" },
  to: { id: "to", name: "Region (to)", columnType: "text" },
};

const SCHEMES = ["blues", "greens", "reds", "oranges", "purples", "blue_green", "yellow_green"];

// Per-chart sensible column mapping against the mock columns above.
function demoConfigFor(chartType) {
  switch (chartType) {
    case "Calendar":
      return { dimension1: "date", measure: "value" };
    case "Bump":
    case "AreaBump":
    case "Stream":
      return { dimension1: "cat", dimension2: "time", measure: "value" };
    case "Chord":
    case "ForceGraph":
      return { dimension1: "from", dimension2: "to", measure: "value" };
    case "Voronoi":
      return { dimension1: "cat", measure: "value", measure2: "value2" };
    case "Histogram":
    case "Ridgeline":
      return { dimension1: "cat", measure: "value" };
    case "Hexbin":
      return { measure: "value", measure2: "value2" };
    case "Bullet":
      return { dimension1: "cat", dimension2: "value2", measure: "value" };
    default:
      return { dimension1: "cat", dimension2: "sub", measure: "value" };
  }
}

export default function DevPreview() {
  // Optional deep-link: ?demo&chart=Network preselects a chart.
  const initialChart = new URLSearchParams(window.location.search).get("chart");
  const [chartType, setChartType] = useState(
    CHART_TYPES.includes(initialChart) ? initialChart : "Heatmap"
  );
  const [appearance, setAppearance] = useState("Light");
  const [colorScheme, setColorScheme] = useState("blues");
  const [clicked, setClicked] = useState(null);

  const theme = buildTheme({ appearance });
  const ChartComponent = CHART_COMPONENTS[chartType] || CHART_COMPONENTS.Heatmap;

  const config = {
    chartType,
    source: "demo",
    ...demoConfigFor(chartType),
    colorScheme,
    showLabels: true,
    title: "",
    appearance,
  };

  const chartProps = {
    config,
    sigmaData: MOCK,
    columns: COLUMNS,
    setLoading: () => {},
    onSelect: (v) => setClicked(v == null ? null : String(v)),
    selectedValue: clicked,
    theme,
  };

  const selStyle = {
    padding: "4px 8px",
    borderRadius: 4,
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: 13,
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "8px 12px", background: "#0f172a", color: "#e2e8f0", fontSize: 13,
      }}>
        <strong style={{ letterSpacing: 0.3 }}>DEV PREVIEW</strong>
        <span style={{ opacity: 0.6 }}>mock data · not connected to Sigma</span>

        <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          Chart
          <select style={selStyle} value={chartType} onChange={(e) => setChartType(e.target.value)}>
            {CHART_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Color
          <select style={selStyle} value={colorScheme} onChange={(e) => setColorScheme(e.target.value)}>
            {SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Theme
          <select style={selStyle} value={appearance} onChange={(e) => setAppearance(e.target.value)}>
            {["Light", "Dark"].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>

        <span style={{ minWidth: 120 }}>
          {clicked != null ? <>clicked: <strong>{clicked}</strong></> : <span style={{ opacity: 0.5 }}>click an element…</span>}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, background: theme.background }}>
        <Suspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: theme.muted, fontSize: 13 }}>
            Loading chart…
          </div>
        }>
          <ChartComponent {...chartProps} />
        </Suspense>
      </div>
    </div>
  );
}
