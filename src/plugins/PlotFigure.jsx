import { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";

/**
 * React wrapper for Observable Plot.
 *
 * Plot.plot() returns a DOM node (not React), so we measure the container with a
 * ResizeObserver and (re)render the figure into it whenever the size or the
 * `render` function changes. `render` is `(width, height) => Plot options`.
 * Keep `render` referentially stable in the caller (useCallback) so this only
 * re-runs when the underlying data/options actually change.
 */
export default function PlotFigure({ render }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measure synchronously on mount (don't wait for the first async
    // ResizeObserver callback — that adds a render delay and is nondeterministic
    // under headless virtual-time), then keep it in sync on resize.
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) => {
        const width = Math.floor(r.width);
        const height = Math.floor(r.height);
        return prev.width === width && prev.height === height ? prev : { width, height };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof render !== "function" || size.width < 20 || size.height < 20) return;
    let chart;
    try {
      chart = Plot.plot(render(size.width, size.height));
      el.replaceChildren(chart);
    } catch (e) {
      el.innerHTML =
        `<div style="padding:20px;color:#999;font:13px sans-serif;text-align:center">` +
        `Could not render chart: ${String(e?.message || e)}</div>`;
    }
    return () => { if (el) el.replaceChildren(); };
  }, [render, size.width, size.height]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
