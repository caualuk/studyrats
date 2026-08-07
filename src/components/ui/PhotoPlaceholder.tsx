import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Renders an uploaded photo when one exists. Without a photo, falls back to
 * a solid `color` if one was picked (e.g. a challenge cover color), and
 * finally to the mockup's diagonal-stripe placeholder with a label (e.g.
 * "foto do check-in", "capa do desafio").
 */
export function PhotoPlaceholder({
  src,
  color,
  alt,
  label,
  className,
  children,
}: {
  src?: string | null;
  color?: string | null;
  alt: string;
  label: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : color ? (
        <div className="absolute inset-0" style={{ backgroundColor: color }} />
      ) : (
        <div className="photo-placeholder absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[11px] text-white/40">{label}</span>
        </div>
      )}
      {children}
    </div>
  );
}
