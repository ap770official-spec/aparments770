"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  createProperty,
  type PropertyForDuplication,
  type PropertyType,
} from "@/lib/properties";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import { getWalkingDirections } from "@/lib/mapbox";
import type { Region } from "@/lib/regions";
import LocationPicker from "@/components/LocationPicker";

type AmenityCategory =
  | "kitchen"
  | "climate"
  | "bathroom"
  | "safety"
  | "family"
  | "outdoor"
  | "shabbat_kosher"
  | "proximity";

const AMENITY_GROUPS: { category: AmenityCategory; keys: string[] }[] = [
  {
    category: "kitchen",
    keys: [
      "kitchen_hotplate",
      "kitchen_urn",
      "kitchen_fridge",
      "kitchen_stove",
      "kitchen_oven",
      "kitchen_microwave",
      "kitchen_kettle",
      "kitchen_coffee",
      "kitchen_utensils",
    ],
  },
  { category: "climate", keys: ["wifi", "ac", "heating"] },
  {
    category: "bathroom",
    keys: ["linens", "toiletries", "hairdryer", "washer", "dryer", "iron"],
  },
  {
    category: "safety",
    keys: ["safe", "smoke_detector", "fire_extinguisher", "first_aid"],
  },
  { category: "family", keys: ["crib", "games"] },
  { category: "outdoor", keys: ["balcony", "sukkah", "parking"] },
  {
    category: "shabbat_kosher",
    keys: [
      "shabbat_elevator",
      "non_electric_lock",
      "hotplate",
      "shabbat_clock",
      "kosher_kitchen",
    ],
  },
  {
    category: "proximity",
    keys: ["supermarket", "mikvah", "bakery", "subway"],
  },
];

const STEP_KEYS = [
  "address",
  "amenities",
  "description",
  "photosContact",
  "summary",
] as const;
const LAST_STEP = STEP_KEYS.length - 1;
const PHOTO_SLOT_COUNT = 6;
const CHECKIN_PRESETS = ["14:00", "15:00", "16:00"];
const CHECKOUT_PRESETS = ["10:00", "11:00", "12:00"];
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

type PendingFile = {
  file: File;
  previewUrl: string;
};

type StepStatus = "done" | "active" | "upcoming";

function circleClass(status: StepStatus): string {
  if (status === "done") {
    return "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-brand-foreground";
  }
  if (status === "active") {
    return "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white text-[13px] font-bold text-brand";
  }
  return "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[#E5DED3] bg-white text-[13px] font-bold text-[#8A8073]";
}

function labelClass(status: StepStatus): string {
  if (status === "active") return "text-center text-xs font-bold text-ink";
  if (status === "done")
    return "text-center text-xs font-semibold text-[#5C5349]";
  return "text-center text-xs font-medium text-[#8A8073]";
}

function lineClass(passed: boolean, hidden: boolean): string {
  return `h-0.5 flex-1 ${passed ? "bg-brand" : "bg-[#E5DED3]"} ${hidden ? "invisible" : ""}`;
}

function chipClass(active: boolean): string {
  return active
    ? "rounded-full border border-brand bg-brand px-[18px] py-2.5 text-[13.5px] font-semibold text-brand-foreground"
    : "rounded-full border border-[#E5DED3] bg-white px-[18px] py-2.5 text-[13.5px] font-semibold text-ink";
}

function amenityChipClass(active: boolean): string {
  return active
    ? "rounded-full border border-brand bg-brand px-4 py-2 text-[13.5px] font-semibold text-brand-foreground"
    : "rounded-full border border-[#E5DED3] bg-white px-4 py-2 text-[13.5px] font-semibold text-ink";
}

function StepperButton({
  label,
  disabled,
  onClick,
  kind,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  kind: "minus" | "plus";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DED3] text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={kind === "plus" ? "M12 5v14M5 12h14" : "M5 12h14"} />
      </svg>
    </button>
  );
}

function Counter({
  label,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] font-semibold text-[#8A8073]">{label}</span>
      <div className="flex items-center gap-3.5">
        <StepperButton
          kind="minus"
          label={decreaseLabel}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        />
        <span
          aria-live="polite"
          className="min-w-5 text-center text-xl font-bold tabular-nums text-ink"
        >
          {value}
        </span>
        <StepperButton
          kind="plus"
          label={increaseLabel}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        />
      </div>
    </div>
  );
}

function TimePicker({
  label,
  value,
  presets,
  otherLabel,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  otherLabel: string;
  onChange: (value: string) => void;
}) {
  const isOther = value !== "" && !presets.includes(value);
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[13px] font-semibold text-[#8A8073]">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {presets.map((time) => (
          <button
            key={time}
            type="button"
            aria-pressed={value === time}
            onClick={() => onChange(value === time ? "" : time)}
            className={`${chipClass(value === time)} min-h-11 tabular-nums`}
            dir="ltr"
          >
            {time}
          </button>
        ))}
        <label className="relative">
          <span className="sr-only">{otherLabel}</span>
          <select
            value={isOther ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={`${chipClass(isOther)} min-h-11 cursor-pointer appearance-none pe-9 tabular-nums`}
          >
            <option value="">{otherLabel}</option>
            {TIME_OPTIONS.filter((time) => !presets.includes(time)).map(
              (time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ),
            )}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 ${isOther ? "text-brand-foreground" : "text-[#8A8073]"}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </label>
      </div>
    </fieldset>
  );
}

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

  const regionId = initialProperty?.region_id ?? regions[0]?.id ?? "";
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(
    initialProperty?.lat != null && initialProperty?.lng != null
      ? {
          lat: initialProperty.lat,
          lng: initialProperty.lng,
          address: initialProperty.address,
        }
      : null,
  );
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialProperty?.property_type ?? "apartment",
  );
  const [addressNotes, setAddressNotes] = useState(
    initialProperty?.address_notes ?? "",
  );
  const [bedrooms, setBedrooms] = useState(initialProperty?.bedrooms ?? 1);
  const [maxGuests, setMaxGuests] = useState(
    initialProperty?.max_guests ?? 4,
  );
  const [beds, setBeds] = useState(initialProperty?.beds ?? 0);
  const [toilets, setToilets] = useState(initialProperty?.toilets ?? 0);
  const [bathtubs, setBathtubs] = useState(initialProperty?.bathtubs ?? 0);
  const [pricePerNight, setPricePerNight] = useState(
    initialProperty ? String(initialProperty.price_per_night) : "",
  );
  const [checkinTime, setCheckinTime] = useState(
    initialProperty?.checkin_time ?? "",
  );
  const [checkoutTime, setCheckoutTime] = useState(
    initialProperty?.checkout_time ?? "",
  );
  const [minNights, setMinNights] = useState(
    initialProperty?.min_nights ?? 1,
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
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    initialProperty?.phone_country_code ?? "+1",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    initialProperty?.phone_number ?? "",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setPendingFiles((prev) => {
      const room = Math.max(0, PHOTO_SLOT_COUNT - prev.length);
      const accepted = files
        .slice(0, room)
        .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      return [...prev, ...accepted];
    });
    event.target.value = "";
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 0 && (!location || !location.address)) {
      return t("errorNoLocation");
    }
    if (currentStep === 2 && !pricePerNight) {
      return t("errorPriceRequired");
    }
    if (currentStep === 3 && !phoneNumber) {
      return t("errorPhoneRequired");
    }
    return null;
  }

  // Moving forward requires every step before the target to pass validation,
  // so a required field cleared after going back still blocks progress.
  function goToStep(target: number) {
    if (target <= step) {
      setError(null);
      setStep(target);
      return;
    }
    for (let i = step; i < target; i++) {
      const validationError = validateStep(i);
      if (validationError) {
        setError(validationError);
        setStep(i);
        return;
      }
    }
    setError(null);
    setStep(target);
    setFurthestStep((f) => Math.max(f, target));
  }

  function goNext() {
    goToStep(Math.min(step + 1, LAST_STEP));
  }

  function goBack() {
    goToStep(Math.max(step - 1, 0));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < LAST_STEP) {
      goNext();
      return;
    }

    setError(null);

    for (let i = 0; i < LAST_STEP; i++) {
      const validationError = validateStep(i);
      if (validationError) {
        setError(validationError);
        setStep(i);
        return;
      }
    }

    if (!location || !location.address) {
      setError(t("errorNoLocation"));
      return;
    }

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

      const landmark = regions.find((r) => r.id === regionId);
      const walking =
        landmark?.landmark_lat != null && landmark?.landmark_lng != null
          ? await getWalkingDirections({
              from: { lat: location.lat, lng: location.lng },
              to: { lat: landmark.landmark_lat, lng: landmark.landmark_lng },
            })
          : null;

      await createProperty(supabase, {
        ownerId,
        regionId,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        propertyType,
        addressNotes: addressNotes || null,
        walkingMinutesToLandmark: walking?.minutes ?? null,
        bedrooms,
        beds,
        toilets,
        bathtubs,
        pricePerNight: Number(pricePerNight),
        phoneCountryCode,
        phoneNumber,
        checkinTime: checkinTime || null,
        checkoutTime: checkoutTime || null,
        maxGuests,
        minNights,
        descriptionHe: descriptionHe || null,
        descriptionEn: descriptionEn || null,
        descriptionSourceLang:
          descriptionHe || descriptionEn ? descriptionSourceLang : null,
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
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-serif-brand text-2xl font-bold text-ink">
          {t("successTitle")}
        </h1>
        <p className="text-[15px] leading-7 text-[#5C5349]">
          {t("successBody")}
        </p>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setStep(0);
              setFurthestStep(LAST_STEP);
            }}
            className="rounded-lg border border-ink px-6 py-3 text-sm font-semibold text-ink"
          >
            {t("editAgain")}
          </button>
          <Link
            href="/owner/dashboard"
            className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
          >
            {t("backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl px-4 py-9 sm:px-10"
    >
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-serif-brand text-[28px] font-bold text-ink">
          {t("title")}
        </h1>
        <Link
          href="/owner/dashboard"
          className="text-sm font-semibold text-[#5C5349]"
        >
          {t("exit")}
        </Link>
      </div>
      <p className="mb-7 text-[15px] text-[#5C5349]">{t("subtitle")}</p>

      <div className="mb-9 flex items-start">
        {STEP_KEYS.map((key, i) => {
          const status: StepStatus =
            i === step ? "active" : i <= furthestStep ? "done" : "upcoming";
          const reachable = i <= furthestStep && i !== step;
          return (
            <button
              key={key}
              type="button"
              onClick={() => goToStep(i)}
              disabled={!reachable}
              aria-current={i === step ? "step" : undefined}
              className="flex min-h-11 flex-1 flex-col items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand enabled:cursor-pointer enabled:hover:opacity-80 disabled:cursor-default"
            >
              <div className="flex w-full items-center">
                <span className={lineClass(i - 1 < furthestStep, i === 0)} />
                <span className={circleClass(status)}>
                  {status === "done" ? "✓" : i + 1}
                </span>
                <span
                  className={lineClass(i < furthestStep, i === LAST_STEP)}
                />
              </div>
              <span className={labelClass(status)}>{t(`steps.${key}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#E5DED3] bg-white p-6 sm:p-8">
        {step === 0 && (
          <div className="flex flex-col gap-[22px]">
            <div>
              <h2 className="mb-1 text-xl font-bold text-ink">
                {t("step1Title")}
              </h2>
              <p className="text-sm text-[#5C5349]">{t("step1Subtitle")}</p>
            </div>

            <div className="flex flex-col gap-1.5 text-sm">
              <span className="text-[13px] font-semibold text-[#8A8073]">
                {t("locationLabel")}
              </span>
              <LocationPicker
                initialLat={location?.lat}
                initialLng={location?.lng}
                initialAddress={location?.address}
                onChange={setLocation}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#8A8073]">
                {t("propertyTypeLabel")}
              </label>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setPropertyType("apartment")}
                  className={chipClass(propertyType === "apartment")}
                >
                  {t("propertyTypeApartment")}
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyType("house")}
                  className={chipClass(propertyType === "house")}
                >
                  {t("propertyTypeHouse")}
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyType("basement")}
                  className={chipClass(propertyType === "basement")}
                >
                  {t("propertyTypeBasement")}
                </button>
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[13px] font-semibold text-[#8A8073]">
                {t("addressNotesLabel")}
              </span>
              <textarea
                value={addressNotes}
                onChange={(e) => setAddressNotes(e.target.value)}
                rows={2}
                placeholder={t("addressNotesPlaceholder")}
                className="resize-y rounded-[10px] border border-[#E5DED3] px-3.5 py-3 text-sm text-ink"
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-[26px]">
            <div>
              <h2 className="mb-1 text-xl font-bold text-ink">
                {t("step2Title")}
              </h2>
              <p className="text-sm text-[#5C5349]">{t("step2Subtitle")}</p>
            </div>

            {AMENITY_GROUPS.map((group) => (
              <div key={group.category} className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#5C5349]">
                  {tCategory(group.category)}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.keys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleAmenity(key)}
                      className={amenityChipClass(amenities.has(key))}
                    >
                      {tAmenity(key)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="mb-1 text-xl font-bold text-ink">
                {t("step3Title")}
              </h2>
              <p className="text-sm text-[#5C5349]">{t("step3Subtitle")}</p>
            </div>

            <div className="flex flex-wrap gap-8">
              <Counter
                label={t("roomsLabel")}
                value={bedrooms}
                min={0}
                max={30}
                onChange={setBedrooms}
                decreaseLabel={t("decrease", { label: t("roomsLabel") })}
                increaseLabel={t("increase", { label: t("roomsLabel") })}
              />
              <Counter
                label={t("maxGuestsStepperLabel")}
                value={maxGuests}
                min={1}
                max={20}
                onChange={setMaxGuests}
                decreaseLabel={t("decrease", {
                  label: t("maxGuestsStepperLabel"),
                })}
                increaseLabel={t("increase", {
                  label: t("maxGuestsStepperLabel"),
                })}
              />
            </div>

            <label className="flex max-w-[240px] flex-col gap-1.5 text-sm">
              <span className="text-[13px] font-semibold text-[#8A8073]">
                {t("pricePerNight")}
              </span>
              <div className="flex items-center rounded-[10px] border border-[#E5DED3] px-3.5">
                <span className="text-[15px] font-bold text-[#8A8073]">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(e.target.value)}
                  className="w-full flex-1 border-none bg-transparent px-2 py-3 text-sm text-ink outline-none"
                />
              </div>
            </label>

            <div className="flex flex-wrap gap-8">
              <Counter
                label={tProperty("beds")}
                value={beds}
                min={0}
                max={30}
                onChange={setBeds}
                decreaseLabel={t("decrease", { label: tProperty("beds") })}
                increaseLabel={t("increase", { label: tProperty("beds") })}
              />
              <Counter
                label={tProperty("toilets")}
                value={toilets}
                min={0}
                max={8}
                onChange={setToilets}
                decreaseLabel={t("decrease", { label: tProperty("toilets") })}
                increaseLabel={t("increase", { label: tProperty("toilets") })}
              />
              <Counter
                label={tProperty("bathtubs")}
                value={bathtubs}
                min={0}
                max={8}
                onChange={setBathtubs}
                decreaseLabel={t("decrease", { label: tProperty("bathtubs") })}
                increaseLabel={t("increase", { label: tProperty("bathtubs") })}
              />
              <Counter
                label={tProperty("minNights")}
                value={minNights}
                min={1}
                max={30}
                onChange={setMinNights}
                decreaseLabel={t("decrease", { label: tProperty("minNights") })}
                increaseLabel={t("increase", { label: tProperty("minNights") })}
              />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
              <TimePicker
                label={tProperty("checkin")}
                value={checkinTime}
                presets={CHECKIN_PRESETS}
                otherLabel={t("otherTime")}
                onChange={setCheckinTime}
              />
              <TimePicker
                label={tProperty("checkout")}
                value={checkoutTime}
                presets={CHECKOUT_PRESETS}
                otherLabel={t("otherTime")}
                onChange={setCheckoutTime}
              />
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[13px] font-semibold text-[#8A8073]">
                {t("descriptionLabel")}
              </span>
              <textarea
                value={descriptionHe}
                onChange={(e) => setDescriptionHe(e.target.value)}
                rows={4}
                placeholder={t("descriptionHe")}
                className="resize-y rounded-[10px] border border-[#E5DED3] px-3.5 py-3 text-sm leading-relaxed text-ink"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[13px] font-semibold text-[#8A8073]">
                {t("descriptionEn")}
              </span>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={4}
                className="resize-y rounded-[10px] border border-[#E5DED3] px-3.5 py-3 text-sm leading-relaxed text-ink"
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
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-[26px]">
            <div>
              <h2 className="mb-1 text-xl font-bold text-ink">
                {t("step4Title")}
              </h2>
              <p className="text-sm text-[#5C5349]">{t("step4Subtitle")}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-semibold text-[#8A8073]">
                {t("photosLabel")}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: PHOTO_SLOT_COUNT }).map((_, index) => {
                  const pf = pendingFiles[index];
                  const isMain = index === 0;
                  return (
                    <div
                      key={index}
                      onClick={() =>
                        !pf && fileInputRef.current?.click()
                      }
                      className={`relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed ${
                        pf
                          ? "border-[#E5DED3]"
                          : isMain
                            ? "border-brand text-brand"
                            : "border-[#E5DED3] text-[#8A8073]"
                      } ${!pf ? "cursor-pointer" : ""}`}
                    >
                      {pf ? (
                        <>
                          {pf.file.type.startsWith("video/") ? (
                            <video
                              src={pf.previewUrl}
                              className="h-full w-full rounded-[10px] object-cover"
                              muted
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pf.previewUrl}
                              alt=""
                              className="h-full w-full rounded-[10px] object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute end-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                          >
                            {t("removeMedia")}
                          </button>
                        </>
                      ) : (
                        <>
                          <svg
                            width={isMain ? 22 : 20}
                            height={isMain ? 22 : 20}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          <span
                            className={`text-center ${isMain ? "text-[11.5px] font-bold" : "text-[11px]"}`}
                          >
                            {isMain ? (
                              <>
                                {t("mainPhotoLabel")}
                                <br />
                                {t("mainPhotoRequired")}
                              </>
                            ) : (
                              t("additionalPhotoLabel")
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[13px] font-semibold text-[#8A8073]">
                {t("whatsappLabel")}
              </span>
              <div className="flex items-center gap-2 rounded-[10px] border border-[#E5DED3] px-3.5">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  className="shrink-0 text-accent-whatsapp"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4.3 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" />
                </svg>
                <input
                  type="text"
                  dir="ltr"
                  required
                  placeholder="+1"
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className="w-14 shrink-0 border-e border-[#E5DED3] bg-transparent py-3 pe-2 text-sm text-ink outline-none"
                />
                <input
                  type="tel"
                  dir="ltr"
                  required
                  placeholder="050-1234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 border-none bg-transparent py-3 text-sm text-ink outline-none"
                />
              </div>
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-[22px]">
            <div>
              <h2 className="mb-1 text-xl font-bold text-ink">
                {t("step5Title")}
              </h2>
              <p className="text-sm text-[#5C5349]">{t("step5Subtitle")}</p>
            </div>
            <div className="flex flex-col gap-3.5 rounded-xl border border-[#E5DED3] bg-background p-5">
              <div className="flex justify-between text-sm">
                <span className="text-[#8A8073]">
                  {t("summaryAddressLabel")}
                </span>
                <span className="font-semibold text-ink">
                  {location?.address || t("summaryNoAddress")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8A8073]">
                  {t("summaryRoomsGuestsLabel")}
                </span>
                <span className="font-semibold text-ink">
                  {t("summaryRoomsGuestsValue", {
                    rooms: bedrooms,
                    guests: maxGuests,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8A8073]">
                  {t("summaryAmenitiesLabel")}
                </span>
                <span className="font-semibold text-ink">
                  {t("summaryAmenitiesValue", { count: amenities.size })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8A8073]">
                  {t("summaryPhotosLabel")}
                </span>
                <span className="font-semibold text-ink">
                  {t("summaryPhotosValue", { count: pendingFiles.length })}
                </span>
              </div>
            </div>
            <p className="text-[13px] text-[#8A8073]">{t("summaryNote")}</p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex items-center justify-between border-t border-[#E5DED3] pt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className={`rounded-lg border border-[#E5DED3] px-6 py-3 text-sm font-semibold text-ink ${step === 0 ? "invisible" : ""}`}
          >
            {t("back")}
          </button>
          <button
            type="submit"
            disabled={uploading || submitting}
            className="rounded-lg bg-brand px-7 py-3 text-[15px] font-bold text-brand-foreground disabled:opacity-60"
          >
            {uploading
              ? t("uploading")
              : submitting
                ? t("submitting")
                : step === LAST_STEP
                  ? t("submitForApproval")
                  : t("continue")}
          </button>
        </div>
      </div>
    </form>
  );
}
