import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAdminPropertyById } from "@/lib/properties";
import { AMENITY_GROUPS } from "@/lib/amenities";
import { primaryDescription } from "@/lib/description";
import { updatePropertyAsAdmin } from "../../../edit-actions";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMediaEditor from "@/components/admin/AdminMediaEditor";
import PendingSubmitButton from "@/components/admin/PendingSubmitButton";
import he from "../../../../../../messages/he.json";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  address: "יש להזין כתובת.",
  price: "יש להזין מחיר ללילה גדול מאפס.",
  phone: "יש להזין קידומת ומספר טלפון.",
  numbers: "אחד משדות המספרים לא תקין (חדרים, מיטות, אורחים או לילות).",
  generic: "משהו השתבש בשמירה. נסה שוב.",
};

const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: he.propertyForm.propertyTypeApartment },
  { value: "house", label: he.propertyForm.propertyTypeHouse },
  { value: "basement", label: he.propertyForm.propertyTypeBasement },
] as const;

const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-white px-3 text-base text-ink transition-colors focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/25";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminEditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminSupabaseClient();
  const property = await getAdminPropertyById(supabase, id);

  if (!property) {
    notFound();
  }

  const initialDescription = primaryDescription(property);

  const detailHref = `/admin/properties/${property.id}`;
  const selectedAmenities = new Set(
    property.property_amenities.map((a) => a.amenity_key),
  );
  const media = [...property.property_photos]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({ url: p.url, mediaType: p.media_type }));

  const numberFields = [
    { name: "bedrooms", label: he.property.bedrooms, value: property.bedrooms, min: 0, max: 30 },
    { name: "beds", label: he.property.beds, value: property.beds, min: 0, max: 30 },
    { name: "toilets", label: he.property.toilets, value: property.toilets, min: 0, max: 30 },
    { name: "bathtubs", label: he.property.bathtubs, value: property.bathtubs, min: 0, max: 30 },
    { name: "maxGuests", label: he.property.maxGuests, value: property.max_guests, min: 1, max: 99 },
    { name: "minNights", label: he.property.minNights, value: property.min_nights, min: 1, max: 365 },
  ];

  return (
    <div className="min-h-dvh bg-canvas">
      <AdminHeader />

      <form action={updatePropertyAsAdmin.bind(null, property.id)}>
        <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pt-8">
          <Link
            href={detailHref}
            className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            → חזרה לדירה
          </Link>
          <h1 className="mt-1 font-serif-brand text-2xl font-bold text-ink sm:text-[32px]">
            עריכת דירה
          </h1>
          <p className="mt-1 break-words text-[15px] text-ink-soft">
            <bdi>{property.address}</bdi>
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-600/25 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.generic}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-5">
            <Section
              title="כתובת וסוג הדירה"
              description="שינוי כתובת מעדכן אוטומטית את המיקום במפה ואת זמן ההליכה."
            >
              <div className="flex flex-col gap-4">
                <Field label={he.propertyForm.address} htmlFor="address">
                  <input
                    id="address"
                    name="address"
                    defaultValue={property.address}
                    required
                    dir="auto"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label={he.propertyForm.addressNotesLabel}
                  htmlFor="addressNotes"
                >
                  <input
                    id="addressNotes"
                    name="addressNotes"
                    defaultValue={property.address_notes ?? ""}
                    placeholder={he.propertyForm.addressNotesPlaceholder}
                    dir="auto"
                    className={inputClass}
                  />
                </Field>
                <fieldset>
                  <legend className="text-sm font-semibold text-ink">
                    {he.propertyForm.propertyTypeLabel}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="propertyType"
                          value={option.value}
                          defaultChecked={property.property_type === option.value}
                          className="peer sr-only"
                        />
                        <span className="flex min-h-11 items-center rounded-full border border-line bg-white px-[18px] text-[13.5px] font-semibold text-ink transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </Section>

            <Section title="פרטים ומחיר">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label={he.propertyForm.pricePerNight} htmlFor="pricePerNight">
                  <input
                    id="pricePerNight"
                    name="pricePerNight"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="any"
                    required
                    defaultValue={property.price_per_night}
                    className={inputClass}
                  />
                </Field>
                {numberFields.map((field) => (
                  <Field key={field.name} label={field.label} htmlFor={field.name}>
                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      inputMode="numeric"
                      min={field.min}
                      max={field.max}
                      step="1"
                      defaultValue={field.value ?? ""}
                      className={inputClass}
                    />
                  </Field>
                ))}
                <Field label={he.property.checkin} htmlFor="checkinTime">
                  <input
                    id="checkinTime"
                    name="checkinTime"
                    type="time"
                    defaultValue={property.checkin_time?.slice(0, 5) ?? ""}
                    className={inputClass}
                  />
                </Field>
                <Field label={he.property.checkout} htmlFor="checkoutTime">
                  <input
                    id="checkoutTime"
                    name="checkoutTime"
                    type="time"
                    defaultValue={property.checkout_time?.slice(0, 5) ?? ""}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            <Section title="יצירת קשר" description="המספר שאליו השוכרים פונים בוואטסאפ.">
              <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                <Field label={he.propertyForm.phoneCountryCode} htmlFor="phoneCountryCode">
                  <input
                    id="phoneCountryCode"
                    name="phoneCountryCode"
                    defaultValue={property.phone_country_code}
                    required
                    dir="ltr"
                    inputMode="tel"
                    className={inputClass}
                  />
                </Field>
                <Field label={he.propertyForm.phoneNumber} htmlFor="phoneNumber">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    defaultValue={property.phone_number}
                    required
                    dir="ltr"
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            <Section title={he.property.aboutTitle}>
              <div className="flex flex-col gap-4">
                <Field label={he.propertyForm.descriptionLabel} htmlFor="description">
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    dir={initialDescription ? "auto" : undefined}
                    placeholder={he.propertyForm.descriptionPlaceholder}
                    defaultValue={initialDescription}
                    className={`${inputClass} py-2.5 leading-7`}
                  />
                </Field>
                <input
                  type="hidden"
                  name="descriptionOriginal"
                  value={initialDescription}
                />
              </div>
            </Section>

            <Section title={he.property.amenitiesTitle}>
              <div className="flex flex-col gap-5">
                {AMENITY_GROUPS.map((group) => (
                  <fieldset key={group.category}>
                    <legend className="text-sm font-semibold text-ink-soft">
                      {he.amenityCategories[group.category]}
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.keys.map((key) => (
                        <label key={key} className="cursor-pointer">
                          <input
                            type="checkbox"
                            name="amenities"
                            value={key}
                            defaultChecked={selectedAmenities.has(key)}
                            className="peer sr-only"
                          />
                          <span className="flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-[13.5px] font-semibold text-ink transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                            {he.amenities[key as keyof typeof he.amenities] ?? key}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </Section>

            <Section title={he.propertyForm.photosLabel}>
              <AdminMediaEditor initial={media} />
            </Section>
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white/95 backdrop-blur [padding-bottom:env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link
              href={detailHref}
              className="flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              ביטול
            </Link>
            <PendingSubmitButton
              pendingLabel="שומר…"
              className="min-h-11 cursor-pointer rounded-lg bg-brand px-6 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              שמור שינויים
            </PendingSubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
