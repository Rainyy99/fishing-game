"use client";

import { useEffect, useRef } from "react";
import type { ScenePhase } from "./Scene";

/**
 * The fisherman, drawn in the painting's own coordinate space (944 x 1680) so he stays glued to
 * the boat. The painted figure already holds a spinning rod the way an angler does: the upper hand
 * wraps the cork handle behind the reel stem, the reel hangs under the rod. What moves is built
 * on top of it:
 *  - the long thin blank of the equipped rod, cut into slices so it can flex toward the fish
 *  - the reel's crank handle, turning on the hub cap
 *  - the lower forearm and fist, which follow the handle round and round
 * Motion is driven imperatively so React never re-renders at 60 fps.
 */

// Placement of the character sprite (607 x 1395) inside the painting.
const SCALE = 0.58;
const ORIGIN = { x: 60, y: 960 };

// Anchors on the character sprite.
const HUB = { x: 504, y: 407 }; // the round cap the crank turns on
const GRIP = { x: 477, y: 445 }; // where the lower fist holds the handle at rest
const ELBOW = { x: 382, y: 497 }; // the sleeve seam the lower forearm pivots on
const ARM_BOX = { x: 377, y: 433, w: 151, h: 126 }; // lower forearm + fist
const CUT = { x: 565, y: 260 }; // where the painted rod ends and the equipped blank begins
const CHAR = { w: 607, h: 1395 };

// The rod sprite (1658 wide): the blank we use starts right after the reel.
const ROD = { w: 1658, h: 245, axis: 33, seam: 560 };
const RS = 0.38; // rod sprite -> character scale (matches the thickness of the painted rod)
const SLICES = 14;
const THETA0 = 41; // rod angle above horizontal, degrees
const CRANK = 30; // hub -> paddle centre, in character pixels

const RODS: Record<string, { metal: string; dark: string }> = {
  "bamboo-rod": { metal: "#d9b25f", dark: "#8a6420" },
  "fiberglass-rod": { metal: "#dfe8ee", dark: "#7d98a8" },
  "carbon-rod": { metal: "#e6b84a", dark: "#2a3340" },
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const toScene = (x: number, y: number) => ({ x: ORIGIN.x + x * SCALE, y: ORIGIN.y + y * SCALE });

const SLICE_W = (ROD.w - ROD.seam) / SLICES;

/** Where every slice of the blank sits for a given angle and bend, in character coordinates. */
function rodShape(theta: number, bend: number) {
  let p = { x: CUT.x, y: CUT.y };
  const segs: Array<{ x: number; y: number; a: number }> = [];
  for (let i = 1; i <= SLICES; i++) {
    // The base stays stiff; the flex builds toward the tip, curving down toward the fish.
    const a = theta - bend * Math.pow(i / SLICES, 2);
    segs.push({ x: p.x, y: p.y, a });
    p = { x: p.x + RS * SLICE_W * Math.cos(rad(a)), y: p.y - RS * SLICE_W * Math.sin(rad(a)) };
  }
  return { segs, tip: p };
}

const REST = rodShape(THETA0, 0);
/** Where the rod tip rests, in painting coordinates. The bobber and fish spot hang off this. */
export const REST_TIP = toScene(REST.tip.x, REST.tip.y);
/** Seconds the hook spends in the air on a cast. */
export const CAST_S = 0.6;
export const BOBBER = { x: REST_TIP.x - 25, y: REST_TIP.y + 190 };
export const FISH_SPOT = { x: REST_TIP.x + 25, y: REST_TIP.y + 280 };

interface AnglerProps {
  phase: ScenePhase;
  rodId: string;
  /** Increases by one for every tap while reeling. */
  taps: number;
  tension: number;
  surging: boolean;
}

export function Angler({ phase, rodId, taps, tension, surging }: AnglerProps) {
  const id = rodId in RODS ? rodId : "bamboo-rod";
  const rod = RODS[id];
  const live = useRef({ phase, taps, tension, surging });
  useEffect(() => {
    live.current = { phase, taps, tension, surging };
  }, [phase, taps, tension, surging]);

  const root = useRef<SVGGElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scope = root.current?.ownerSVGElement ?? null;
    const el: Record<string, Element | null> = {};
    scope?.querySelectorAll("[data-k]").forEach((node) => {
      el[node.getAttribute("data-k") ?? ""] = node;
    });
    const set = (key: string, name: string, value: string) => el[key]?.setAttribute(name, value);

    // The handle starts where the painted fist already holds it.
    const rest = { x: GRIP.x - HUB.x, y: GRIP.y - HUB.y };
    const ang0 = deg(Math.atan2(rest.y, rest.x));
    const restKnob = { x: HUB.x + CRANK * Math.cos(rad(ang0)), y: HUB.y + CRANK * Math.sin(rad(ang0)) };
    const leanV = { x: GRIP.x - ELBOW.x, y: GRIP.y - ELBOW.y };
    const reach = Math.hypot(leanV.x, leanV.y);
    const lean = deg(Math.atan2(leanV.y, leanV.x));

    const s = {
      angle: 0,
      vel: 0,
      bend: 0,
      theta: THETA0,
      lastTaps: live.current.taps,
      prev: live.current.phase,
      biteAt: -10,
      castAt: -10,
      last: 0,
    };
    let raf = 0;

    const tick = (now: number) => {
      const dt = s.last === 0 ? 0.016 : Math.min((now - s.last) / 1000, 0.05);
      s.last = now;
      const t = now / 1000;
      const { phase: ph, taps: tp, tension: ten, surging: sg } = live.current;

      if (ph !== s.prev) {
        if (ph === "bite") s.biteAt = t;
        if (ph === "waiting") s.castAt = t;
        s.prev = ph;
      }
      if (tp > s.lastTaps) s.vel = Math.min(s.vel + 3000, 4200);
      s.lastTaps = tp;
      s.angle += s.vel * dt;
      s.vel *= Math.exp(-6 * dt);

      const calm = reduce ? 0 : 1;
      const breathe = Math.sin(t * 1.1) * 2 * calm;
      const sway = Math.sin(t * 1.3) * 0.4 * calm;
      const since = t - s.biteAt;
      let dip = 0;
      if (ph === "bite" && since < 0.9 && !reduce) dip = 9 * Math.exp(-3.5 * since) * (0.6 + 0.4 * Math.sin(24 * since));
      const fighting = ph === "fight";
      // A rod at rest is straight; it only flexes when something pulls on the line.
      const bendTarget = fighting ? 14 + 40 * ten : 0;
      const thetaTarget = THETA0 + (fighting ? 2 + 5 * ten : 0);
      const k = 1 - Math.exp(-dt * 8);
      s.bend += (bendTarget - s.bend) * k;
      s.theta += (thetaTarget - s.theta) * k;
      const shake = fighting && sg && !reduce ? Math.sin(t * 70) * 1.5 : 0;
      const theta = s.theta + sway;
      const bend = Math.max(0, s.bend + dip + shake);

      const shape = rodShape(theta, bend);
      shape.segs.forEach((seg, i) => {
        set(
          `sl${i + 1}`,
          "transform",
          `translate(${seg.x} ${seg.y}) rotate(${-seg.a}) scale(${RS}) translate(${-(ROD.seam + i * SLICE_W)} ${-ROD.axis})`,
        );
      });

      // The handle turns on the hub cap; the knob is where the lower fist has to be.
      const ang = ang0 + s.angle;
      set("crank", "transform", `translate(${HUB.x} ${HUB.y}) rotate(${ang})`);
      set("knob", "transform", `translate(${CRANK} 0) rotate(${-ang + 22})`);
      const knob = { x: HUB.x + CRANK * Math.cos(rad(ang)), y: HUB.y + CRANK * Math.sin(rad(ang)) };

      // The lower forearm bends at the seam and stretches to carry the fist to the knob.
      let wx = GRIP.x + (knob.x - restKnob.x) - ELBOW.x;
      let wy = GRIP.y + (knob.y - restKnob.y) - ELBOW.y;
      const wl = Math.hypot(wx, wy);
      const clamped = Math.min(Math.max(wl, reach * 0.8), reach * 1.25);
      wx = (wx / wl) * clamped;
      wy = (wy / wl) * clamped;
      const turn = deg(Math.atan2(wy, wx));
      const stretch = clamped / reach;
      set(
        "arm",
        "transform",
        `translate(${ELBOW.x} ${ELBOW.y}) rotate(${turn}) scale(${stretch} 1) rotate(${-lean}) translate(${-ELBOW.x} ${-ELBOW.y})`,
      );
      set("bob", "transform", `translate(0 ${breathe})`);

      // The line starts at the rod tip.
      const tip = toScene(shape.tip.x, shape.tip.y + breathe);
      let d: string;
      let end: { x: number; y: number };
      let flying = false;
      if (ph === "waiting" && !reduce && t - s.castAt < CAST_S) {
        // The cast: the hook arcs from the rod tip out to the water, the line trailing behind it.
        flying = true;
        const u = (t - s.castAt) / CAST_S;
        end = {
          x: tip.x + (BOBBER.x - tip.x) * u + Math.sin(Math.PI * u) * 90,
          y: tip.y + (BOBBER.y - tip.y) * u * u - Math.sin(Math.PI * u) * 170,
        };
        d = `M${tip.x} ${tip.y} Q${(tip.x + end.x) / 2} ${(tip.y + end.y) / 2 + 30} ${end.x} ${end.y}`;
      } else if (ph === "waiting") {
        end = BOBBER;
        d = `M${tip.x} ${tip.y} Q${(tip.x + end.x) / 2 + 10} ${(tip.y + end.y) / 2 + 50} ${end.x} ${end.y}`;
      } else if (ph === "bite") {
        end = BOBBER;
        d = `M${tip.x} ${tip.y} L${end.x} ${end.y}`;
      } else if (ph === "fight") {
        end = FISH_SPOT;
        const wob = sg && !reduce ? Math.sin(t * 60) * 2 : 0;
        d = `M${tip.x} ${tip.y} Q${(tip.x + end.x) / 2 + wob} ${(tip.y + end.y) / 2 + 12} ${end.x} ${end.y}`;
      } else {
        end = { x: tip.x - 6, y: tip.y + 95 };
        d = `M${tip.x} ${tip.y} Q${tip.x + 6} ${tip.y + 40} ${end.x} ${end.y}`;
      }
      set("line", "d", d);
      const showHook = ph === "idle" || ph === "result" || flying;
      set("hook", "opacity", showHook ? "1" : "0");
      set("hook", "cx", String(end.x));
      set("hook", "cy", String(end.y));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [id]);

  const slices = Array.from({ length: SLICES }, (_, i) => i + 1);

  return (
    <>
      <defs>
        {slices.map((i) => (
          <clipPath key={i} id={`angler-slice-${i}`}>
            <rect x={ROD.seam + (i - 1) * SLICE_W - 0.5} y="0" width={SLICE_W + 1.5} height={ROD.h} />
          </clipPath>
        ))}
      </defs>

      <g transform={`translate(${ORIGIN.x} ${ORIGIN.y}) scale(${SCALE})`}>
        <g ref={root} data-k="bob">
          <image href={`/art/angler/body-${id}.webp`} width={CHAR.w} height={CHAR.h} />

          {/* The equipped rod's blank, flexing toward the fish. */}
          {slices.map((i) => (
            <g key={i} data-k={`sl${i}`}>
              <g clipPath={`url(#angler-slice-${i})`}>
                <image href={`/art/angler/rods/${id}.webp`} width={ROD.w} height={ROD.h} />
              </g>
            </g>
          ))}

          {/* Crank handle: a straight arm and a flat paddle, turning on the round cap. */}
          <g data-k="crank">
            <path
              d={`M0 -4 L${CRANK} -3 Q${CRANK + 3} 0 ${CRANK} 3 L0 4 Z`}
              fill={rod.metal}
              stroke="#081726"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d={`M3 -1.5 L${CRANK - 4} -1`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" />
            <circle r="6" fill={rod.metal} stroke="#081726" strokeWidth="2" />
            <circle r="2.2" fill={rod.dark} />
            <g data-k="knob">
              <rect x="-6" y="-14" width="12" height="28" rx="6" fill="#2b2f3a" stroke="#081726" strokeWidth="2" />
              <rect x="-3" y="-10" width="2.5" height="18" rx="1.2" fill="#fff" fillOpacity="0.25" />
            </g>
          </g>

          {/* The lower forearm and fist close around the paddle. */}
          <g data-k="arm">
            <image href="/art/angler/arm.webp" x={ARM_BOX.x} y={ARM_BOX.y} width={ARM_BOX.w} height={ARM_BOX.h} />
          </g>
        </g>
      </g>

      <path data-k="line" stroke="#e8f1f8" strokeOpacity="0.85" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle data-k="hook" r="5" fill="#e8f1f8" opacity="0" />
    </>
  );
}
