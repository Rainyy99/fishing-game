// Game data for the fishing game (phase 1: everything is free and unlocked).
// `tier` is kept on every item so phase 2 can attach token prices/unlocks.

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITIES: readonly Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export interface RarityInfo {
  label: string;
  /** Base drop weight (all weights sum to 100). */
  baseWeight: number;
  /** Points granted when the fish is caught. */
  points: number;
  /** Time (ms) the player has to tap once the fish bites. */
  biteWindowMs: number;
  /** Chance the fish escapes even after a well-timed tap. */
  escapeChance: number;
  color: string;
}

export const RARITY_INFO: Record<Rarity, RarityInfo> = {
  common: { label: "Common", baseWeight: 60, points: 1, biteWindowMs: 1400, escapeChance: 0, color: "#9aa5b1" },
  uncommon: { label: "Uncommon", baseWeight: 25, points: 3, biteWindowMs: 1200, escapeChance: 0, color: "#4ade80" },
  rare: { label: "Rare", baseWeight: 10, points: 10, biteWindowMs: 1000, escapeChance: 0.15, color: "#60a5fa" },
  epic: { label: "Epic", baseWeight: 4, points: 40, biteWindowMs: 800, escapeChance: 0.25, color: "#c084fc" },
  legendary: { label: "Legendary", baseWeight: 1, points: 150, biteWindowMs: 600, escapeChance: 0.4, color: "#fbbf24" },
};

export const GAME_CONFIG = {
  /** Random wait before a bite, before the bait multiplier is applied. */
  biteWaitMinMs: 2000,
  biteWaitMaxMs: 5000,
} as const;

export type Tier = 1 | 2 | 3;

export interface Fish {
  id: string;
  name: string;
  rarity: Rarity;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  /** Multiplies the odds of non-common fish. */
  rarityBoost: number;
  fish: readonly Fish[];
}

export interface Rod {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  /** Multiplies the odds of non-common fish. */
  rarityBoost: number;
}

export interface Bait {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  /** Multiplies the wait time before a bite (lower is faster). */
  waitMultiplier: number;
  /** Multiplies the odds of non-common fish. */
  rarityBoost: number;
}

export type AccessorySlot = "reel" | "line" | "charm";

export interface Accessory {
  id: string;
  name: string;
  description: string;
  slot: AccessorySlot;
  tier: Tier;
  /** Extra time (ms) added to the tap window. */
  windowBonusMs: number;
  /** Multiplies the escape chance of rare+ fish (lower is better). */
  escapeMultiplier: number;
  /** Multiplies the odds of non-common fish. */
  rarityBoost: number;
}

export const LOCATIONS: readonly Location[] = [
  {
    id: "river",
    name: "Quiet River",
    description: "Calm, shallow water. A good place to learn the ropes.",
    tier: 1,
    rarityBoost: 1,
    fish: [
      { id: "minnow", name: "Minnow", rarity: "common" },
      { id: "river-perch", name: "River Perch", rarity: "common" },
      { id: "silver-trout", name: "Silver Trout", rarity: "uncommon" },
      { id: "brook-carp", name: "Brook Carp", rarity: "uncommon" },
      { id: "golden-catfish", name: "Golden Catfish", rarity: "rare" },
      { id: "moonlit-salmon", name: "Moonlit Salmon", rarity: "epic" },
      { id: "river-king-sturgeon", name: "River King Sturgeon", rarity: "legendary" },
    ],
  },
  {
    id: "lake",
    name: "Misty Lake",
    description: "Deeper water with bigger fish hiding in the reeds.",
    tier: 2,
    rarityBoost: 1.1,
    fish: [
      { id: "bluegill", name: "Bluegill", rarity: "common" },
      { id: "reed-sunfish", name: "Reed Sunfish", rarity: "common" },
      { id: "lake-bass", name: "Lake Bass", rarity: "uncommon" },
      { id: "northern-pike", name: "Northern Pike", rarity: "uncommon" },
      { id: "amber-walleye", name: "Amber Walleye", rarity: "rare" },
      { id: "crystal-trout", name: "Crystal Trout", rarity: "epic" },
      { id: "lake-dragon-eel", name: "Lake Dragon Eel", rarity: "legendary" },
    ],
  },
  {
    id: "deep-sea",
    name: "Deep Sea",
    description: "Dark open water where the rarest catches live.",
    tier: 3,
    rarityBoost: 1.25,
    fish: [
      { id: "sardine", name: "Sardine", rarity: "common" },
      { id: "mackerel", name: "Mackerel", rarity: "common" },
      { id: "red-snapper", name: "Red Snapper", rarity: "uncommon" },
      { id: "barracuda", name: "Barracuda", rarity: "uncommon" },
      { id: "swordfish", name: "Swordfish", rarity: "rare" },
      { id: "anglerfish", name: "Anglerfish", rarity: "epic" },
      { id: "abyssal-manta", name: "Abyssal Manta", rarity: "legendary" },
    ],
  },
];

export const RODS: readonly Rod[] = [
  {
    id: "bamboo-rod",
    name: "Bamboo Rod",
    description: "Simple and reliable. Every angler starts here.",
    tier: 1,
    rarityBoost: 1,
  },
  {
    id: "fiberglass-rod",
    name: "Fiberglass Rod",
    description: "Light and flexible, with a better shot at rare fish.",
    tier: 2,
    rarityBoost: 1.25,
  },
  {
    id: "carbon-rod",
    name: "Carbon Rod",
    description: "Professional grade. Rare fish notice it.",
    tier: 3,
    rarityBoost: 1.6,
  },
];

export const BAITS: readonly Bait[] = [
  {
    id: "garden-worm",
    name: "Garden Worm",
    description: "The classic. Nothing fancy.",
    tier: 1,
    waitMultiplier: 1,
    rarityBoost: 1,
  },
  {
    id: "spiced-shrimp",
    name: "Spiced Shrimp",
    description: "Strong smell. Fish bite sooner.",
    tier: 2,
    waitMultiplier: 0.8,
    rarityBoost: 1.1,
  },
  {
    id: "glow-lure",
    name: "Glow Lure",
    description: "Glows in the dark and draws fish quickly.",
    tier: 3,
    waitMultiplier: 0.65,
    rarityBoost: 1.2,
  },
];

export const ACCESSORIES: readonly Accessory[] = [
  {
    id: "quick-reel",
    name: "Quick Reel",
    description: "Wider tap window when a fish bites.",
    slot: "reel",
    tier: 2,
    windowBonusMs: 300,
    escapeMultiplier: 1,
    rarityBoost: 1,
  },
  {
    id: "steel-line",
    name: "Steel Line",
    description: "Halves the chance that rare fish slip away.",
    slot: "line",
    tier: 2,
    windowBonusMs: 0,
    escapeMultiplier: 0.5,
    rarityBoost: 1,
  },
  {
    id: "lucky-charm",
    name: "Lucky Charm",
    description: "A small boost to your odds of rare fish.",
    slot: "charm",
    tier: 2,
    windowBonusMs: 0,
    escapeMultiplier: 1,
    rarityBoost: 1.15,
  },
];

export const DEFAULT_LOADOUT = {
  locationId: "river",
  rodId: "bamboo-rod",
  baitId: "garden-worm",
  /** One optional accessory per slot. */
  accessoryIds: [] as string[],
};

function findById<T extends { id: string }>(
  list: readonly T[],
  id: string,
  kind: string,
): T {
  const found = list.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Unknown ${kind} id: ${id}`);
  }
  return found;
}

export const getLocation = (id: string) => findById(LOCATIONS, id, "location");
export const getRod = (id: string) => findById(RODS, id, "rod");
export const getBait = (id: string) => findById(BAITS, id, "bait");
export const getAccessory = (id: string) =>
  findById(ACCESSORIES, id, "accessory");
