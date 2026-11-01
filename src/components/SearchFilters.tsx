"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  AMENITY_FILTERS,
  PRICE_OPTIONS,
  ROOM_OPTIONS,
  EMPTY_FILTERS,
  activeFilterCount,
  applyResultFilters,
  type ResultFilters,
} from "@/lib/searchFilters";

const DISTANCE_OPTIONS: { key: string; minutes: number | null }[] = [
  { key: "all", minutes: null },
  { key: "5", minutes: 5 },
  { key: "10", minutes: 10 },
  { key: "15", minutes: 15 },
];

function chipClass(active: boolean): string {
  return `flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
    active
      ? "border-brand bg-brand text-brand-foreground"
      : "border-line text-ink [@media(hover:hover)]:hover:border-ink"
  }`;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ---------- Choice groups, shared by the desktop popovers and the sheet ---------- */

function PriceChoices({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const t = useTranslations("home");
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("priceTitle")}>
      {[null, ...PRICE_OPTIONS].map((price) => (
        <button
          key={price ?? "any"}
          type="button"
          role="radio"
          aria-checked={value === price}
          onClick={() => onChange(price)}
          className={chipClass(value === price)}
        >
          {price == null ? t("filterAnyPrice") : t("filterPriceUpTo", { price })}
        </button>
      ))}
    </div>
  );
}

function RoomChoices({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const t = useTranslations("home");
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("roomsTitle")}>
      {[null, ...ROOM_OPTIONS].map((rooms) => (
        <button
          key={rooms ?? "any"}
          type="button"
          role="radio"
          aria-checked={value === rooms}
          onClick={() => onChange(rooms)}
          className={chipClass(value === rooms)}
        >
          {rooms == null ? t("filterAnyRooms") : t("filterRoomsMin", { count: rooms })}
        </button>
      ))}
    </div>
  );
}

function AmenityChoices({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const tAmenity = useTranslations("amenities");
  return (
    <div className="flex flex-wrap gap-2">
      {AMENITY_FILTERS.map((option) => {
        const checked = value.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={checked}
            onClick={() =>
              onChange(
                checked
                  ? value.filter((id) => id !== option.id)
                  : [...value, option.id],
              )
            }
            className={chipClass(checked)}
          >
            {checked && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
            )}
            {tAmenity(option.labelKey ?? option.keys[0])}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Desktop: one popover per filter ---------- */

function FilterPopover({
  label,
  active,
  children,
  footer,
  onOpen,
}: {
  label: ReactNode;
  active: boolean;
  onOpen?: () => void;
  children: (close: () => void) => ReactNode;
  footer?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) onOpen?.();
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-controls={panelId}
        className={chipClass(active)}
      >
        {label}
        <Chevron open={open} />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute start-0 top-full z-30 mt-2 flex w-[340px] origin-top flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_32px_rgba(26,21,18,0.14)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-[0.97] starting:opacity-0"
        >
          {children(close)}
          {footer?.(close)}
        </div>
      )}
    </div>
  );
}

/* ---------- Mobile: everything in one bottom sheet ---------- */

function setPageScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

function FiltersSheet({
  filters,
  onApply,
}: {
  filters: ResultFilters;
  onApply: (filters: ResultFilters) => void;
}) {
  const t = useTranslations("home");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [draft, setDraft] = useState(filters);
  const count = activeFilterCount(filters);

  useEffect(() => () => setPageScrollLocked(false), []);

  function open() {
    setDraft(filters);
    setPageScrollLocked(true);
    dialogRef.current?.showModal();
  }
  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className={chipClass(count > 0)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        {t("filtersButton")}
        {count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-brand">
            {count}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setPageScrollLocked(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-ink translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-black/40 starting:translate-y-full motion-reduce:transition-opacity motion-reduce:starting:translate-y-0 motion-reduce:starting:opacity-0"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex shrink-0 flex-col gap-2 px-4 pt-3">
            <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-lg font-bold">
                {t("filtersTitle")}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={t("filtersClose")}
                className="-me-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-canvas"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 pt-2 pb-4">
            <section className="flex flex-col gap-3">
              <h3 className="text-[15px] font-bold">{t("priceTitle")}</h3>
              <PriceChoices
                value={draft.maxPrice}
                onChange={(maxPrice) => setDraft({ ...draft, maxPrice })}
              />
            </section>
            <section className="flex flex-col gap-3">
              <h3 className="text-[15px] font-bold">{t("roomsTitle")}</h3>
              <RoomChoices
                value={draft.minRooms}
                onChange={(minRooms) => setDraft({ ...draft, minRooms })}
              />
            </section>
            <section className="flex flex-col gap-3">
              <h3 className="text-[15px] font-bold">{t("amenitiesTitle")}</h3>
              <AmenityChoices
                value={draft.amenities}
                onChange={(amenities) => setDraft({ ...draft, amenities })}
              />
            </section>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setDraft({ ...EMPTY_FILTERS, sort: draft.sort })}
              className="py-2 text-[15px] font-semibold underline underline-offset-4"
            >
              {t("filtersClearAll")}
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draft);
                close();
              }}
              className="flex min-h-12 items-center justify-center rounded-[10px] bg-brand px-6 text-base font-bold text-brand-foreground"
            >
              {t("filtersShowResults")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/* ---------- The filter bar ---------- */

export default function SearchFilters({
  region,
  checkin,
  checkout,
  guests,
  activeMaxWalking,
  filters,
}: {
  region: string;
  checkin?: string;
  checkout?: string;
  guests: number;
  activeMaxWalking: number | null;
  filters: ResultFilters;
}) {
  const t = useTranslations("home");
  const router = useRouter();
  const [amenityDraft, setAmenityDraft] = useState(filters.amenities);

  function navigate(next: { maxWalking?: number | null; filters?: ResultFilters }) {
    const base = new URLSearchParams({ region, guests: String(guests) });
    if (checkin) base.set("checkin", checkin);
    if (checkout) base.set("checkout", checkout);
    const maxWalking =
      next.maxWalking !== undefined ? next.maxWalking : activeMaxWalking;
    if (maxWalking != null) base.set("maxWalking", String(maxWalking));
    const params = applyResultFilters(base, next.filters ?? filters);
    router.push(`/?${params.toString()}`, { scroll: false });
  }

  const setFilters = (patch: Partial<ResultFilters>) =>
    navigate({ filters: { ...filters, ...patch } });

  const count = activeFilterCount(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <span className="w-full shrink-0 text-sm font-semibold text-ink-soft sm:w-auto">
          {t("distanceLabel")}
        </span>
        {DISTANCE_OPTIONS.map((option) => {
          const active =
            option.minutes == null
              ? activeMaxWalking == null
              : activeMaxWalking === option.minutes;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => navigate({ maxWalking: option.minutes })}
              aria-pressed={active}
              className={chipClass(active)}
            >
              {t(option.key === "all" ? "distanceAll" : `distanceUpTo${option.key}`)}
            </button>
          );
        })}
      </div>

      {/* Mobile: a single "Filters" button opening the sheet */}
      <div className="sm:hidden">
        <FiltersSheet
          filters={filters}
          onApply={(next) => navigate({ filters: next })}
        />
      </div>

      {/* Desktop: one popover per filter */}
      <div className="hidden flex-wrap items-center gap-2.5 sm:flex">
        <FilterPopover
          active={filters.maxPrice != null}
          label={
            filters.maxPrice != null
              ? t("filterPriceUpTo", { price: filters.maxPrice })
              : t("filterPrice")
          }
        >
          {(close) => (
            <>
              <h3 className="text-[15px] font-bold text-ink">{t("priceTitle")}</h3>
              <PriceChoices
                value={filters.maxPrice}
                onChange={(maxPrice) => {
                  close();
                  setFilters({ maxPrice });
                }}
              />
            </>
          )}
        </FilterPopover>

        <FilterPopover
          active={filters.minRooms != null}
          label={
            filters.minRooms != null
              ? t("filterRoomsMin", { count: filters.minRooms })
              : t("filterRooms")
          }
        >
          {(close) => (
            <>
              <h3 className="text-[15px] font-bold text-ink">{t("roomsTitle")}</h3>
              <RoomChoices
                value={filters.minRooms}
                onChange={(minRooms) => {
                  close();
                  setFilters({ minRooms });
                }}
              />
            </>
          )}
        </FilterPopover>

        <FilterPopover
          active={filters.amenities.length > 0}
          onOpen={() => setAmenityDraft(filters.amenities)}
          label={
            filters.amenities.length > 0
              ? t("filterAmenitiesCount", { count: filters.amenities.length })
              : t("filterAmenities")
          }
          footer={(close) => (
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setAmenityDraft([])}
                className="py-2 text-sm font-semibold text-ink underline underline-offset-4"
              >
                {t("filterClear")}
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  setFilters({ amenities: amenityDraft });
                }}
                className="flex min-h-10 items-center rounded-[10px] bg-brand px-5 text-sm font-bold text-brand-foreground"
              >
                {t("filterApply")}
              </button>
            </div>
          )}
        >
          {() => (
            <>
              <h3 className="text-[15px] font-bold text-ink">{t("amenitiesTitle")}</h3>
              <AmenityChoices value={amenityDraft} onChange={setAmenityDraft} />
            </>
          )}
        </FilterPopover>

        {count > 0 && (
          <button
            type="button"
            onClick={() => {
              setAmenityDraft([]);
              navigate({ filters: { ...EMPTY_FILTERS, sort: filters.sort } });
            }}
            className="min-h-10 px-2 text-sm font-semibold text-ink underline underline-offset-4"
          >
            {t("filtersClearAll")}
          </button>
        )}
      </div>
    </div>
  );
}
