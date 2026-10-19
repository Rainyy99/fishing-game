export type ScenePhase = "idle" | "waiting" | "bite" | "fight" | "result";

interface SceneProps {
  phase: ScenePhase;
  /** A fish took the bait and got away. */
  eaten?: boolean;
}

// The painted lake is 400 x 576 in this coordinate space; the rod, line and bobber are drawn on top.
const ROD_IDLE = "M17 521 Q140 381 220 237";
const ROD_FIGHT = "M17 521 Q106 339 199 275";

/** The night lake. Purely decorative: the game state is announced in text elsewhere. */
export function Scene({ phase, eaten = false }: SceneProps) {
  const inWater = phase === "waiting" || phase === "bite" || phase === "fight";
  const biting = phase === "bite";
  const fighting = phase === "fight";

  const rod = fighting ? ROD_FIGHT : ROD_IDLE;
  const tip = fighting ? "199 275" : "220 237";
  const line = fighting
    ? "M199 275 L255 395"
    : biting
      ? "M220 237 L271 340"
      : inWater
        ? "M220 237 Q250 300 271 344"
        : "M220 237 Q222 270 214 298";

  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/misty-lake/scene.jpg"
        alt=""
        width={944}
        height={1360}
        fetchPriority="high"
        draggable={false}
        className="block h-auto w-full"
      />
      <svg
        viewBox="0 0 400 576"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <path d={rod} stroke="#0d1b2a" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d={rod} stroke="#c58a45" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <circle cx={tip.split(" ")[0]} cy={tip.split(" ")[1]} r="2" fill="#f4d58d" />
        <path d={line} stroke="#e8f1f8" strokeOpacity="0.85" strokeWidth="1.2" fill="none" />

        {!inWater && !eaten && <circle cx="214" cy="298" r="2.2" fill="#e8f1f8" />}
        {!inWater && eaten && (
          <>
            {[
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
          </>
        )}

        {inWater &&
          (biting || fighting ? [0, 0.27, 0.54] : [0, 1.2]).map((delay) => (
            <ellipse
              key={delay}
              className={biting || fighting ? "ripple ripple-fast" : "ripple"}
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

        {(waitingOrBite(phase)) && (
          <g transform="translate(271 344)">
            <g className={biting ? "bobber-bite" : "bobber-idle"}>
              <path d="M0 -16 L0 -9" stroke="#f8fafc" strokeWidth="2" />
              <path d="M-9 0 a9 9 0 0 0 18 0 z" fill="#f8fafc" stroke="#0d1b2a" strokeWidth="1.2" />
              <path d="M-9 0 a9 9 0 0 1 18 0 z" fill="#ff4d6d" stroke="#0d1b2a" strokeWidth="1.2" />
            </g>
          </g>
        )}

        {biting && (
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
      </svg>
    </div>
  );
}

function waitingOrBite(phase: ScenePhase): boolean {
  return phase === "waiting" || phase === "bite";
}
