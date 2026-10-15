// Pure game logic for the fishing game: no UI, no storage.
// Randomness is injectable (`Rng`) so the logic can be tested deterministically.

import {
  GAME_CONFIG,
  RARITIES,
  RARITY_INFO,
  getAccessory,
  getBait,
  getLocation,
  getRod,
  type Accessory,
  type Fish,
  type Rarity,
} from "./data";

/** Returns a number in [0, 1), like Math.random. */
export type Rng = () => number;

/** How strongly the combined boost shifts the odds per rarity step (0 = no effect). */
export const RARITY_BOOST_EXPONENT_PER_STEP = 0.5;

export interface Loadout {
  locationId: string;
  rodId: string;
  baitId: string;
  accessoryIds: readonly string[];
}

export interface ResolvedStats {
  rarityBoost: number;
  waitMultiplier: number;
  windowBonusMs: number;
  escapeMultiplier: number;
}

/** Combines location, rod, bait and accessories into one set of stats. Throws on an invalid loadout. */
export function resolveStats(loadout: Loadout): ResolvedStats {
  const location = getLocation(loadout.locationId);
  const rod = getRod(loadout.rodId);
  const bait = getBait(loadout.baitId);

  const seenIds = new Set<string>();
  const seenSlots = new Set<string>();
  const accessories: Accessory[] = loadout.accessoryIds.map((id) => {
    if (seenIds.has(id)) {
      throw new Error(`Duplicate accessory id: ${id}`);
    }
    seenIds.add(id);
    const accessory = getAccessory(id);
    if (seenSlots.has(accessory.slot)) {
      throw new Error(`Two accessories in the same slot: ${accessory.slot}`);
    }
    seenSlots.add(accessory.slot);
    return accessory;
  });

  let rarityBoost = location.rarityBoost * rod.rarityBoost * bait.rarityBoost;
  let windowBonusMs = 0;
  let escapeMultiplier = 1;
  for (const accessory of accessories) {
    rarityBoost *= accessory.rarityBoost;
    windowBonusMs += accessory.windowBonusMs;
    escapeMultiplier *= accessory.escapeMultiplier;
  }

  return {
    rarityBoost,
    waitMultiplier: bait.waitMultiplier,
    windowBonusMs,
    escapeMultiplier,
  };
}

/** Unnormalized drop weights for a given boost. A boost of 1 gives the base weights. */
export function rarityWeights(rarityBoost: number): Record<Rarity, number> {
  if (!Number.isFinite(rarityBoost) || rarityBoost < 1) {
    throw new RangeError(`rarityBoost must be a finite number >= 1, got ${rarityBoost}`);
  }
  const weights = {} as Record<Rarity, number>;
  RARITIES.forEach((rarity, step) => {
    weights[rarity] =
      RARITY_INFO[rarity].baseWeight *
      Math.pow(rarityBoost, step * RARITY_BOOST_EXPONENT_PER_STEP);
  });
  return weights;
}

export function rollRarity(rarityBoost: number, rng: Rng = Math.random): Rarity {
  const weights = rarityWeights(rarityBoost);
  const total = RARITIES.reduce((sum, rarity) => sum + weights[rarity], 0);
  let roll = rng() * total;
  for (const rarity of RARITIES) {
    roll -= weights[rarity];
    if (roll < 0) {
      return rarity;
    }
  }
  // Only reachable through floating-point rounding.
  return RARITIES[RARITIES.length - 1];
}

export function pickFish(
  locationId: string,
  rarity: Rarity,
  rng: Rng = Math.random,
): Fish {
  const pool = getLocation(locationId).fish.filter((fish) => fish.rarity === rarity);
  if (pool.length === 0) {
    throw new Error(`No ${rarity} fish in location ${locationId}`);
  }
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

/** Random wait (ms) before the fish bites. */
export function rollBiteDelayMs(waitMultiplier: number, rng: Rng = Math.random): number {
  const { biteWaitMinMs, biteWaitMaxMs } = GAME_CONFIG;
  const base = biteWaitMinMs + rng() * (biteWaitMaxMs - biteWaitMinMs);
  return Math.round(base * waitMultiplier);
}

/** How long (ms) the player has to tap after the bite. */
export function tapWindowMs(rarity: Rarity, windowBonusMs: number): number {
  return RARITY_INFO[rarity].biteWindowMs + windowBonusMs;
}

/** Chance (0..1) that the fish escapes even after a well-timed tap. */
export function escapeChance(rarity: Rarity, escapeMultiplier: number): number {
  return Math.min(1, RARITY_INFO[rarity].escapeChance * escapeMultiplier);
}

export interface Cast {
  fish: Fish;
  biteDelayMs: number;
  windowMs: number;
  escapeChance: number;
}

/** Decides everything about a cast up front: which fish, when it bites, how long you have. */
export function startCast(loadout: Loadout, rng: Rng = Math.random): Cast {
  const stats = resolveStats(loadout);
  const rarity = rollRarity(stats.rarityBoost, rng);
  const fish = pickFish(loadout.locationId, rarity, rng);
  return {
    fish,
    biteDelayMs: rollBiteDelayMs(stats.waitMultiplier, rng),
    windowMs: tapWindowMs(rarity, stats.windowBonusMs),
    escapeChance: escapeChance(rarity, stats.escapeMultiplier),
  };
}

export type CastOutcome = "caught" | "too-early" | "too-late" | "escaped";

export interface CastResult {
  outcome: CastOutcome;
  points: number;
}

/**
 * `tapOffsetMs` is when the player tapped, relative to the bite:
 * negative = before the bite, null = never tapped.
 */
export function resolveCast(
  cast: Cast,
  tapOffsetMs: number | null,
  rng: Rng = Math.random,
): CastResult {
  if (tapOffsetMs === null || !Number.isFinite(tapOffsetMs)) {
    return { outcome: "too-late", points: 0 };
  }
  if (tapOffsetMs < 0) {
    return { outcome: "too-early", points: 0 };
  }
  if (tapOffsetMs > cast.windowMs) {
    return { outcome: "too-late", points: 0 };
  }
  if (rng() < cast.escapeChance) {
    return { outcome: "escaped", points: 0 };
  }
  return { outcome: "caught", points: RARITY_INFO[cast.fish.rarity].points };
}
