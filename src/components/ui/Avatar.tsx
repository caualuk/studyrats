import Image from "next/image";
import { cn } from "@/lib/cn";

const SIZE_CLASSES = {
  sm: "h-[18px] w-[18px]",
  md: "h-8 w-8",
  lg: "h-9 w-9",
  xl: "h-[88px] w-[88px]",
} as const;

const INITIAL_TEXT_SIZE = {
  sm: "text-[9px]",
  md: "text-[13px]",
  lg: "text-sm",
  xl: "text-3xl",
} as const;

export function Avatar({
  src,
  alt = "",
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  alt?: string;
  /** Shown as a fallback initial when there's no photo. */
  name?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  if (src) {
    const pixelSize = { sm: 18, md: 32, lg: 36, xl: 88 }[size];
    return (
      <Image
        src={src}
        alt={alt}
        width={pixelSize}
        height={pixelSize}
        className={cn("rounded-full object-cover", SIZE_CLASSES[size], className)}
      />
    );
  }

  const initial = name?.trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[#3a3a40] font-bold text-white/70",
        SIZE_CLASSES[size],
        initial && INITIAL_TEXT_SIZE[size],
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
