import { useMemo, useEffect } from "react";
import { ResponsiveCalendar } from "@nivo/calendar";

/**
 * Calendar Heatmap Plugin
 *
 * Renders a year-calendar heatmap (like GitHub contributions).
 * Great for: daily activity, revenue by day, incident frequency,
 * website traffic patterns, etc.
 *
 * Required columns:
 *   - dimension1: date column (datetime values)
 *   - measure: numeric value for each day (aggregated if multiple rows/day)
 */

const COLOR_STOPS = {
  blues:        ["#deebf7", "#9ecae1", "#4292c6", "#084594"],
  greens:       ["#e5f5e0", "#a1d99b", "#41ab5d", "#005a32"],
  reds:         ["#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"],
  oranges:      ["#feedde", "#fdbe85", "#fd8d3c", "#d94701"],
  purples:      ["#f2f0f7", "#b4b4d8", "#8073ac", "#4a1486"],
  blue_green:   ["#e0f3db", "#a8ddb5", "#43a2ca", "#0868ac"],
  yellow_green: ["#ffffcc", "#c2e699", "#78c679", "#238443"],
};

function toYMD(raw) {
  if (raw == null) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  // Format as YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Calendar({ config, sigmaData, setLoading, onSelect }) {
  const { chartData, from, to } = useMemo(() => {
    const dateCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!dateCol || !valCol) return { chartData: [], from: "", to: "" };

    // Aggregate values per day
    const dayMap = {};
    for (let i = 0; i < dateCol.length; i++) {
      const day = toYMD(dateCol[i]);
      if (!day) continue;
      dayMap[day] = (dayMap[day] || 0) + (Number(valCol[i]) || 0);
    }

    const days = Object.keys(dayMap).sort();
    if (!days.length) return { chartData: [], from: "", to: "" };

    return {
      chartData: days.map((day) => ({ day, value: dayMap[day] })),
      from: days[0],
      to: days[days.length - 1],
    };
  }, [sigmaData, config.dimension1, config.measure]);

  useEffect(() => {
    if (chartData.length > 0) setLoading(false);
  }, [chartData, setLoading]);

  if (!chartData.length) {
    return (
      <div style={{ padding: 20, color: "#999", textAlign: "center" }}>
        No data to display. Make sure a date column and value column are mapped.
      </div>
    );
  }

  const colors = COLOR_STOPS[config.colorScheme] || COLOR_STOPS.blues;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: 16,
          fontWeight: 600, fontFamily: "sans-serif", color: "#333",
          flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveCalendar
          data={chartData}
          from={from}
          to={to}
          emptyColor="#eeeeee"
          colors={colors}
          margin={{ top: 40, right: 40, bottom: 50, left: 40 }}
          yearSpacing={40}
          monthBorderColor="#ffffff"
          monthBorderWidth={2}
          dayBorderWidth={1}
          dayBorderColor="#ffffff"
          tooltip={({ day, value, color }) => (
            <div style={{
              background: "white", padding: "8px 12px", borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 12, height: 12,
                backgroundColor: color, borderRadius: 2,
              }} />
              <span>
                <strong>{day}</strong>: {value != null ? value.toLocaleString() : "N/A"}
              </span>
            </div>
          )}
          onClick={(day) => {
            if (onSelect && day.day) onSelect(day.day);
          }}
          legends={[
            {
              anchor: "bottom-right",
              direction: "row",
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: "right-to-left",
            },
          ]}
        />
      </div>
    </div>
  );
}
