import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadError extends Error {}

/**
 * Persists an uploaded photo to disk under /public/uploads/<subdir> and
 * returns the public URL path to store on the record (e.g.
 * "/uploads/checkins/<uuid>.jpg"). Files land in the Next.js `public`
 * folder, so they're served directly with no route handler needed.
 */
export async function savePhotoUpload(file: File, subdir: string): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new UploadError("Envie uma imagem em JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("A imagem deve ter no máximo 8MB.");
  }

  const dir = path.join(UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}
