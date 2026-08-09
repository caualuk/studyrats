"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type PillTabOption<T extends string> = {
  value: T;
  label: string;
  /** Omit to run this control as local state (onSelect) instead of a URL-driven navigation. */
  href?: string;
};

/**
 * Segmented control with a sliding accent pill that tracks the active
 * option. Two modes:
 *  - URL-driven: options carry `href`, rendered as <Link>s with
 *    `scroll={false}` (stops the page jumping back to the top on filter
 *    change) for filters that need to survive a reload/be shareable.
 *  - State-driven: no `href`, rendered as buttons that call `onSelect` --
 *    for filters that only re-sort data already on the page, where a server
 *    round-trip would just add latency for no reason.
 * Either way the slide is driven by local state that updates immediately on
 * click, decoupled from any navigation -- otherwise the indicator would
 * only move once the round-trip finishes, which reads as laggy.
 */
export function PillTabs<T extends string>({
  options,
  active,
  onSelect,
  className,
}: {
  options: PillTabOption<T>[];
  active: T;
  onSelect?: (value: T) => void;
  className?: string;
}) {
  const [optimisticActive, setOptimisticActive] = useState(active);
  const activeRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Adjust state during render (React's documented pattern for mirroring a
  // prop into state) instead of an effect, so an external URL change (e.g.
  // browser back/forward) still overrides an in-flight optimistic click.
  const [prevActive, setPrevActive] = useState(active);
  if (active !== prevActive) {
    setPrevActive(active);
    setOptimisticActive(active);
  }

  useLayoutEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [optimisticActive, options]);

  return (
    <div
      className={cn(
        "relative inline-flex flex-wrap justify-center gap-1 rounded-full border border-border-strong p-1",
        className
      )}
    >
      {indicator && (
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-full bg-accent transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {options.map((option) => {
        const isActive = option.value === optimisticActive;
        const optionClassName = cn(
          "relative z-10 rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors duration-300",
          isActive ? "text-accent-ink" : "text-white/50 hover:text-white/80"
        );

        if (option.href) {
          return (
            <Link
              key={option.value}
              ref={isActive ? activeRef : undefined}
              href={option.href}
              scroll={false}
              onClick={() => setOptimisticActive(option.value)}
              className={optionClassName}
            >
              {option.label}
            </Link>
          );
        }

        return (
          <button
            key={option.value}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => {
              setOptimisticActive(option.value);
              onSelect?.(option.value);
            }}
            className={optionClassName}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
