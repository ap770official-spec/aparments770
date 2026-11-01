import type { CSSProperties } from "react";
import Image from "next/image";
import heroPhoto from "../../../public/images/hero-770.jpg";
import HeroPlayOnView from "./HeroPlayOnView";

// Homepage hero card. The brand building draws itself in once (outline,
// bordeaux walls, windows lighting up, "770"), then the real photo
// crossfades in with a slow settle, starting when the card comes into
// view. CSS animations (see "Homepage hero" in globals.css) run off the
// main thread and never delay the search form. Reduced motion skips
// straight to the photo.

const BRAND = "#6e4e37";
const GOLD = "#c8a97e";

// Same geometry as the logo mark (src/components/brand/Logo.tsx), with the
// walls carried down to the ground line so they can be filled.
const WINGS = [
  "M437 1125V375L662 99 887 375V1125Z",
  "M887 1125V375L1000 236 1112 375V1125Z",
  "M1112 1125V375L1337 99 1562 375V1125Z",
];
const OUTLINE =
  "M437 1125V375L662 99 887 375 1000 236 1112 375 1337 99 1562 375V1125";
const PILASTERS = "M887 285V1125M1112 285V1125M1000 179.5V236";
const GROUND = "M250 1125H1750";

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

function delay(seconds: number): CSSProperties {
  return { "--hero-delay": `${seconds}s` } as CSSProperties;
}

function Illustration() {
  return (
    <svg
      viewBox="200 60 1600 1420"
      className="h-full w-full"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
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
          <stop offset="0" stopColor="#f8f3ea" />
          <stop offset="1" stopColor="#e8dbc4" />
        </linearGradient>
        <radialGradient id="hero-shadow">
          <stop offset="0" stopColor={BRAND} stopOpacity="0.22" />
          <stop offset="1" stopColor={BRAND} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse
        className="hero-fade"
        style={delay(0.9)}
        cx="1000"
        cy="1150"
        rx="780"
        ry="48"
        fill="url(#hero-shadow)"
      />

      <g className="hero-fade" style={delay(1)} fill="url(#hero-wall)">
        {WINGS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <g fill="url(#hero-glass)">
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

      {/* Bay-window roof and door, solid brown */}
      <g className="hero-fade" style={delay(1.6)} fill={BRAND}>
        <path d="M927.5 462 1000 400 1071.5 462Z" />
        <rect x="949.5" y="850" width="100" height="200" />
      </g>
      <path
        className="hero-fade"
        style={delay(1.6)}
        d="M1000 850v200"
        stroke="#8a6a52"
        strokeWidth="6"
      />

      <g stroke={GOLD} strokeWidth="13">
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
        <path
          className="hero-draw"
          style={delay(0)}
          d={GROUND}
          pathLength={1}
          strokeWidth="20"
        />
      </g>

      <g className="hero-rise" style={delay(2)}>
        <path d="M470 1330H690M1310 1330H1530" stroke={GOLD} strokeWidth="9" />
        <text
          x="1000"
          y="1420"
          textAnchor="middle"
          fill={BRAND}
          fontSize="250"
          fontWeight="300"
          letterSpacing="60"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
        >
          770
        </text>
      </g>
    </svg>
  );
}

export default function HeroVisual({
  alt,
  className = "",
}: {
  alt: string;
  className?: string;
}) {
  return (
    <HeroPlayOnView
      className={`hero-card relative isolate aspect-[16/11] overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_rgba(26,21,18,0.12)] ring-1 ring-line lg:aspect-[4/3] ${className}`}
    >
      <div className="absolute inset-0 p-4 sm:p-6">
        <Illustration />
      </div>
      <div className="hero-photo absolute inset-0">
        <Image
          src={heroPhoto}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 420px, (min-width: 640px) 560px, 100vw"
          placeholder="blur"
          className="object-cover"
        />
      </div>
    </HeroPlayOnView>
  );
}
