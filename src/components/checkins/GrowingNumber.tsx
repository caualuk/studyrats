"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 900;

/**
 * Animates from 0 up to `value` once on mount (requestAnimationFrame,
 * eased). Formats with fixed `decimals` + a trailing `suffix` internally --
 * a `format` function prop won't work here, since this is a Client
 * Component and functions can't cross the server/client props boundary.
 */
export function GrowingNumber({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let frame: number;
    startRef.current = null;

    function tick(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(1, elapsed / DURATION_MS);
      // Ease-out cubic: fast start, settles gently instead of stopping abruptly.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {display.toFixed(decimals).replace(".", ",")}
      {suffix}
    </>
  );
}
