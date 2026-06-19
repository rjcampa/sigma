import { useState, Suspense } from "react";
import { CHART_TYPES, CHART_COMPONENTS } from "./charts";
import { buildTheme } from "./theme";
import { AGG_METHODS } from "./aggregate";
import { PALETTE_OPTIONS } from "./palette";

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
  const months = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"];
  const start = new Date("2024-01-01").getTime();

  const cohorts = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"];
  const accounts = ["Revenue", "COGS", "Gross Profit", "Marketing", "G&A", "Net Income"];
  const negAccounts = new Set(["COGS", "Marketing", "G&A"]);

  const cat = [], sub = [], time = [], date = [], value = [], value2 = [];
  const from = [], to = [];   // same-set flow (region → region) for Chord
  const delta = [];           // signed change for Waterfall
  const cohort = [], period = [], users = []; // for Cohort Retention
  const account = [], amount = []; // for Cohort P&L
  for (let i = 0; i < 240; i++) {
    cat.push(cats[i % cats.length]);
    sub.push(subs[i % subs.length]);
    time.push(months[i % months.length]);
    date.push(new Date(start + Math.floor(rand() * 360) * 86400000).toISOString().slice(0, 10));
    value.push(Math.round(20 + rand() * 180));
    value2.push(Math.round(10 + rand() * 120));
    // signed deltas, biased by region so the waterfall has clear ups & downs
    delta.push(Math.round((rand() - 0.42) * 120) + ((i % cats.length) - 2) * 18);

    const a = Math.floor(rand() * cats.length);
    let b = Math.floor(rand() * cats.length);
    if (b === a) b = (a + 1) % cats.length; // avoid self-loops
    from.push(cats[a]);
    to.push(cats[b]);

    // cohort grid: 6 cohorts × periods 0..5, users decaying ~28%/period
    const ci = Math.floor(i / 40);          // 40 rows per cohort
    const p = i % 6;                         // period 0..5
    cohort.push(cohorts[ci]);
    period.push(p);
    users.push(Math.round(200 * Math.pow(0.72, p) * (0.85 + rand() * 0.3)));

    // P&L: line item varies every 6 rows so (account × month) fills a full grid
    const acc = accounts[Math.floor(i / 6) % accounts.length];
    account.push(acc);
    amount.push(negAccounts.has(acc)
      ? -Math.round(30 + rand() * 110)
      : Math.round(60 + rand() * 180));
  }
  return {
    cat, sub, time, date, value, value2, from, to, delta, cohort, period, users,
    account, amount,
  };
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
  delta: { id: "delta", name: "Net change", columnType: "number" },
  cohort: { id: "cohort", name: "Cohort", columnType: "text" },
  period: { id: "period", name: "Period", columnType: "integer" },
  users: { id: "users", name: "Users", columnType: "number" },
  account: { id: "account", name: "Line item", columnType: "text" },
  amount: { id: "amount", name: "Amount", columnType: "number" },
};

const SCHEMES = [...PALETTE_OPTIONS, "Custom"];

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
    case "KPI":
      return { dimension1: "time", measure: "value" };
    case "Gauge":
      return { measure: "value2", dimension2: "value" }; // value(<target) → partial fill
    case "Waterfall":
      return { dimension1: "cat", measure: "delta" };
    case "CohortRetention":
      return { dimension1: "cohort", dimension2: "period", measure: "users" };
    case "Line":
      return { dimension1: "cat", dimension2: "time", measure: "value" };
    case "Scatter":
      return { dimension1: "cat", measure: "value", measure2: "value2" };
    case "CohortPnL":
      return { dimension1: "account", dimension2: "time", measure: "amount" };
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
  const initialPalette = new URLSearchParams(window.location.search).get("palette");
  const [colorScheme, setColorScheme] = useState(SCHEMES.includes(initialPalette) ? initialPalette : "Sigma");
  const initialAgg = new URLSearchParams(window.location.search).get("agg");
  const [aggregation, setAggregation] = useState(
    AGG_METHODS.includes(initialAgg) ? initialAgg : "Sum"
  );
  const [clicked, setClicked] = useState(null);

  // Optional style deep-links for testing: ?font=Serif&size=Large&bg=%23111&nfmt=Currency&title=...
  const qp = new URLSearchParams(window.location.search);
  const font = qp.get("font") || "Inter";
  const textSize = qp.get("size") || "Medium";
  const background = qp.get("bg") || undefined;
  const numberFormat = qp.get("nfmt") || "Auto";
  const accentColor = qp.get("accent") || undefined;
  const reverseColors = qp.get("reverse") === "1";
  // Custom palette test: ?palette=Custom&colors=ff0000,00aa55,3333ff,...
  const custom = (qp.get("colors") || "").split(",").filter(Boolean).map((h) => "#" + h.replace(/^#/, ""));

  const theme = buildTheme({ appearance, font, size: textSize, background, accent: accentColor });
  const ChartComponent = CHART_COMPONENTS[chartType] || CHART_COMPONENTS.Heatmap;

  const config = {
    chartType,
    source: "demo",
    ...demoConfigFor(chartType),
    colorScheme,
    reverseColors,
    color1: custom[0], color2: custom[1], color3: custom[2],
    color4: custom[3], color5: custom[4], color6: custom[5],
    aggregation,
    cumulative: new URLSearchParams(window.location.search).get("cumulative") === "1",
    font,
    textSize,
    background,
    numberFormat,
    accentColor,
    showLabels: true,
    title: qp.get("title") || "",
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
          Agg
          <select style={selStyle} value={aggregation} onChange={(e) => setAggregation(e.target.value)}>
            {AGG_METHODS.map((a) => <option key={a} value={a}>{a}</option>)}
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
