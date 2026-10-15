// Pure save-game logic. No browser APIs here, so it is easy to test.

import {
  DEFAULT_LOADOUT,
  LOCATIONS,
  RARITY_INFO,
  type Fish,
} from "./data";
import { resolveStats, type CastOutcome, type Loadout } from "./engine";

export const SAVE_KEY = "fishing-game-save";
const MAX_COUNT = 1_000_000_000;

export interface Stats {
  casts: number;
  catches: number;
  lost: number;
}

export interface SaveData {
  version: 1;
  points: number;
  /** Fish currently in the bag, by fish id. */
  bag: Record<string, number>;
  /** Lifetime catches by fish id. Never goes down; drives the collection book. */
  caught: Record<string, number>;
  stats: Stats;
  loadout: Loadout;
}

export interface BookFish extends Fish {
  locationId: string;
}

export const ALL_FISH: readonly BookFish[] = LOCATIONS.flatMap((location) =>
  location.fish.map((fish) => ({ ...fish, locationId: location.id })),
);

const FISH_BY_ID = new Map(ALL_FISH.map((fish) => [fish.id, fish]));

export const fishValue = (fish: Fish): number => RARITY_INFO[fish.rarity].points;

function defaultLoadout(): Loadout {
  return { ...DEFAULT_LOADOUT, accessoryIds: [...DEFAULT_LOADOUT.accessoryIds] };
}

export function emptySave(): SaveData {
  return {
    version: 1,
    points: 0,
    bag: {},
    caught: {},
    stats: { casts: 0, catches: 0, lost: 0 },
    loadout: defaultLoadout(),
  };
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? Math.min(value, MAX_COUNT)
    : 0;
}

function cleanFishCounts(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return out;
  }
  for (const [id, count] of Object.entries(value)) {
    const n = toCount(count);
    if (n > 0 && FISH_BY_ID.has(id)) {
      out[id] = n;
    }
  }
  return out;
}

function cleanLoadout(value: unknown): Loadout {
  if (typeof value !== "object" || value === null) {
    return defaultLoadout();
  }
  const v = value as Record<string, unknown>;
  const candidate: Loadout = {
    locationId: String(v.locationId),
    rodId: String(v.rodId),
    baitId: String(v.baitId),
    accessoryIds: Array.isArray(v.accessoryIds)
      ? v.accessoryIds.map((id) => String(id))
      : [],
  };
  try {
    resolveStats(candidate);
    return candidate;
  } catch {
    return defaultLoadout();
  }
}

/** Reads a saved game from raw storage text. Anything unusable falls back to a fresh save. */
export function parseSave(raw: string | null): SaveData {
  if (!raw) {
    return emptySave();
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptySave();
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return emptySave();
  }
  const d = data as Record<string, unknown>;
  const stats = (typeof d.stats === "object" && d.stats !== null
    ? d.stats
    : {}) as Record<string, unknown>;

  const bag = cleanFishCounts(d.bag);
  const caught = cleanFishCounts(d.caught);
  for (const [id, count] of Object.entries(bag)) {
    caught[id] = Math.max(caught[id] ?? 0, count);
  }

  return {
    version: 1,
    points: toCount(d.points),
    bag,
    caught,
    stats: {
      casts: toCount(stats.casts),
      catches: toCount(stats.catches),
      lost: toCount(stats.lost),
    },
    loadout: cleanLoadout(d.loadout),
  };
}

export const serializeSave = (save: SaveData): string => JSON.stringify(save);

/** Records one finished cast. A catch goes into the bag; anything else counts as lost. */
export function applyCastResult(
  save: SaveData,
  fishId: string,
  outcome: CastOutcome,
): SaveData {
  const stats = { ...save.stats, casts: save.stats.casts + 1 };
  if (outcome !== "caught" || !FISH_BY_ID.has(fishId)) {
    return { ...save, stats: { ...stats, lost: stats.lost + 1 } };
  }
  return {
    ...save,
    stats: { ...stats, catches: stats.catches + 1 },
    bag: { ...save.bag, [fishId]: (save.bag[fishId] ?? 0) + 1 },
    caught: { ...save.caught, [fishId]: (save.caught[fishId] ?? 0) + 1 },
  };
}

/** Sells up to `count` of one species from the bag for points. */
export function sellFish(save: SaveData, fishId: string, count: number): SaveData {
  const fish = FISH_BY_ID.get(fishId);
  const owned = save.bag[fishId] ?? 0;
  const wanted = Number.isNaN(count) ? 0 : Math.floor(count);
  const n = Math.min(owned, Math.max(0, wanted));
  if (!fish || n === 0) {
    return save;
  }
  const bag = { ...save.bag };
  if (owned - n > 0) {
    bag[fishId] = owned - n;
  } else {
    delete bag[fishId];
  }
  return { ...save, bag, points: save.points + n * fishValue(fish) };
}

export function sellAll(save: SaveData): SaveData {
  let next = save;
  for (const [id, count] of Object.entries(save.bag)) {
    next = sellFish(next, id, count);
  }
  return next;
}

export function bagCount(save: SaveData): number {
  return Object.values(save.bag).reduce((sum, n) => sum + n, 0);
}

export function bagValue(save: SaveData): number {
  let total = 0;
  for (const [id, count] of Object.entries(save.bag)) {
    const fish = FISH_BY_ID.get(id);
    if (fish) {
      total += count * fishValue(fish);
    }
  }
  return total;
}

export function discoveredCount(save: SaveData): number {
  return ALL_FISH.filter((fish) => (save.caught[fish.id] ?? 0) > 0).length;
}

export function withLoadout(save: SaveData, loadout: Loadout): SaveData {
  return { ...save, loadout };
}
