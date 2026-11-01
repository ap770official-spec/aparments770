"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  saveOwnerProfile,
  type OwnerProfileField,
  type OwnerProfileFormState,
} from "@/app/[locale]/owner/actions";
import { OWNER_ROLES, REFERRAL_SOURCES } from "@/lib/owners";
import type { CountryDialOption } from "@/lib/countries";

const inputClass =
  "min-h-12 rounded-[10px] border bg-white px-3.5 text-base text-ink transition-colors duration-150 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/40 aria-invalid:border-[#9B2C2C]";

function chipClass(active: boolean): string {
  return `inline-flex min-h-11 cursor-pointer items-center rounded-full border px-[18px] text-[14px] font-semibold transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${
    active
      ? "border-brand bg-brand text-brand-foreground"
      : "border-[#E5DED3] bg-white text-ink hover:border-[#A89E90]"
  }`;
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#9B2C2C]">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      {message}
    </p>
  );
}

function SubmitButton({ label }: { label: string }) {
  const t = useTranslations("ownerProfile");
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand px-7 text-[15px] font-bold text-brand-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 sm:w-auto"
    >
      {pending ? t("saving") : label}
    </button>
  );
}

const FIELD_ORDER: OwnerProfileField[] = [
  "firstName",
  "lastName",
  "phone",
  "ownerRole",
  "terms",
];

export default function OwnerProfileForm({
  locale,
  next,
  isEdit,
  countries,
  initial,
  termsAccepted,
}: {
  locale: string;
  next: string;
  isEdit: boolean;
  countries: { pinned: CountryDialOption[]; others: CountryDialOption[] };
  initial: {
    firstName: string;
    lastName: string;
    country: string;
    phoneNumber: string;
    ownerRole: string;
    referralSource: string;
    referralOther: string;
  };
  termsAccepted: boolean;
}) {
  const t = useTranslations("ownerProfile");
  const [state, formAction] = useActionState<OwnerProfileFormState, FormData>(
    saveOwnerProfile,
    { errors: {} },
  );

  // Controlled, since React resets uncontrolled fields after a form
  // action - which would wipe what was typed when validation fails.
  const [values, setValues] = useState(initial);
  const [termsChecked, setTermsChecked] = useState(false);
  const set = (key: keyof typeof initial) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const first = FIELD_ORDER.find((field) => state.errors[field]);
    if (!first) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[data-field="${first}"]`)
      ?.focus();
  }, [state]);

  const errorProps = (field: OwnerProfileField) =>
    state.errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` }
      : {};

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-6 rounded-2xl border border-[#E5DED3] bg-white p-6 sm:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />

      <p className="text-[13px] text-[#8A8073]">{t("requiredHint")}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-[13px] font-semibold text-[#5C5349]">
            {t("firstName")} <span aria-hidden="true" className="text-[#9B2C2C]">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            data-field="firstName"
            autoComplete="given-name"
            required
            value={values.firstName}
            onChange={(e) => set("firstName")(e.target.value)}
            className={`${inputClass} w-full border-[#E5DED3]`}
            {...errorProps("firstName")}
          />
          {state.errors.firstName && (
            <FieldError id="firstName-error" message={t("errorFirstName")} />
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-[13px] font-semibold text-[#5C5349]">
            {t("lastName")} <span aria-hidden="true" className="text-[#9B2C2C]">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            data-field="lastName"
            autoComplete="family-name"
            required
            value={values.lastName}
            onChange={(e) => set("lastName")(e.target.value)}
            className={`${inputClass} w-full border-[#E5DED3]`}
            {...errorProps("lastName")}
          />
          {state.errors.lastName && (
            <FieldError id="lastName-error" message={t("errorLastName")} />
          )}
        </div>
      </div>

      <div>
        <label htmlFor="phoneNumber" className="mb-1.5 block text-[13px] font-semibold text-[#5C5349]">
          {t("phone")} <span aria-hidden="true" className="text-[#9B2C2C]">*</span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="country" className="sr-only">
            {t("countryCode")}
          </label>
          <select
            id="country"
            name="country"
            value={values.country}
            onChange={(e) => set("country")(e.target.value)}
            className={`${inputClass} w-full shrink-0 cursor-pointer border-[#E5DED3] px-2.5 sm:w-52`}
          >
            <optgroup label={t("countryCommon")}>
              {countries.pinned.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("countryAll")}>
              {countries.others.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          </select>
          <input
            id="phoneNumber"
            name="phoneNumber"
            dir="ltr"
            data-field="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            placeholder="718-555-0123"
            value={values.phoneNumber}
            onChange={(e) => set("phoneNumber")(e.target.value)}
            className={`${inputClass} min-w-0 flex-1 border-[#E5DED3] text-start`}
            {...errorProps("phone")}
            aria-describedby={state.errors.phone ? "phone-error" : "phone-hint"}
          />
        </div>
        {state.errors.phone ? (
          <FieldError id="phone-error" message={t("errorPhone")} />
        ) : (
          <p id="phone-hint" className="mt-1.5 text-[13px] text-[#8A8073]">
            {t("phoneHint")}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-[#5C5349]">
          {t("ownerRole")} <span aria-hidden="true" className="text-[#9B2C2C]">*</span>
        </legend>
        <div
          className="flex flex-wrap gap-2.5"
          {...(state.errors.ownerRole ? { "aria-describedby": "ownerRole-error" } : {})}
        >
          {OWNER_ROLES.map((role, index) => (
            <label key={role} className={chipClass(values.ownerRole === role)}>
              <input
                type="radio"
                name="ownerRole"
                value={role}
                checked={values.ownerRole === role}
                onChange={() => set("ownerRole")(role)}
                className="sr-only"
                {...(index === 0 ? { "data-field": "ownerRole" } : {})}
                {...(state.errors.ownerRole ? { "aria-invalid": true as const } : {})}
              />
              {t(`roles.${role}`)}
            </label>
          ))}
        </div>
        {state.errors.ownerRole && (
          <FieldError id="ownerRole-error" message={t("errorOwnerRole")} />
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-[#5C5349]">
          {t("referralSource")}{" "}
          <span className="font-normal text-[#8A8073]">({t("optional")})</span>
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {REFERRAL_SOURCES.map((source) => (
            <label
              key={source}
              className={chipClass(values.referralSource === source)}
            >
              <input
                type="radio"
                name="referralSource"
                value={source}
                checked={values.referralSource === source}
                onChange={() => set("referralSource")(source)}
                className="sr-only"
              />
              {t(`sources.${source}`)}
            </label>
          ))}
        </div>
        {values.referralSource === "other" && (
          <div className="mt-3">
            <label htmlFor="referralOther" className="sr-only">
              {t("referralOtherLabel")}
            </label>
            <input
              id="referralOther"
              name="referralOther"
              maxLength={200}
              placeholder={t("referralOtherLabel")}
              value={values.referralOther}
              onChange={(e) => set("referralOther")(e.target.value)}
              className={`${inputClass} w-full border-[#E5DED3]`}
            />
          </div>
        )}
      </fieldset>

      {!termsAccepted && (
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[14px] text-ink">
            <input
              type="checkbox"
              name="terms"
              data-field="terms"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand"
              {...errorProps("terms")}
            />
            <span>
              {t.rich("terms", {
                link: (chunks) => (
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-semibold text-brand underline underline-offset-2"
                  >
                    {chunks}
                  </Link>
                ),
              })}{" "}
              <span aria-hidden="true" className="text-[#9B2C2C]">*</span>
            </span>
          </label>
          {state.errors.terms && (
            <FieldError id="terms-error" message={t("errorTerms")} />
          )}
        </div>
      )}

      {state.saveFailed && (
        <p role="alert" className="rounded-lg bg-[#FBEAEA] px-3.5 py-3 text-sm font-medium text-[#9B2C2C]">
          {t("errorSave")}
        </p>
      )}

      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[#E5DED3] pt-6 sm:flex-row sm:items-center sm:justify-between">
        {isEdit ? (
          <Link
            href="/owner/dashboard"
            className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#5C5349] hover:text-ink"
          >
            {t("cancel")}
          </Link>
        ) : (
          <span />
        )}
        <SubmitButton label={isEdit ? t("save") : t("continue")} />
      </div>
    </form>
  );
}
