import { useEffect, useRef, useState } from "react";

/**
 * Measure a container's pixel size for hand-rolled SVG charts. Measures
 * synchronously on mount (no waiting on the first async ResizeObserver tick,
 * which is flaky under headless virtual-time) and keeps it in sync on resize.
 * Returns [ref, { width, height }].
 */
export function useContainerSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
  return [ref, size];
}
