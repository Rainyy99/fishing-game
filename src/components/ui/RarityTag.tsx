import { RARITY_INFO, type Rarity } from "@/game/data";

/** Rarity badge. The colour is backed by the word, so it never relies on colour alone. */
export function RarityTag({ rarity }: { rarity: Rarity }) {
  const { label, color } = RARITY_INFO[rarity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-line px-2 py-0.5 text-xs font-extrabold"
      style={{ backgroundColor: `${color}26`, color }}
    >
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
