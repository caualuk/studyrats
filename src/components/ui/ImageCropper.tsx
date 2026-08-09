"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

// Default 16:9 -- close to how check-in photos actually render (feed cards,
// detail modal). The frame itself is CSS-sized (w-full, capped at
// MAX_FRAME_W, with aspectRatio enforcing the ratio) so it never overflows a
// narrow phone's dialog width -- frameSize below tracks its *actual*
// rendered pixels via ResizeObserver, since the drag/zoom/crop math all
// needs real numbers, not the CSS intent.
const MAX_FRAME_W = 320;

/**
 * Lets the user drag-to-position and zoom a just-picked photo inside a
 * fixed-aspect frame before it uploads, instead of leaving the crop entirely
 * to CSS `object-cover` at render time. Renders the result to a canvas at a
 * fixed resolution and hands back a JPEG blob -- always JPEG regardless of
 * the source type, since canvas export doesn't reliably support GIF/WEBP
 * and a static crop already drops GIF animation anyway.
 *
 * `outputWidth`/`outputHeight` set both the frame's aspect ratio and the
 * exported canvas resolution -- pass a 1:1 pair with `shape="circle"` for
 * avatar-style crops (round frame, still exports a square image; the circle
 * is just a preview mask so `object-cover` on a round `<Avatar>` matches
 * what the user actually centered).
 *
 * The caller should remount this component (e.g. `key={file?.name}`) when
 * a new file is picked so zoom/pan/naturalSize reset to their defaults --
 * simpler and more idiomatic than syncing that reset through an effect.
 */
export function ImageCropper({
  file,
  open,
  onCancel,
  onConfirm,
  outputWidth = 1280,
  outputHeight = 720,
  shape = "rect",
}: {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
  outputWidth?: number;
  outputHeight?: number;
  shape?: "rect" | "circle";
}) {
  const aspect = outputWidth / outputHeight;
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [frameSize, setFrameSize] = useState({ w: MAX_FRAME_W, h: MAX_FRAME_W / aspect });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setFrameSize({ w: width, h: width / aspect });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [aspect]);

  // Creating and revoking the object URL both live in this one effect (not
  // e.g. a useMemo for creation + a separate effect for cleanup) so they
  // stay paired -- React's dev-mode double-invoke would otherwise revoke a
  // URL that a mismatched creation step never recreated, leaving the <img>
  // pointed at a dead blob URL.
  useEffect(() => {
    if (!file || !imgRef.current) return;
    const url = URL.createObjectURL(file);
    imgRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = naturalSize
    ? Math.max(frameSize.w / naturalSize.w, frameSize.h / naturalSize.h)
    : 1;
  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : 0;
  const dispH = naturalSize ? naturalSize.h * scale : 0;

  function clampOffset(x: number, y: number, atScale: number) {
    const w = naturalSize ? naturalSize.w * atScale : 0;
    const h = naturalSize ? naturalSize.h * atScale : 0;
    const minX = Math.min(0, frameSize.w - w);
    const minY = Math.min(0, frameSize.h - h);
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  }

  function handleImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }

  function handleZoomChange(nextZoom: number) {
    setZoom(nextZoom);
    setOffset((current) => clampOffset(current.x, current.y, baseScale * nextZoom));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // Capture can throw for pointer ids the browser isn't actively
    // tracking (synthetic events, some touch edge cases) -- that's not a
    // reason to skip starting the drag itself.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // no-op
    }
    draggingRef.current = { startX: event.clientX, startY: event.clientY, origX: offset.x, origY: offset.y };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = event.clientX - draggingRef.current.startX;
    const dy = event.clientY - draggingRef.current.startY;
    setOffset(clampOffset(draggingRef.current.origX + dx, draggingRef.current.origY + dy, scale));
  }

  function handlePointerUp() {
    draggingRef.current = null;
  }

  function handleConfirm() {
    if (!imgRef.current || !naturalSize) return;
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cropX = -offset.x / scale;
    const cropY = -offset.y / scale;
    const cropW = frameSize.w / scale;
    const cropH = frameSize.h / scale;
    ctx.drawImage(imgRef.current, cropX, cropY, cropW, cropH, 0, 0, outputWidth, outputHeight);
    canvas.toBlob((blob) => blob && onConfirm(blob), "image/jpeg", 0.9);
  }

  return (
    <Modal open={open} onClose={onCancel}>
      <Card className="px-6 py-6 text-left">
        <h2 className="mb-1 text-lg font-bold">Ajustar foto</h2>
        <p className="mb-4 text-xs text-white/45">Arraste para posicionar. Use o zoom para aproximar.</p>

        <div
          ref={frameRef}
          className={cn(
            "relative mx-auto w-full max-w-[320px] touch-none select-none overflow-hidden border border-border-strong",
            shape === "circle" ? "rounded-full" : "rounded-xl"
          )}
          style={{ aspectRatio: aspect }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {file && (
            // eslint-disable-next-line @next/next/no-img-element -- interactive drag/zoom preview (src set imperatively, see the effect above), the real crop is drawn to canvas on confirm
            <img
              ref={imgRef}
              alt=""
              draggable={false}
              onLoad={handleImgLoad}
              className="absolute left-0 top-0 max-w-none cursor-grab active:cursor-grabbing"
              style={{
                width: dispW || undefined,
                height: dispH || undefined,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(event) => handleZoomChange(Number(event.target.value))}
          className="mt-4 w-full accent-accent"
          aria-label="Zoom"
        />

        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm}>
            Usar essa foto
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
