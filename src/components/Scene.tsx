export type ScenePhase = "idle" | "waiting" | "bite" | "result";

// x, y, radius, animation delay (s)
const STARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [24, 30, 1.2, 0],
  [60, 70, 1, 0.6],
  [98, 24, 1.4, 1.1],
  [140, 58, 1, 0.3],
  [186, 20, 1.2, 1.7],
  [220, 52, 1, 0.9],
  [40, 110, 1, 1.3],
  [120, 100, 1.2, 0.5],
  [200, 96, 1, 1.9],
  [250, 24, 1, 1.4],
  [336, 90, 1, 1.0],
  [78, 140, 1, 0.8],
  [320, 28, 1.2, 0.2],
  [300, 128, 1, 1.5],
];

const WAVES: ReadonlyArray<{ y: number; opacity: number; slow: boolean }> = [
  { y: 186, opacity: 0.18, slow: true },
  { y: 212, opacity: 0.22, slow: false },
  { y: 262, opacity: 0.2, slow: true },
  { y: 308, opacity: 0.16, slow: false },
  { y: 352, opacity: 0.12, slow: true },
];

function wavePath(y: number): string {
  let d = `M-80 ${y} q20 -5 40 0`;
  for (let i = 0; i < 13; i++) {
    d += " t40 0";
  }
  return d;
}

interface SceneProps {
  phase: ScenePhase;
}

/** The night lake. Purely decorative: the game state is announced in text elsewhere. */
export function Scene({ phase }: SceneProps) {
  const inWater = phase === "waiting" || phase === "bite";
  const biting = phase === "bite";

  const line = !inWater
    ? "M262 120 Q266 150 258 176"
    : biting
      ? "M262 120 L170 235"
      : "M262 120 Q214 185 170 219";

  return (
    <svg
      viewBox="0 0 360 380"
      className="block h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#040613" />
          <stop offset="1" stopColor="#1d2a5c" />
        </linearGradient>
        <linearGradient id="sc-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12335f" />
          <stop offset="1" stopColor="#040b1d" />
        </linearGradient>
        <radialGradient id="sc-glow">
          <stop offset="0" stopColor="#bfe3ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#bfe3ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="360" height="380" fill="url(#sc-sky)" />
      {STARS.map(([x, y, r, delay]) => (
        <circle
          key={`${x}-${y}`}
          className="star"
          cx={x}
          cy={y}
          r={r}
          fill="#e0f2fe"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}

      <circle cx="290" cy="64" r="46" fill="url(#sc-glow)" />
      <circle cx="290" cy="64" r="22" fill="#f1f7ff" />
      <circle cx="283" cy="58" r="4" fill="#d5e3f5" />
      <circle cx="298" cy="70" r="3" fill="#d5e3f5" />

      <path
        d="M0 170 L0 150 Q40 128 90 146 Q140 112 200 144 Q260 120 310 140 Q340 132 360 146 L360 170 Z"
        fill="#0a1230"
      />
      <path
        d="M0 170 L0 158 Q60 140 120 158 Q200 138 280 158 Q330 148 360 160 L360 170 Z"
        fill="#070d22"
      />

      <rect y="170" width="360" height="210" fill="url(#sc-water)" />
      <rect y="168" width="360" height="2" fill="#38bdf8" opacity="0.35" />

      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          className="shimmer"
          cx="290"
          cy={186 + i * 10}
          rx={20 - i * 3}
          ry="1.6"
          fill="#dbeafe"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}

      {WAVES.map((w) => (
        <path
          key={w.y}
          className={w.slow ? "wave-slow" : "wave"}
          d={wavePath(w.y)}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="1.5"
          opacity={w.opacity}
        />
      ))}

      <path
        d="M352 380 Q300 280 262 120"
        stroke="#94a3b8"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="262" cy="120" r="2.5" fill="#7dd3fc" />
      <path d={line} stroke="#e2e8f0" strokeOpacity="0.7" strokeWidth="1.2" fill="none" />
      {!inWater && <circle cx="258" cy="176" r="2" fill="#cbd5e1" />}

      {inWater &&
        (biting ? [0, 0.27, 0.54] : [0, 1.2]).map((delay) => (
          <ellipse
            key={delay}
            className={biting ? "ripple ripple-fast" : "ripple"}
            cx="170"
            cy="240"
            rx="12"
            ry="3.5"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="1.5"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}

      {inWater && (
        <g transform="translate(170 235)">
          <g className={biting ? "bobber-bite" : "bobber-idle"}>
            <path d="M0 -16 L0 -9" stroke="#f8fafc" strokeWidth="2" />
            <path d="M-9 0 a9 9 0 0 0 18 0 z" fill="#f8fafc" />
            <path d="M-9 0 a9 9 0 0 1 18 0 z" fill="#ff4d6d" />
          </g>
        </g>
      )}

      {biting && (
        <g transform="translate(170 188)">
          <g className="pop">
            <circle r="13" fill="#fb7185" />
            <path d="M-5 11 L0 19 L5 11 Z" fill="#fb7185" />
            <text
              y="6"
              textAnchor="middle"
              fontSize="18"
              fontWeight="800"
              fill="#ffffff"
            >
              !
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
