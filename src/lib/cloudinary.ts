const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export type UploadedMedia = {
  url: string;
  mediaType: "image" | "video";
};

/**
 * Uploads a single file straight from the browser to Cloudinary
 * (unsigned preset, no server round-trip). Images and videos go
 * through different Cloudinary endpoints, so the resource type is
 * picked from the file's MIME type. Size/quality limits are enforced
 * by the preset's "Incoming Transformation" setting on Cloudinary's
 * side, not here.
 */
export async function uploadMediaToCloudinary(
  file: File,
): Promise<UploadedMedia> {
  const isVideo = file.type.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData },
  );

  if (!response.ok) {
    throw new Error(`Upload to Cloudinary failed (${response.status})`);
  }

  const data = await response.json();
  return { url: data.secure_url as string, mediaType: isVideo ? "video" : "image" };
}

/**
 * Inserts an f_auto,q_auto delivery transformation into a Cloudinary
 * URL, so viewers get the smallest file their browser can render
 * (e.g. WebP/AVIF) without re-uploading anything. Safe to call on any
 * Cloudinary /upload/ URL, image or video.
 */
export function optimizedCloudinaryUrl(url: string): string {
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}
