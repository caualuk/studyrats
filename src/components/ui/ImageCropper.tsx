"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

const FRAME_W = 320;
const FRAME_H = 180; // 16:9 -- close to how check-in photos actually render (feed cards, detail modal)
const OUTPUT_W = 1280;
const OUTPUT_H = 720;

/**
 * Lets the user drag-to-position and zoom a just-picked photo inside a
 * fixed 16:9 frame before it uploads, instead of leaving the crop entirely
 * to CSS `object-cover` at render time. Renders the result to a canvas at a
 * fixed resolution and hands back a JPEG blob -- always JPEG regardless of
 * the source type, since canvas export doesn't reliably support GIF/WEBP
 * and a static crop already drops GIF animation anyway.
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
}: {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const draggingRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

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

  const baseScale = naturalSize ? Math.max(FRAME_W / naturalSize.w, FRAME_H / naturalSize.h) : 1;
  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : 0;
  const dispH = naturalSize ? naturalSize.h * scale : 0;

  function clampOffset(x: number, y: number, atScale: number) {
    const w = naturalSize ? naturalSize.w * atScale : 0;
    const h = naturalSize ? naturalSize.h * atScale : 0;
    const minX = Math.min(0, FRAME_W - w);
    const minY = Math.min(0, FRAME_H - h);
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
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cropX = -offset.x / scale;
    const cropY = -offset.y / scale;
    const cropW = FRAME_W / scale;
    const cropH = FRAME_H / scale;
    ctx.drawImage(imgRef.current, cropX, cropY, cropW, cropH, 0, 0, OUTPUT_W, OUTPUT_H);
    canvas.toBlob((blob) => blob && onConfirm(blob), "image/jpeg", 0.9);
  }

  return (
    <Modal open={open} onClose={onCancel}>
      <Card className="px-6 py-6 text-left">
        <h2 className="mb-1 text-lg font-bold">Ajustar foto</h2>
        <p className="mb-4 text-xs text-white/45">Arraste para posicionar. Use o zoom para aproximar.</p>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-xl border border-border-strong"
          style={{ width: FRAME_W, height: FRAME_H }}
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
