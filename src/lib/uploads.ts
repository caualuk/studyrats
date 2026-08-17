import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "uploads";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// next/image runs `unoptimized` here (see next.config.ts), so nothing
// resizes or compresses a photo between Storage and the browser -- whatever
// bytes land in the bucket are exactly what every card/calendar/avatar ships
// to the client, at full original resolution. Most upload paths (check-ins,
// avatars) already crop to a fixed size client-side (see ImageCropper), but
// that's not universal -- challenge covers upload the raw file -- so this is
// the one place that guarantees every photo actually stored is web-sized.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export class UploadError extends Error {}

/**
 * Persists an uploaded photo to the "uploads" bucket in Supabase Storage,
 * under <subdir>/<uuid>.<ext>, and returns its public URL. Storage (not
 * local disk) is required here because production runs on a serverless
 * platform with a read-only filesystem.
 *
 * Anything but a GIF is re-encoded to WebP and capped at MAX_DIMENSION on
 * its long edge before upload -- GIFs are left untouched since a static
 * resize would flatten any animation, and they're rare enough here (proof
 * photos, avatars, covers) not to be worth the extra complexity of an
 * animated-WebP re-encode.
 */
export async function savePhotoUpload(file: File, subdir: string): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new UploadError("Envie uma imagem em JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("A imagem deve ter no máximo 8MB.");
  }

  const original = Buffer.from(await file.arrayBuffer());

  let buffer: Buffer;
  let outExtension: string;
  let contentType: string;
  if (file.type === "image/gif") {
    buffer = original;
    outExtension = extension;
    contentType = file.type;
  } else {
    try {
      buffer = await sharp(original)
        .rotate() // bake in EXIF orientation before it gets stripped
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } catch {
      throw new UploadError("Não foi possível processar essa imagem. Tente outro arquivo.");
    }
    outExtension = "webp";
    contentType = "image/webp";
  }

  const path = `${subdir}/${crypto.randomUUID()}.${outExtension}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType });

  if (error) {
    throw new UploadError("Não foi possível salvar a imagem. Tente novamente.");
  }

  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
