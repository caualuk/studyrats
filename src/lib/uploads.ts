import "server-only";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "uploads";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadError extends Error {}

/**
 * Persists an uploaded photo to the "uploads" bucket in Supabase Storage,
 * under <subdir>/<uuid>.<ext>, and returns its public URL. Storage (not
 * local disk) is required here because production runs on a serverless
 * platform with a read-only filesystem.
 */
export async function savePhotoUpload(file: File, subdir: string): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new UploadError("Envie uma imagem em JPG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("A imagem deve ter no máximo 8MB.");
  }

  const path = `${subdir}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type });

  if (error) {
    throw new UploadError("Não foi possível salvar a imagem. Tente novamente.");
  }

  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
