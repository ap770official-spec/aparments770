// Apartments770 brand logo, drawn as inline SVG from the master artwork
// (2000×1550 canvas). Inline so it stays crisp at any size, costs no extra
// request, and takes its colour from `currentColor`.

const STROKE_THICK = 26;
const STROKE_THIN = 15;

// Outer walls and the three gables.
const OUTLINE =
  "M437 1050V375L662 99 887 375 1000 236 1112 375 1337 99 1562 375V1050";
const GROUND = "M311.5 1125H1688.5";
const DETAILS = [
  // Inner gable lines
  "M493 375 662 170.5 831 375M1168 375 1337 170.5 1506 375",
  // Centre pilasters and spire
  "M887 285V1050M1112 285V1050M1000 179.5V236",
  // Attic windows
  "M624.5 262h75v75h-75zM662 262v75M1299.5 262h75v75h-75zM1337 262v75",
  // Upper windows
  "M524.5 449.5h275v150h-275zM593 449.5v150M662 449.5v150M730.5 449.5v150",
  "M1199.5 449.5h275v150h-275zM1268 449.5v150M1337 449.5v150M1405.5 449.5v150",
  // Lower windows
  "M499.5 699.5h325v225h-325zM499.5 775h325M581 699.5v225M662 699.5v225M743 699.5v225",
  "M1174.5 699.5h325v225h-325zM1174.5 775h325M1256 699.5v225M1337 699.5v225M1418 699.5v225",
  // Bay window
  "M927.5 462 1000 400 1071.5 462ZM927.5 462v175h144v-175M927.5 637h144M976 462v175M1023 462v175M927.5 637 966 712h68l37.5-75",
  // Door and steps
  "M921 1050V818h156.5v232M949.5 1050V850h100v200M1000 850v200",
  "M924.5 1075h149M899.5 1100h199",
].join("");

// "770" set in DejaVu Serif Bold, outlined so it never depends on a web font.
const NUMERALS =
  "M855 1256.2 773.3 1428H746.3L825.9 1260.2H728.2V1288.2H710V1221H855Z" +
  "M1072 1256.2 989.7 1428H962.6L1042.7 1260.2H944.3V1288.2H926V1221H1072Z" +
  "M1216.1 1412.4Q1232 1412.4 1237.9 1397.8Q1243.9 1383.2 1243.9 1324.6Q1243.9 1266.3 1237.9 1251.5Q1232 1236.6 1216.1 1236.6Q1200.1 1236.6 1194.2 1251.2Q1188.3 1265.8 1188.3 1324.6Q1188.3 1383.2 1194.2 1397.8Q1200.1 1412.4 1216.1 1412.4Z" +
  "M1216.1 1428Q1176.3 1428 1155.1 1401.3Q1134 1374.7 1134 1324.6Q1134 1274.5 1155.1 1247.7Q1176.3 1221 1216.1 1221Q1255.7 1221 1276.9 1247.7Q1298 1274.5 1298 1324.6Q1298 1374.7 1276.9 1401.3Q1255.7 1428 1216.1 1428Z";

type LogoMarkProps = {
  className?: string;
  /** Show the "770" numerals under the ground line. */
  withNumerals?: boolean;
  /** Accessible name. Omit when the mark sits next to visible brand text. */
  title?: string;
  /**
   * Stroke weight multiplier. The master strokes are tuned for large renders;
   * at header/footer sizes (~40–60px tall) bump this so the lines don't fade.
   */
  weight?: number;
};

/** The building mark, optionally with "770" beneath it. */
export function LogoMark({
  className,
  withNumerals = false,
  title,
  weight = 1,
}: LogoMarkProps) {
  return (
    <svg
      viewBox={withNumerals ? "290 78 1420 1366" : "290 78 1420 1068"}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={OUTLINE} strokeWidth={STROKE_THICK * weight} />
      <path d={GROUND} strokeWidth={(STROKE_THICK - 3) * weight} />
      <path d={DETAILS} strokeWidth={STROKE_THIN * weight} />
      {withNumerals && <path d={NUMERALS} fill="currentColor" stroke="none" />}
    </svg>
  );
}

/** The "apartments770" wordmark, as live text in the brand serif. */
export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <span dir="ltr" className={`font-serif-brand leading-none ${className}`}>
      apartments<span className="font-bold">770</span>
    </span>
  );
}

/**
 * Horizontal lockup: mark | apartments770.
 * Kept left-to-right in both locales, like any fixed piece of brand artwork.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span dir="ltr" className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <LogoMark weight={1.6} className="h-8 w-auto shrink-0 sm:h-10" />
      <span aria-hidden="true" className="hidden h-7 w-px bg-current opacity-25 sm:block" />
      <LogoWordmark className="text-[1.0625rem] sm:text-xl" />
    </span>
  );
}
