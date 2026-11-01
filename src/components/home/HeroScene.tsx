import type { CSSProperties } from "react";
import HeroDepth from "./HeroDepth";

// Homepage hero backdrop: the brand building as part of the page, not a
// picture on it. From xl up it stands in the empty space beside the
// search (the start side of the text: left in Hebrew, right in English),
// on the ground line that closes the hero, with a far row of townhouses
// behind it and a street lamp in front for depth. Below xl it becomes a
// faint silhouette in the top corner behind the headline.
//
// On load the building draws itself in (CSS, see "Homepage hero" in
// globals.css); HeroDepth then drifts the layers with pointer and scroll.

const BRAND = "#6e4e37";
const GOLD = "#c8a97e";

// Same geometry as the logo mark (src/components/brand/Logo.tsx); walls run
// down to the ground line (y 1125, the bottom edge of the viewBox).
const VIEWBOX = "400 70 1200 1055";
const WINGS = [
  "M437 1125V375L662 99 887 375V1125Z",
  "M887 1125V375L1000 236 1112 375V1125Z",
  "M1112 1125V375L1337 99 1562 375V1125Z",
];
const OUTLINE =
  "M437 1135V375L662 99 887 375 1000 236 1112 375 1337 99 1562 375V1135";
const PILASTERS = "M887 285V1135M1112 285V1135M1000 179.5V236";

// Glass panes, in the order they light up.
const PANES: [number, number, number, number][] = [
  [624.5, 262, 75, 75],
  [1299.5, 262, 75, 75],
  [524.5, 449.5, 275, 150],
  [1199.5, 449.5, 275, 150],
  [927.5, 462, 144, 175],
  [499.5, 699.5, 325, 225],
  [1174.5, 699.5, 325, 225],
];

const GOLD_LINES = [
  "M493 375 662 170.5 831 375M1168 375 1337 170.5 1506 375",
  "M624.5 262h75v75h-75zM662 262v75M1299.5 262h75v75h-75zM1337 262v75",
  "M524.5 449.5h275v150h-275zM593 449.5v150M662 449.5v150M730.5 449.5v150",
  "M1199.5 449.5h275v150h-275zM1268 449.5v150M1337 449.5v150M1405.5 449.5v150",
  "M499.5 699.5h325v225h-325zM499.5 775h325M581 699.5v225M662 699.5v225M743 699.5v225",
  "M1174.5 699.5h325v225h-325zM1174.5 775h325M1256 699.5v225M1337 699.5v225M1418 699.5v225",
  "M927.5 462v175h144v-175zM976 462v175M1023 462v175M927.5 637 966 712h68l37.5-75",
  "M921 1050V818h156.5v232",
  "M924.5 1075h149M899.5 1100h199",
];

// A loose row of Crown Heights rooflines, drawn far behind the building.
const SKYLINE =
  "M0 1125V735L95 645L190 735V725H235V655H258V725H340V605H490V735L610 645L730 735V655L835 565L940 655V605L1015 515L1090 605V725H1162V655H1198V725H1330V695H1570V725H1633V655H1664V725H1780V545H1825V475H1848V545H1930V655L2025 565L2120 655V605L2195 515L2270 605V695H2440V1125Z";

function delay(seconds: number): CSSProperties {
  return { "--hero-delay": `${seconds}s` } as CSSProperties;
}

function Building() {
  return (
    <svg
      viewBox={VIEWBOX}
      className="block h-auto w-full overflow-visible"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="hero-wall"
          gradientUnits="userSpaceOnUse"
          x1="437"
          y1="99"
          x2="1562"
          y2="1125"
        >
          <stop offset="0" stopColor="#8e3b38" />
          <stop offset="1" stopColor="#722d2c" />
        </linearGradient>
        <linearGradient id="hero-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf6ec" />
          <stop offset="1" stopColor="#ecdcbf" />
        </linearGradient>
      </defs>

      <g className="hero-fill hero-fade" style={delay(1)} fill="url(#hero-wall)">
        {WINGS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <g className="hero-fill" fill="url(#hero-glass)">
        {PANES.map(([x, y, w, h], i) => (
          <rect
            key={i}
            className="hero-light"
            style={delay(1.4 + i * 0.07)}
            x={x}
            y={y}
            width={w}
            height={h}
          />
        ))}
      </g>

      <g className="hero-fill hero-fade" style={delay(1.6)} fill={BRAND}>
        <path d="M927.5 462 1000 400 1071.5 462Z" />
        <rect x="949.5" y="850" width="100" height="200" />
      </g>

      <g className="hero-gold" stroke={GOLD} strokeWidth="13">
        {GOLD_LINES.map((d, i) => (
          <path
            key={d}
            className="hero-draw"
            style={delay(1.05 + i * 0.05)}
            d={d}
            pathLength={1}
          />
        ))}
      </g>

      <g stroke={BRAND}>
        <path
          className="hero-draw"
          style={delay(0.1)}
          d={OUTLINE}
          pathLength={1}
          strokeWidth="24"
        />
        <path
          className="hero-draw"
          style={delay(0.35)}
          d={PILASTERS}
          pathLength={1}
          strokeWidth="16"
        />
      </g>
    </svg>
  );
}

function StreetLamp() {
  return (
    <svg
      viewBox="0 0 120 640"
      className="block h-full w-auto overflow-visible"
      fill="none"
      stroke={BRAND}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <defs>
        <radialGradient id="hero-lamp-glow">
          <stop offset="0" stopColor="#f3d9a4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f3d9a4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="88" r="78" fill="url(#hero-lamp-glow)" stroke="none" />
      <path d="M60 640V150" strokeWidth="9" />
      <path d="M42 640h36M48 600h24" strokeWidth="9" />
      <path d="M32 150h56M38 136h44" strokeWidth="7" />
      <path d="M38 136 30 70h60l-8 66Z" fill="#f7e7c4" strokeWidth="6" />
      <path d="M24 70h72L60 40Z" fill={BRAND} strokeWidth="6" />
      <path d="M60 40V26" strokeWidth="6" />
    </svg>
  );
}

// From xl the scene's inner edge sits 24px clear of the search form, whose
// far edge is 50vw - 244px from the viewport edge (36rem half-container,
// 40px padding, 780px form): width = min(34rem, 50vw - 284px), offset =
// max(1rem, 50vw - 812px).
export default function HeroScene() {
  return (
    <HeroDepth className="hero-scene pointer-events-none absolute -z-10 top-6 -end-[14%] w-[min(80vw,440px)] opacity-[0.11] sm:top-10 xl:top-auto xl:bottom-[3px] xl:end-[max(1rem,calc(50vw-812px))] xl:w-[min(34rem,calc(50vw-284px))] xl:opacity-100">
      {/* Far: townhouse rooflines, fading out at the top and sides */}
      <div
        data-depth="0.12"
        data-scroll="0.18"
        className="hero-fade absolute -inset-x-[45%] bottom-0 hidden xl:block"
        style={delay(0.4)}
      >
        <svg
          viewBox="0 400 2440 725"
          preserveAspectRatio="xMidYMax meet"
          className="hero-skyline block h-auto w-full"
          focusable="false"
        >
          <path d={SKYLINE} fill="#e6d9c6" />
        </svg>
      </div>

      {/* Soft contact shadow and warm light behind the building */}
      <div
        className="hero-fade absolute -inset-x-[10%] -bottom-6 hidden h-16 rounded-[50%] bg-[radial-gradient(closest-side,rgb(110_78_55/0.28),transparent)] xl:block"
        style={delay(0.9)}
      />
      <div
        data-depth="0.2"
        data-lift="0.2"
        data-scroll="0.1"
        className="hero-fade absolute inset-x-[5%] top-[15%] bottom-[10%] hidden rounded-full bg-gold-soft/30 blur-3xl xl:block"
        style={delay(1.4)}
      />

      {/* Mid: the building itself */}
      <div data-depth="0.35" className="relative w-full xl:w-[86%]">
        <Building />
      </div>

      {/* Near: a street lamp on the outer side */}
      <div
        data-depth="1"
        className="absolute end-0 bottom-0 hidden h-[58%] xl:block"
      >
        <div className="hero-rise h-full" style={delay(2)}>
          <StreetLamp />
        </div>
      </div>
    </HeroDepth>
  );
}
