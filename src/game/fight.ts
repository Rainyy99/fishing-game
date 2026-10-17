// Reeling fight logic: pure functions, no UI, no storage.
//
// Holding REEL pulls the fish in but also raises line tension. Letting go lowers
// the tension, but the fish slowly wins line back. Fish surge now and then: during
// a surge the tension climbs by itself, so the right move is to let go.

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
  common: { surgeEvery: [3.6, 5.6], surgeLen: 0.5, surgeForce: 0.4, slack: 0.065 },
  uncommon: { surgeEvery: [3.2, 5.0], surgeLen: 0.6, surgeForce: 0.5, slack: 0.075 },
  rare: { surgeEvery: [2.8, 4.4], surgeLen: 0.7, surgeForce: 0.6, slack: 0.085 },
  epic: { surgeEvery: [2.4, 3.8], surgeLen: 0.85, surgeForce: 0.7, slack: 0.095 },
  legendary: { surgeEvery: [2.0, 3.2], surgeLen: 1.0, surgeForce: 0.8, slack: 0.105 },
};

export const REEL_RATE = 0.3; // catch progress per second while reeling
export const RISE = 0.38; // tension per second while reeling
export const FALL = 0.55; // tension per second while released
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
    end: null,
  };
}

/**
 * Advances the fight by `dt` seconds and returns a new state.
 * `slackMultiplier` scales how much line the fish wins back (below 1 = easier,
 * e.g. from gear); it must be finite and not negative.
 */
export function stepFight(
  state: FightState,
  rarity: Rarity,
  holding: boolean,
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

  let tension = state.tension + (holding ? RISE : -FALL) * dt;
  if (surging) {
    tension += p.surgeForce * dt;
  }
  tension = clamp(tension, 0, 1);

  let progress = state.progress;
  if (holding && !surging) {
    progress += REEL_RATE * dt;
  } else {
    progress -= slack * dt * (surging ? 1.5 : 1);
  }
  progress = clamp(progress, 0, 1);

  let end: FightEnd | null = null;
  if (progress >= 1) {
    end = "caught";
  } else if (tension >= 1) {
    end = "snapped";
  } else if (progress <= 0 || time >= TIME_LIMIT) {
    end = "escaped";
  }

  return { tension, progress, time, surgeLeft, nextSurge, surging, end };
}
