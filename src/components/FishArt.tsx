import type { Fish, Rarity } from "@/game/data";
import { RARITY_INFO } from "@/game/data";
import { FishSvg } from "./FishSvg";

const GLOW: Record<Rarity, (color: string) => string> = {
  common: () => "none",
  uncommon: () => "none",
  rare: (c) => `drop-shadow(0 0 5px ${c}88)`,
  epic: (c) => `drop-shadow(0 0 9px ${c}aa)`,
  legendary: (c) => `drop-shadow(0 0 12px ${c}) drop-shadow(0 0 24px ${c}77)`,
};

/** A fish's artwork. Fish without a painted sprite fall back to the generated drawing. */
export function FishArt({ fish, className }: { fish: Fish; className?: string }) {
  if (!fish.art) {
    return <FishSvg fish={fish} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/art/misty-lake/fish/${fish.art}.png`}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      className={className}
      style={{ filter: GLOW[fish.rarity](RARITY_INFO[fish.rarity].color) }}
    />
  );
}
