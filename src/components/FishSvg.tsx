import { useId } from "react";
import { RARITY_INFO, type Fish, type Rarity } from "@/game/data";
import { fishPalette, hashString } from "@/game/color";

const SHAPES = [
  { rx: 36, ry: 17, tailLen: 20, tailH: 19, forked: true },
  { rx: 31, ry: 24, tailLen: 18, tailH: 15, forked: false },
  { rx: 40, ry: 12, tailLen: 16, tailH: 9, forked: true },
] as const;

const GLOW: Record<Rarity, (color: string) => string> = {
  common: () => "none",
  uncommon: () => "none",
  rare: (c) => `drop-shadow(0 0 4px ${c}88)`,
  epic: (c) => `drop-shadow(0 0 8px ${c}aa)`,
  legendary: (c) => `drop-shadow(0 0 10px ${c}) drop-shadow(0 0 22px ${c}77)`,
};

interface FishSvgProps {
  fish: Fish;
  className?: string;
}

/** Draws any fish from code: shape, pattern and colors come from its id and rarity. */
export function FishSvg({ fish, className }: FishSvgProps) {
  const uid = useId().replace(/:/g, "");
  const seed = hashString(fish.id);
  const color = RARITY_INFO[fish.rarity].color;
  const p = fishPalette(color, seed);
  const shape = SHAPES[seed % SHAPES.length];
  const pattern = (seed >>> 3) % 4;
  const { rx, ry, tailLen, tailH } = shape;
  const startX = (120 - (tailLen + 2 * rx)) / 2;
  const lx = startX + tailLen;
  const cx = lx + rx;
  const cy = 35;

  const tail = shape.forked
    ? `M${lx + 3} ${cy} L${startX} ${cy - tailH} L${startX + tailLen * 0.35} ${cy} L${startX} ${cy + tailH} Z`
    : `M${lx + 3} ${cy} L${startX} ${cy - tailH} Q${startX - 3} ${cy} ${startX} ${cy + tailH} Z`;

  const dorsal =
    fish.rarity === "legendary"
      ? `M${cx - rx * 0.4} ${cy - ry + 3} L${cx - rx * 0.3} ${cy - ry - 11} L${cx - rx * 0.12} ${cy - ry - 2} L${cx} ${cy - ry - 14} L${cx + rx * 0.14} ${cy - ry - 2} L${cx + rx * 0.28} ${cy - ry - 10} L${cx + rx * 0.36} ${cy - ry + 3} Z`
      : `M${cx - rx * 0.4} ${cy - ry + 3} Q${cx - rx * 0.05} ${cy - ry - 14} ${cx + rx * 0.35} ${cy - ry + 3} Z`;

  const anal = `M${cx - rx * 0.1} ${cy + ry - 2} Q${cx - rx * 0.25} ${cy + ry + 8} ${cx - rx * 0.45} ${cy + ry - 1} Z`;
  const pectoral = `M${cx + rx * 0.1} ${cy + 3} Q${cx - rx * 0.2} ${cy + ry * 0.9} ${cx - rx * 0.35} ${cy + ry * 0.7} Q${cx - rx * 0.1} ${cy} ${cx + rx * 0.1} ${cy + 3} Z`;
  const gill = `M${cx + rx * 0.42} ${cy - ry * 0.55} Q${cx + rx * 0.32} ${cy} ${cx + rx * 0.42} ${cy + ry * 0.55}`;
  const mouth = `M${cx + rx - 1} ${cy + 1} q-4 2 -7 0`;

  const spots: ReadonlyArray<readonly [number, number]> = [
    [-0.5, -0.3],
    [-0.25, 0.1],
    [-0.05, -0.35],
    [-0.6, 0.35],
    [0.15, 0.2],
  ];

  return (
    <svg
      viewBox="0 -6 120 82"
      role="img"
      aria-label={fish.name}
      className={className}
      style={{ filter: GLOW[fish.rarity](color) }}
    >
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.top} />
          <stop offset="0.55" stopColor={p.mid} />
          <stop offset="1" stopColor={p.belly} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>

      <path d={tail} fill={p.fin} />
      <path d={dorsal} fill={p.fin} />
      <path d={anal} fill={p.fin} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}g)`} />

      <g clipPath={`url(#${uid}c)`}>
        {pattern === 1 &&
          [-0.5, -0.2, 0.1].map((f) => (
            <path
              key={f}
              d={`M${cx + rx * f} ${cy - ry} l6 0 l-4 ${2 * ry} l-6 0 Z`}
              fill={p.accent}
              opacity={0.55}
            />
          ))}
        {pattern === 2 &&
          spots.map(([fx, fy]) => (
            <circle
              key={`${fx}${fy}`}
              cx={cx + rx * fx}
              cy={cy + ry * fy}
              r={2.2}
              fill={p.accent}
              opacity={0.7}
            />
          ))}
        {pattern === 3 && (
          <path
            d={`M${lx + 4} ${cy} Q${cx} ${cy - 2} ${cx + rx * 0.35} ${cy}`}
            stroke={p.accent}
            strokeWidth={1.6}
            fill="none"
            opacity={0.75}
          />
        )}
        <ellipse
          cx={cx}
          cy={cy - ry * 0.45}
          rx={rx * 0.7}
          ry={ry * 0.18}
          fill="#ffffff"
          opacity={0.14}
        />
      </g>

      <path d={pectoral} fill={p.fin} opacity={0.9} />
      <path d={gill} stroke={p.accent} strokeWidth={1.4} fill="none" opacity={0.8} />
      <circle cx={cx + rx * 0.62} cy={cy - ry * 0.22} r={3.6} fill="#ffffff" />
      <circle cx={cx + rx * 0.62 + 0.7} cy={cy - ry * 0.22} r={1.9} fill="#0b1020" />
      <path d={mouth} stroke={p.accent} strokeWidth={1.2} fill="none" />
    </svg>
  );
}
