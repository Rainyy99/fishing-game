// Reeling fight logic: pure functions, no UI, no storage.
//
// Every tap of REEL pulls the fish in a little and adds line tension. Tension drains
// away on its own, and the fish slowly wins line back. Tap in a steady rhythm: too fast
// and the line snaps, too slow and the fish gets away. Fish also surge now and then:
// tapping during a surge only strains the line, so hold off until it passes.

import type { Rarity } from "./data";
import type { Rng } from "./engine";

export interface FightProfile {
  /** Seconds between surges (min, max). */
  surgeEvery: readonly [number, number];
  /** How long one surge lasts (s). */
  surgeLen: number;
  /** Extra tension per second during a surge. */
  surgeForce: number;
  /** Catch progress the fish drags back per second. */
  slack: number;
}

// Better fish fight harder: they surge more often, harder, and drag more line back.
export const FIGHT_PROFILES: Record<Rarity, FightProfile> = {
  common: { surgeEvery: [3.6, 5.6], surgeLen: 0.5, surgeForce: 0.3, slack: 0.06 },
  uncommon: { surgeEvery: [3.2, 5.0], surgeLen: 0.6, surgeForce: 0.35, slack: 0.065 },
  rare: { surgeEvery: [2.8, 4.4], surgeLen: 0.7, surgeForce: 0.4, slack: 0.07 },
  epic: { surgeEvery: [2.4, 3.8], surgeLen: 0.85, surgeForce: 0.45, slack: 0.08 },
  legendary: { surgeEvery: [2.0, 3.2], surgeLen: 1.0, surgeForce: 0.5, slack: 0.085 },
};

export const TAP_GAIN = 0.055; // catch progress per tap
export const TAP_TENSION = 0.1; // line tension per tap
export const SURGE_TAP_PENALTY = 1.6; // a tap during a surge adds this much more tension
export const SURGE_WARNING = 0.5; // seconds of warning before a surge
export const FALL = 0.32; // tension drained per second
export const START_TENSION = 0.25;
export const START_PROGRESS = 0.3;
export const TIME_LIMIT = 25; // seconds

export type FightEnd = "caught" | "snapped" | "escaped";

export interface FightState {
  /** Line tension, 0..1. The line snaps at 1. */
  tension: number;
  /** Catch progress, 0..1. The fish is landed at 1 and gets away at 0. */
  progress: number;
  /** Seconds since the fight began. */
  time: number;
  surgeLeft: number;
  nextSurge: number;
  surging: boolean;
  /** True just before a surge: the cue to stop tapping. */
  warning: boolean;
  end: FightEnd | null;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const between = (range: readonly [number, number], rng: Rng) =>
  range[0] + rng() * (range[1] - range[0]);

export function createFight(rarity: Rarity, rng: Rng = Math.random): FightState {
  return {
    tension: START_TENSION,
    progress: START_PROGRESS,
    time: 0,
    surgeLeft: 0,
    nextSurge: between(FIGHT_PROFILES[rarity].surgeEvery, rng),
    surging: false,
    warning: false,
    end: null,
  };
}

/**
 * Advances the fight by `dt` seconds and returns a new state.
 * `taps` is how many REEL taps happened during this step (usually 0 or 1).
 * `slackMultiplier` scales how much line the fish wins back (below 1 = easier,
 * e.g. from gear); it must be finite and not negative.
 */
export function stepFight(
  state: FightState,
  rarity: Rarity,
  taps: number,
  dt: number,
  rng: Rng = Math.random,
  slackMultiplier = 1,
): FightState {
  if (state.end || !(dt > 0)) {
    return state;
  }
  const p = FIGHT_PROFILES[rarity];
  const slack = p.slack * (Number.isFinite(slackMultiplier) ? Math.max(0, slackMultiplier) : 1);
  const time = state.time + dt;
  let { surgeLeft, nextSurge } = state;

  if (surgeLeft > 0) {
    surgeLeft -= dt;
  } else if (time >= nextSurge) {
    surgeLeft = p.surgeLen;
    nextSurge = time + p.surgeLen + between(p.surgeEvery, rng);
  }
  const surging = surgeLeft > 0;
  const warning = !surging && time >= nextSurge - SURGE_WARNING;

  const count = Number.isFinite(taps) ? Math.max(0, Math.floor(taps)) : 0;
  let tension = state.tension - FALL * dt;
  let progress = state.progress - slack * dt * (surging ? 1.5 : 1);
  if (surging) {
    tension += p.surgeForce * dt;
    tension += count * TAP_TENSION * SURGE_TAP_PENALTY;
  } else {
    tension += count * TAP_TENSION;
    progress += count * TAP_GAIN;
  }
  tension = clamp(tension, 0, 1);
  progress = clamp(progress, 0, 1);

  let end: FightEnd | null = null;
  if (progress >= 1) {
    end = "caught";
  } else if (tension >= 1) {
    end = "snapped";
  } else if (progress <= 0 || time >= TIME_LIMIT) {
    end = "escaped";
  }

  return { tension, progress, time, surgeLeft, nextSurge, surging, warning, end };
}
