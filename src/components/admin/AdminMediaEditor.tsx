"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { optimizedCloudinaryUrl, uploadMediaToCloudinary } from "@/lib/cloudinary";

type MediaItem = { url: string; mediaType: "image" | "video" };

/**
 * Media section of the admin edit form. Keeps the ordered list of the
 * listing's photos/videos in state and submits it as one JSON hidden
 * input ("media") - the first item is the main photo. New files go
 * straight from the browser to Cloudinary, same as the owner's
 * wizard; while an upload is running the form's submit buttons are
 * disabled so a save can't drop a half-uploaded file.
 */
export default function AdminMediaEditor({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const uploading = uploadingCount > 0;

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    form
      ?.querySelectorAll<HTMLButtonElement>('button[type="submit"]')
      .forEach((button) => {
        button.disabled = uploading;
      });
  }, [uploading]);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setUploadingCount((n) => n + files.length);
    await Promise.all(
      files.map(async (file) => {
        try {
          const uploaded = await uploadMediaToCloudinary(file);
          setItems((prev) => [...prev, uploaded]);
        } catch {
          setError(`העלאת "${file.name}" נכשלה. נסה שוב.`);
        } finally {
          setUploadingCount((n) => n - 1);
        }
      }),
    );
  }

  function move(index: number, delta: number) {
    setItems((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function makeMain(index: number) {
    setItems((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const smallButton =
    "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md bg-white/95 px-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div ref={rootRef}>
      <input type="hidden" name="media" value={JSON.stringify(items)} />

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
          אין תמונות לדירה הזו.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.url}
              className="relative overflow-hidden rounded-xl border border-line bg-placeholder"
            >
              {item.mediaType === "video" ? (
                <video
                  src={item.url}
                  muted
                  preload="metadata"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={optimizedCloudinaryUrl(item.url)}
                  alt={`תמונה ${index + 1}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              {index === 0 && (
                <span className="absolute start-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
                  תמונה ראשית
                </span>
              )}
              <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`הזז את תמונה ${index + 1} קדימה`}
                  className={smallButton}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`הזז את תמונה ${index + 1} אחורה`}
                  className={smallButton}
                >
                  ←
                </button>
                {index !== 0 && item.mediaType === "image" && (
                  <button
                    type="button"
                    onClick={() => makeMain(index)}
                    className={smallButton}
                  >
                    קבע כראשית
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`הסר את תמונה ${index + 1}`}
                  className={`${smallButton} ms-auto text-red-700`}
                >
                  הסר
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 cursor-pointer items-center rounded-lg border border-ink px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFiles}
            className="sr-only"
          />
          + הוסף תמונות / וידאו
        </label>
        <span role="status" aria-live="polite" className="text-sm text-ink-soft">
          {uploading ? `מעלה ${uploadingCount} ${uploadingCount === 1 ? "קובץ" : "קבצים"}…` : ""}
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <p className="mt-2 text-xs text-ink-muted">
        התמונה הראשונה היא התמונה הראשית. השינויים נשמרים רק בלחיצה על &quot;שמור שינויים&quot;.
      </p>
    </div>
  );
}
