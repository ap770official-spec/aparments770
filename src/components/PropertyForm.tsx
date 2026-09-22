"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { createProperty, type PropertyForDuplication } from "@/lib/properties";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import type { Region } from "@/lib/regions";

type AmenityCategory = "general" | "shabbat_kosher" | "proximity";

const AMENITY_GROUPS: { category: AmenityCategory; keys: string[] }[] = [
  {
    category: "general",
    keys: [
      "dryer",
      "balcony_yard",
      "iron",
      "storage_closets",
      "crib",
      "elevator",
    ],
  },
  {
    category: "shabbat_kosher",
    keys: [
      "shabbat_elevator",
      "non_electric_lock",
      "hotplate",
      "shabbat_clock",
      "kosher_kitchen",
      "sukkah",
    ],
  },
  {
    category: "proximity",
    keys: ["supermarket", "mikvah", "bakery", "subway"],
  },
];

type PendingFile = {
  file: File;
  previewUrl: string;
};

export default function PropertyForm({
  regions,
  ownerId,
  initialProperty,
}: {
  regions: Region[];
  ownerId: string;
  initialProperty?: PropertyForDuplication;
}) {
  const t = useTranslations("propertyForm");
  const tProperty = useTranslations("property");
  const tCategory = useTranslations("amenityCategories");
  const tAmenity = useTranslations("amenities");

  const initialAmenityKeys = initialProperty?.property_amenities.map(
    (a) => a.amenity_key,
  );

  const [regionId, setRegionId] = useState(
    initialProperty?.region_id ?? regions[0]?.id ?? "",
  );
  const [address, setAddress] = useState(initialProperty?.address ?? "");
  const [bedrooms, setBedrooms] = useState(initialProperty?.bedrooms ?? 0);
  const [beds, setBeds] = useState(initialProperty?.beds ?? 0);
  const [toilets, setToilets] = useState(initialProperty?.toilets ?? 0);
  const [bathtubs, setBathtubs] = useState(initialProperty?.bathtubs ?? 0);
  const [pricePerNight, setPricePerNight] = useState(
    initialProperty ? String(initialProperty.price_per_night) : "",
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    initialProperty?.phone_country_code ?? "+1",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    initialProperty?.phone_number ?? "",
  );
  const [checkinTime, setCheckinTime] = useState(
    initialProperty?.checkin_time ?? "",
  );
  const [checkoutTime, setCheckoutTime] = useState(
    initialProperty?.checkout_time ?? "",
  );
  const [maxGuests, setMaxGuests] = useState(
    initialProperty?.max_guests ? String(initialProperty.max_guests) : "",
  );
  const [minNights, setMinNights] = useState(
    initialProperty?.min_nights ? String(initialProperty.min_nights) : "",
  );
  const [descriptionHe, setDescriptionHe] = useState(
    initialProperty?.description_he ?? "",
  );
  const [descriptionEn, setDescriptionEn] = useState(
    initialProperty?.description_en ?? "",
  );
  const [descriptionSourceLang, setDescriptionSourceLang] = useState<
    "he" | "en"
  >("he");
  const [amenities, setAmenities] = useState<Set<string>>(
    new Set(initialAmenityKeys ?? []),
  );
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleAmenity(key: string) {
    setAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setPendingFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    event.target.value = "";
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      setUploading(true);
      const uploaded = await Promise.all(
        pendingFiles.map((pf) => uploadMediaToCloudinary(pf.file)),
      );
      setUploading(false);

      setSubmitting(true);
      const supabase = createBrowserSupabaseClient();

      const amenityPayload = AMENITY_GROUPS.flatMap((group) =>
        group.keys
          .filter((key) => amenities.has(key))
          .map((key) => ({ category: group.category, amenityKey: key })),
      );

      await createProperty(supabase, {
        ownerId,
        regionId,
        address,
        bedrooms,
        beds,
        toilets,
        bathtubs,
        pricePerNight: Number(pricePerNight),
        phoneCountryCode,
        phoneNumber,
        checkinTime: checkinTime || null,
        checkoutTime: checkoutTime || null,
        maxGuests: maxGuests ? Number(maxGuests) : null,
        minNights: minNights ? Number(minNights) : null,
        descriptionHe: descriptionHe || null,
        descriptionEn: descriptionEn || null,
        descriptionSourceLang: descriptionHe || descriptionEn
          ? descriptionSourceLang
          : null,
        amenities: amenityPayload,
        media: uploaded.map((m, index) => ({
          url: m.url,
          mediaType: m.mediaType,
          sortOrder: index,
        })),
      });

      setSubmitting(false);
      setSuccess(true);
    } catch {
      setUploading(false);
      setSubmitting(false);
      setError(t("errorGeneric"));
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">{t("successTitle")}</h1>
        <p className="mt-2 text-black/70 dark:text-white/70">
          {t("successBody")}
        </p>
        <Link
          href="/owner/dashboard"
          className="mt-6 inline-block rounded-md bg-foreground px-6 py-3 text-background"
        >
          {t("backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl px-4 py-12"
    >
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="mt-6 grid gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t("region")}
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            required
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name_he} / {r.name_en}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("address")}
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("bedrooms")}
            <input
              type="number"
              min={0}
              max={30}
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("beds")}
            <input
              type="number"
              min={0}
              max={30}
              value={beds}
              onChange={(e) => setBeds(Number(e.target.value))}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("toilets")}
            <input
              type="number"
              min={0}
              max={30}
              value={toilets}
              onChange={(e) => setToilets(Number(e.target.value))}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("bathtubs")}
            <input
              type="number"
              min={0}
              max={30}
              value={bathtubs}
              onChange={(e) => setBathtubs(Number(e.target.value))}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {t("pricePerNight")}
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t("phoneCountryCode")}
            <input
              type="text"
              required
              placeholder="+1"
              value={phoneCountryCode}
              onChange={(e) => setPhoneCountryCode(e.target.value)}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("phoneNumber")}
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("checkin")}
            <input
              type="time"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("checkout")}
            <input
              type="time"
              value={checkoutTime}
              onChange={(e) => setCheckoutTime(e.target.value)}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("maxGuests")}
            <input
              type="number"
              min={1}
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.target.value)}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tProperty("minNights")}
            <input
              type="number"
              min={1}
              value={minNights}
              onChange={(e) => setMinNights(e.target.value)}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {t("descriptionHe")}
          <textarea
            value={descriptionHe}
            onChange={(e) => setDescriptionHe(e.target.value)}
            rows={3}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("descriptionEn")}
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={3}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        {(descriptionHe || descriptionEn) && (
          <fieldset className="flex items-center gap-4 text-sm">
            <legend className="mb-1 w-full">
              {t("descriptionSourceLang")}
            </legend>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="descriptionSourceLang"
                checked={descriptionSourceLang === "he"}
                onChange={() => setDescriptionSourceLang("he")}
              />
              {t("descriptionSourceLangHe")}
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="descriptionSourceLang"
                checked={descriptionSourceLang === "en"}
                onChange={() => setDescriptionSourceLang("en")}
              />
              {t("descriptionSourceLangEn")}
            </label>
          </fieldset>
        )}

        <div>
          <h2 className="text-lg font-semibold">
            {tProperty("amenitiesTitle")}
          </h2>
          {AMENITY_GROUPS.map((group) => (
            <div key={group.category} className="mt-3">
              <p className="text-sm font-medium text-black/60 dark:text-white/60">
                {tCategory(group.category)}
              </p>
              <div className="mt-1 flex flex-wrap gap-3">
                {group.keys.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={amenities.has(key)}
                      onChange={() => toggleAmenity(key)}
                    />
                    {tAmenity(key)}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="flex flex-col gap-1 text-sm">
            {t("mediaLabel")}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesSelected}
              className="text-sm"
            />
          </label>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            {t("mediaHint")}
          </p>

          {pendingFiles.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {pendingFiles.map((pf, index) => (
                <div key={pf.previewUrl} className="relative">
                  {pf.file.type.startsWith("video/") ? (
                    <video
                      src={pf.previewUrl}
                      className="h-24 w-full rounded-md object-cover"
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pf.previewUrl}
                      alt=""
                      className="h-24 w-full rounded-md object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute end-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                  >
                    {t("removeMedia")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={uploading || submitting}
          className="mt-2 rounded-md bg-foreground px-6 py-3 text-background disabled:opacity-60"
        >
          {uploading ? t("uploading") : submitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
