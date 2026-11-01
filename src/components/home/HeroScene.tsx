import type { CSSProperties, ReactNode } from "react";
import HeroDepth from "./HeroDepth";

// Homepage hero backdrop: the brand building as part of the page, not a
// picture on it. Drawn hollow like the logo - lines with air between them,
// so the page and the far rooflines show through.
//
// From xl it stands beside the headline and search (left in Hebrew, right
// in English) on the ground line that closes the hero, rising to the
// headline. Its inner edge passes behind the search form, which stays on
// top. Below xl it is a faint line drawing behind the headline.
//
// Depth is real 3D: the facade is split into planes (tint at the back,
// windows recessed, bay window / door / steps standing out). It turns into
// place on load while its lines draw (CSS, "Homepage hero" in globals.css),
// then HeroDepth tilts it with the pointer and drifts the other layers.

const LINE = "#957560";
const GOLD = "#d0b38a";

// Same geometry as the logo mark (src/components/brand/Logo.tsx); walls run
// down to the ground line (y 1125, the bottom edge of the viewBox).
const VIEWBOX = "400 70 1200 1055";
const WINGS =
  "M437 1125V375L662 99 887 375V1125ZM887 1125V375L1000 236 1112 375V1125ZM1112 1125V375L1337 99 1562 375V1125Z";
const OUTLINE =
  "M437 1135V375L662 99 887 375 1000 236 1112 375 1337 99 1562 375V1135";
const PILASTERS = "M887 285V1135M1112 285V1135M1000 179.5V236";
const GABLES = "M493 375 662 170.5 831 375M1168 375 1337 170.5 1506 375";

// Wing windows (glass, then frames), in the order they light up.
const PANES: [number, number, number, number][] = [
  [624.5, 262, 75, 75],
  [1299.5, 262, 75, 75],
  [524.5, 449.5, 275, 150],
  [1199.5, 449.5, 275, 150],
  [499.5, 699.5, 325, 225],
  [1174.5, 699.5, 325, 225],
];
const FRAMES = [
  "M624.5 262h75v75h-75zM662 262v75M1299.5 262h75v75h-75zM1337 262v75",
  "M524.5 449.5h275v150h-275zM593 449.5v150M662 449.5v150M730.5 449.5v150",
  "M1199.5 449.5h275v150h-275zM1268 449.5v150M1337 449.5v150M1405.5 449.5v150",
  "M499.5 699.5h325v225h-325zM499.5 775h325M581 699.5v225M662 699.5v225M743 699.5v225",
  "M1174.5 699.5h325v225h-325zM1174.5 775h325M1256 699.5v225M1337 699.5v225M1418 699.5v225",
];
// The parts that stand out from the facade.
const BAY = "M927.5 462 1000 400 1071.5 462ZM927.5 462v175h144v-175M927.5 637 966 712h68l37.5-75";
const BAY_MULLIONS = "M927.5 637h144M976 462v175M1023 462v175";
const DOOR = "M921 1050V818h156.5v232M949.5 1050V850h100v200M1000 850v200";
const STEPS = "M924.5 1075h149M899.5 1100h199";

// A loose row of Crown Heights rooflines, far behind the building.
const SKYLINE =
  "M0 1125V735L95 645L190 735V725H235V655H258V725H340V605H490V735L610 645L730 735V655L835 565L940 655V605L1015 515L1090 605V725H1162V655H1198V725H1330V695H1570V725H1633V655H1664V725H1780V545H1825V475H1848V545H1930V655L2025 565L2120 655V605L2195 515L2270 605V695H2440V1125Z";

function delay(seconds: number): CSSProperties {
  return { "--hero-delay": `${seconds}s` } as CSSProperties;
}

/** One depth plane of the facade: a full-size SVG pushed along Z. */
function Plane({ z, children }: { z: number; children: ReactNode }) {
  return (
    <svg
      viewBox={VIEWBOX}
      className="absolute inset-0 h-full w-full overflow-visible"
      style={{ transform: `translateZ(${z}px)` }}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function Draw({
  d,
  at,
  width,
  color = LINE,
}: {
  d: string;
  at: number;
  width: number;
  color?: string;
}) {
  return (
    <path
      className="hero-draw"
      style={delay(at)}
      d={d}
      pathLength={1}
      stroke={color}
      strokeWidth={width}
    />
  );
}

function Building() {
  return (
    <div className="hero-tilt relative h-full w-full" data-tilt>
      <div className="hero-enter absolute inset-0">
        {/* Back: a whisper of warm tint inside the walls, for volume. */}
        <Plane z={-36}>
          <path
            className="hero-fade"
            style={delay(1.1)}
            d={WINGS}
            fill={GOLD}
            fillOpacity="0.12"
          />
        </Plane>

        {/* Recessed: window glass and frames. */}
        <Plane z={-14}>
          <defs>
            <linearGradient id="hero-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6dfae" stopOpacity="0.55" />
              <stop offset="1" stopColor="#f6dfae" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <g fill="url(#hero-glass)">
            {PANES.map(([x, y, w, h], i) => (
              <rect
                key={i}
                className="hero-light"
                style={delay(1.5 + i * 0.08)}
                x={x}
                y={y}
                width={w}
                height={h}
              />
            ))}
          </g>
          {FRAMES.map((d, i) => (
            <Draw key={d} d={d} at={1.05 + i * 0.07} width={9} color={GOLD} />
          ))}
        </Plane>

        {/* Facade: walls, gables, pilasters. */}
        <Plane z={0}>
          <Draw d={OUTLINE} at={0.1} width={16} />
          <Draw d={PILASTERS} at={0.4} width={11} />
          <Draw d={GABLES} at={0.9} width={9} color={GOLD} />
        </Plane>

        {/* Front: bay window, door and steps stand out from the wall. */}
        <Plane z={30}>
          <path
            className="hero-light"
            style={delay(1.95)}
            d="M927.5 462h144v175h-144z"
            fill="url(#hero-glass)"
          />
          <Draw d={BAY} at={1.6} width={10} />
          <Draw d={BAY_MULLIONS} at={1.8} width={7} color={GOLD} />
          <Draw d={DOOR} at={1.7} width={9} />
          <Draw d={STEPS} at={1.9} width={9} color={GOLD} />
        </Plane>
      </div>
    </div>
  );
}

function StreetLamp() {
  return (
    <svg
      viewBox="0 0 120 640"
      className="block h-full w-auto overflow-visible"
      fill="none"
      stroke={LINE}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <defs>
        <radialGradient id="hero-lamp-glow">
          <stop offset="0" stopColor="#f3d9a4" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f3d9a4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="88" r="80" fill="url(#hero-lamp-glow)" stroke="none" />
      <path d="M60 640V150" strokeWidth="7" />
      <path d="M42 640h36M48 600h24" strokeWidth="7" />
      <path d="M32 150h56M38 136h44" strokeWidth="6" />
      <path d="M38 136 30 70h60l-8 66Z" fill="#f7e7c4" fillOpacity="0.6" strokeWidth="5" />
      <path d="M24 70h72L60 40Z" strokeWidth="5" />
      <path d="M60 40V26" strokeWidth="5" />
    </svg>
  );
}

// From xl the building is as tall as the hero allows (up to the headline,
// 7rem below the top) but never wider than the space the headline leaves
// free: 50vw - 124px at the 620px headline cap, times the 1055/1200 aspect.
export default function HeroScene() {
  return (
    <HeroDepth className="hero-scene pointer-events-none absolute -z-10 top-6 -end-[14%] w-[min(80vw,440px)] opacity-[0.16] sm:top-10 xl:top-auto xl:bottom-[3px] xl:h-[min(calc(100%-7rem),calc((50vw-124px)*0.879))] xl:end-[max(1rem,calc(50vw-37rem))] xl:w-auto xl:opacity-100">
      {/* Far: townhouse rooflines, fading out at the top and sides. */}
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
          <path d={SKYLINE} fill="#e8ddcc" />
        </svg>
      </div>

      {/* Warm light behind the building and a soft contact shadow. */}
      <div
        data-depth="0.2"
        data-lift="0.2"
        data-scroll="0.1"
        className="hero-fade absolute inset-x-[5%] top-[15%] bottom-[10%] hidden rounded-full bg-gold-soft/25 blur-3xl xl:block"
        style={delay(1.4)}
      />
      <div
        className="hero-fade absolute -inset-x-[8%] -bottom-6 hidden h-14 rounded-[50%] bg-[radial-gradient(closest-side,rgb(110_78_55/0.2),transparent)] xl:block"
        style={delay(0.9)}
      />

      {/* Mid: the building, in 3D. Sized by height from xl. */}
      <div className="hero-3d relative w-full xl:h-full xl:w-auto" style={{ aspectRatio: "1200 / 1055" }}>
        <Building />
      </div>

      {/* Near: a street lamp just in front of the outer wall. */}
      <div
        data-depth="1"
        className="absolute -end-[3%] bottom-0 hidden h-[48%] xl:block"
      >
        <div className="hero-rise h-full" style={delay(2.1)}>
          <StreetLamp />
        </div>
      </div>
    </HeroDepth>
  );
}
