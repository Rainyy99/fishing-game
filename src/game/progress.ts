// Experience, levels, rewards and titles. Pure rules, no browser APIs.

import type { Rarity } from "./data";

/** XP for landing one fish, by rarity. */
export const XP_PER_RARITY: Record<Rarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400,
};

/** The first catch of a species is worth half again as much. */
export const NEW_SPECIES_MULTIPLIER = 1.5;

export const MAX_LEVEL = 60;

/** XP needed to go from `level` to the next level. Each level asks about 28% more than the last. */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return Math.round(100 * Math.pow(1.28, n - 1));
}

export interface LevelInfo {
  level: number;
  /** XP collected inside the current level. */
  into: number;
  /** XP the current level asks for. 0 at the maximum level. */
  needed: number;
  /** 0..1 progress through the current level. */
  fraction: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let left = Math.max(0, Math.floor(xp));
  let level = 1;
  while (level < MAX_LEVEL && left >= xpForLevel(level)) {
    left -= xpForLevel(level);
    level += 1;
  }
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, into: left, needed: 0, fraction: 1 };
  }
  const needed = xpForLevel(level);
  return { level, into: left, needed, fraction: left / needed };
}

/** Total XP needed to stand at the start of `level`. */
export function xpAtLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < Math.min(level, MAX_LEVEL); l++) {
    total += xpForLevel(l);
  }
  return total;
}

const EARLY_REWARDS: Record<number, number> = {
  2: 10,
  3: 15,
  4: 20,
  5: 40,
  6: 30,
  7: 40,
  8: 50,
  9: 60,
  10: 100,
};

/** Points granted for reaching `level`. Every fifth level pays half again as much. */
export function levelRewardPoints(level: number): number {
  if (level < 2) {
    return 0;
  }
  const early = EARLY_REWARDS[level];
  if (early !== undefined) {
    return early;
  }
  const base = 100 + (level - 10) * 20;
  return level % 5 === 0 ? Math.round(base * 1.5) : base;
}

export interface TitleInfo {
  level: number;
  title: string;
}

/** Titles unlock at these levels, lowest first. */
export const TITLES: readonly TitleInfo[] = [
  { level: 1, title: "Rookie Angler" },
  { level: 5, title: "Lake Regular" },
  { level: 10, title: "Mist Walker" },
  { level: 15, title: "Moon Caster" },
  { level: 20, title: "Lantern Keeper" },
  { level: 30, title: "Lake Master" },
  { level: 40, title: "Night Legend" },
  { level: 50, title: "Legend of the Lake" },
];

export function titleForLevel(level: number): string {
  let current = TITLES[0].title;
  for (const t of TITLES) {
    if (level >= t.level) {
      current = t.title;
    }
  }
  return current;
}

export interface LevelReward {
  level: number;
  points: number;
  /** Set when this level also unlocks a title. */
  title?: string;
}

export interface CatchGain {
  xp: number;
  isNew: boolean;
  levelBefore: number;
  levelAfter: number;
  rewards: LevelReward[];
  /** Points from all level-ups in this catch. */
  rewardPoints: number;
}

export function xpForCatch(rarity: Rarity, isNew: boolean): number {
  const base = XP_PER_RARITY[rarity];
  return isNew ? Math.round(base * NEW_SPECIES_MULTIPLIER) : base;
}

/** What one landed fish earns, given the XP the player already has. */
export function gainFromCatch(currentXp: number, rarity: Rarity, isNew: boolean): CatchGain {
  const xp = xpForCatch(rarity, isNew);
  const levelBefore = levelFromXp(currentXp).level;
  const levelAfter = levelFromXp(currentXp + xp).level;
  const rewards: LevelReward[] = [];
  for (let level = levelBefore + 1; level <= levelAfter; level++) {
    const unlocked = TITLES.find((t) => t.level === level);
    rewards.push({
      level,
      points: levelRewardPoints(level),
      ...(unlocked ? { title: unlocked.title } : {}),
    });
  }
  return {
    xp,
    isNew,
    levelBefore,
    levelAfter,
    rewards,
    rewardPoints: rewards.reduce((sum, r) => sum + r.points, 0),
  };
}
