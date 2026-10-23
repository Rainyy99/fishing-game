"use client";

import type { CSSProperties } from "react";
import type { Fish } from "@/game/data";
import { Angler, BOBBER, CAST_S, FISH_SPOT, REST_TIP } from "./Angler";

export type ScenePhase = "idle" | "waiting" | "bite" | "fight" | "result";

interface SceneProps {
  phase: ScenePhase;
  /** A fish took the bait and got away. */
  eaten?: boolean;
  /** Darken the painting (used behind menu screens). */
  dim?: boolean;
  /** Equipped rod, so the fisherman holds the right one. */
  rodId?: string;
  /** Counts taps while reeling; drives the reel crank. */
  taps?: number;
  tension?: number;
  surging?: boolean;
  /** A fish just landed: it leaps out of the water at the hook spot. */
  leap?: Fish | null;
  /** A fish that got away: it bolts out of the water and flees. */
  flee?: Fish | null;
}

/**
 * The night lake as a full-screen backdrop. The painting fills the whole screen (cover) and the
 * rod, line and bobber sit on top in the painting's own coordinates, so they stay aligned.
 * `dim` darkens it behind menu screens.
 */
export function Scene({ phase, eaten = false, dim = false, rodId = "bamboo-rod", taps = 0, tension = 0, surging = false, leap = null, flee = null }: SceneProps) {
  const inWater = phase === "waiting" || phase === "bite" || phase === "fight";
  const biting = phase === "bite" || phase === "fight";
  const bite = phase === "bite";
  const fighting = phase === "fight";

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
          <Angler phase={phase} rodId={rodId} taps={taps} tension={tension} surging={surging} />

          {!inWater && eaten && !flee?.art &&
            [
              [-14, 20, 4, 0],
              [4, 32, 3, 0.15],
              [-6, 46, 2.2, 0.3],
            ].map(([dx, dy, r, delay]) => (
              <circle
                key={`${dx}-${dy}`}
                className="pop"
                cx={REST_TIP.x + dx * 2.36}
                cy={REST_TIP.y + 95 + dy * 2.36}
                r={r * 2.36}
                fill="none"
                stroke="#bae6fd"
                strokeWidth="3"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}

          {inWater &&
            (biting ? [0, 0.27, 0.54] : [CAST_S, CAST_S + 1.2]).map((delay) => {
              const spot = fighting ? FISH_SPOT : BOBBER;
              return (
                <ellipse
                  key={delay}
                  className={biting ? "ripple ripple-fast" : "ripple"}
                  cx={spot.x}
                  cy={spot.y + 6}
                  rx="34"
                  ry="10"
                  fill="none"
                  opacity="0"
                  stroke="#bae6fd"
                  strokeWidth="3.5"
                  style={{ animationDelay: `${delay}s` }}
                />
              );
            })}

          {leap?.art && <Leap key={leap.id} fish={leap} />}
          {flee?.art && <Leap key={`flee-${flee.id}`} fish={flee} away />}

          {phase === "waiting" && <Splash at={BOBBER} delay={CAST_S} small />}
          {bite && <Splash at={BOBBER} delay={0} />}

          {(phase === "waiting" || bite) && (
            <g transform={`translate(${BOBBER.x} ${BOBBER.y}) scale(2.36)`} className={bite ? undefined : "bobber-land"}>
              <g className={bite ? "bobber-bite" : "bobber-idle"}>
                <path d="M0 -16 L0 -9" stroke="#f8fafc" strokeWidth="2" />
                <path d="M-9 0 a9 9 0 0 0 18 0 z" fill="#f8fafc" stroke="#0d1b2a" strokeWidth="1.2" />
                <path d="M-9 0 a9 9 0 0 1 18 0 z" fill="#ff4d6d" stroke="#0d1b2a" strokeWidth="1.2" />
              </g>
            </g>
          )}

          {bite && (
            <g transform={`translate(${BOBBER.x} ${BOBBER.y - 110}) scale(2.36)`}>
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

const DROPS: ReadonlyArray<[number, number]> = [
  [-80, -90],
  [-40, -140],
  [10, -155],
  [60, -125],
  [95, -70],
  [-110, -45],
];

/** The caught fish arcs up from the hook spot toward the angler, with a splash where it left the water. */
function Leap({ fish, away = false }: { fish: Fish; away?: boolean }) {
  const { x, y } = FISH_SPOT;
  return (
    <g>
      {[0, 0.12].map((delay) => (
        <ellipse
          key={delay}
          className="ripple ripple-fast"
          cx={x}
          cy={y + 6}
          rx="40"
          ry="12"
          fill="none"
          stroke="#bae6fd"
          strokeWidth="4"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <Splash at={FISH_SPOT} delay={0} />
      <g transform={`translate(${x} ${y})`}>
        <g className={away ? "flee" : "leap"} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          {/* The painted fish faces right: a landed fish is flipped to head toward the angler, one that got away bolts off to the right. */}
          <image
            href={`/art/misty-lake/fish/${fish.art}.png`}
            x="-100"
            y="-75"
            width="200"
            height="150"
            preserveAspectRatio="xMidYMid meet"
            transform={away ? undefined : "scale(-1 1)"}
          />
        </g>
      </g>
    </g>
  );
}

/** Water thrown up at a point: a handful of drops that fly out and fall back. */
function Splash({ at, delay, small = false }: { at: { x: number; y: number }; delay: number; small?: boolean }) {
  const k = small ? 0.55 : 1;
  return (
    <g>
      {DROPS.map(([dx, dy]) => (
        <circle
          key={`${dx}-${dy}`}
          className="drop"
          cx={at.x}
          cy={at.y}
          r={small ? 6 : 11}
          fill="#e0f2fe"
          style={{ "--dx": `${dx * k}px`, "--dy": `${dy * k}px`, animationDelay: `${delay}s` } as CSSProperties}
        />
      ))}
    </g>
  );
}
