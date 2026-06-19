import { useMemo, useEffect } from "react";
import { rampColors } from "../palette";
import { ResponsiveCalendar } from "@nivo/calendar";
import { aggregate } from "../aggregate";
import { makeFormatter } from "../format";

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

export default function Calendar({ config, sigmaData, setLoading, onSelect, theme }) {
  const { chartData, from, to } = useMemo(() => {
    const dateCol = sigmaData[config.dimension1];
    const valCol = sigmaData[config.measure];
    if (!dateCol || !valCol) return { chartData: [], from: "", to: "" };

    // Aggregate values per day
    const dayMap = {};
    for (let i = 0; i < dateCol.length; i++) {
      const day = toYMD(dateCol[i]);
      if (!day) continue;
      (dayMap[day] ||= []).push(Number(valCol[i]) || 0);
    }

    const days = Object.keys(dayMap).sort();
    if (!days.length) return { chartData: [], from: "", to: "" };

    const method = config.aggregation || "Sum";

    return {
      chartData: days.map((day) => ({ day, value: aggregate(dayMap[day], method) })),
      from: days[0],
      to: days[days.length - 1],
    };
  }, [sigmaData, config.dimension1, config.measure]);

  useEffect(() => {
    if (chartData.length > 0) setLoading(false);
  }, [chartData, setLoading]);

  if (!chartData.length) {
    return (
      <div style={{ padding: 20, color: theme?.muted ?? "#999", textAlign: "center" }}>
        No data to display. Make sure a date column and value column are mapped.
      </div>
    );
  }

  const colors = rampColors(config);
  const fmtVal = makeFormatter(config);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {config.title && (
        <div style={{
          textAlign: "center", padding: "8px 0", fontSize: theme?.titleSize ?? 16,
          fontWeight: 600, fontFamily: theme?.font ?? "'Inter Variable', system-ui, sans-serif", color: theme?.text ?? "#333",
          flexShrink: 0,
        }}>
          {config.title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveCalendar
          data={chartData}
          theme={theme?.nivo}
          from={from}
          to={to}
          valueFormat={fmtVal}
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
                <strong>{day}</strong>: {value != null ? value : "N/A"}
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
