export type ScenePhase = "idle" | "waiting" | "bite" | "fight" | "result";

interface SceneProps {
  phase: ScenePhase;
  /** A fish took the bait and got away. */
  eaten?: boolean;
  /** Darken the painting (used behind menu screens). */
  dim?: boolean;
}

// The painted lake is 400 x 576 in this coordinate space; the rod, line and bobber are drawn on top.
const ROD_IDLE = "M17 521 Q140 381 220 237";
const ROD_FIGHT = "M17 521 Q106 339 199 275";

/**
 * The night lake as a full-screen backdrop. The painting fills the whole screen (cover) and the
 * rod, line and bobber sit on top in the painting's own coordinates, so they stay aligned.
 * `dim` darkens it behind menu screens.
 */
export function Scene({ phase, eaten = false, dim = false }: SceneProps) {
  const inWater = phase === "waiting" || phase === "bite" || phase === "fight";
  const biting = phase === "bite" || phase === "fight";
  const bite = phase === "bite";
  const fighting = phase === "fight";

  const rod = fighting ? ROD_FIGHT : ROD_IDLE;
  const tip = fighting ? "199 275" : "220 237";
  const line = fighting
    ? "M199 275 L255 395"
    : bite
      ? "M220 237 L271 340"
      : inWater
        ? "M220 237 Q250 300 271 344"
        : "M220 237 Q222 270 214 298";

  return (
    <div
      aria-hidden="true"
      className="fixed inset-y-0 left-1/2 -z-10 w-full max-w-[calc(100dvh*0.5625)] -translate-x-1/2 overflow-hidden bg-ink"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/misty-lake/scene.jpg"
        alt=""
        width={944}
        height={1680}
        fetchPriority="high"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300"
        style={dim ? { filter: "brightness(0.32) saturate(0.8)" } : undefined}
      />
      {!dim && (
        <svg
          viewBox="0 0 944 1680"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          focusable="false"
        >
          <g transform="translate(0 50) scale(2.36)">
            <path d={rod} stroke="#0d1b2a" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d={rod} stroke="#c58a45" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <circle cx={tip.split(" ")[0]} cy={tip.split(" ")[1]} r="2" fill="#f4d58d" />
            <path d={line} stroke="#e8f1f8" strokeOpacity="0.85" strokeWidth="1.2" fill="none" />

            {!inWater && !eaten && <circle cx="214" cy="298" r="2.2" fill="#e8f1f8" />}
            {!inWater && eaten &&
              [
                [206, 306, 4, 0],
                [222, 314, 3, 0.15],
                [212, 322, 2.2, 0.3],
              ].map(([x, y, r, delay]) => (
                <circle
                  key={`${x}-${y}`}
                  className="pop"
                  cx={x}
                  cy={y}
                  r={r}
                  fill="none"
                  stroke="#bae6fd"
                  strokeWidth="1.4"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}

            {inWater &&
              (biting ? [0, 0.27, 0.54] : [0, 1.2]).map((delay) => (
                <ellipse
                  key={delay}
                  className={biting ? "ripple ripple-fast" : "ripple"}
                  cx={fighting ? 255 : 271}
                  cy={fighting ? 396 : 350}
                  rx="14"
                  ry="4"
                  fill="none"
                  stroke="#bae6fd"
                  strokeWidth="1.5"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}

            {(phase === "waiting" || bite) && (
              <g transform="translate(271 344)">
                <g className={bite ? "bobber-bite" : "bobber-idle"}>
                  <path d="M0 -16 L0 -9" stroke="#f8fafc" strokeWidth="2" />
                  <path d="M-9 0 a9 9 0 0 0 18 0 z" fill="#f8fafc" stroke="#0d1b2a" strokeWidth="1.2" />
                  <path d="M-9 0 a9 9 0 0 1 18 0 z" fill="#ff4d6d" stroke="#0d1b2a" strokeWidth="1.2" />
                </g>
              </g>
            )}

            {bite && (
              <g transform="translate(271 296)">
                <g className="pop">
                  <circle r="14" fill="#fb7185" stroke="#0d1b2a" strokeWidth="1.5" />
                  <path d="M-5 12 L0 20 L5 12 Z" fill="#fb7185" />
                  <text y="6" textAnchor="middle" fontSize="18" fontWeight="800" fill="#ffffff">
                    !
                  </text>
                </g>
              </g>
            )}
          </g>
        </svg>
      )}
      {/* Soft shading so the title and controls stay readable over the painting. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(7,18,31,0.7), rgba(7,18,31,0) 20%, rgba(7,18,31,0) 62%, rgba(7,18,31,0.6))",
        }}
      />
    </div>
  );
}
