"use client";

import type { ReactNode } from "react";
import {
  ACCESSORIES,
  BAITS,
  LOCATIONS,
  RARITIES,
  RARITY_INFO,
  RODS,
  type Tier,
} from "@/game/data";
import { rarityWeights, resolveStats, type Loadout } from "@/game/engine";
import { Sheet } from "./ui/Sheet";

const num = (n: number) => String(Number(n.toFixed(2)));

function boostLabel(boost: number): string | null {
  return boost === 1 ? null : `Rare odds x${num(boost)}`;
}

function compact(parts: (string | null)[]): string[] {
  return parts.filter((p): p is string => p !== null);
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-display text-xl text-moon">{title}</h3>
      {hint && <p className="text-xs text-mist">{hint}</p>}
      <div className="mt-2 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function Option({
  selected,
  onClick,
  title,
  tier,
  description,
  effects,
  testId,
  icon,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  tier?: Tier;
  description: string;
  effects: string[];
  testId: string;
  icon?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`panel-raised flex items-center gap-3 p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon disabled:opacity-50 ${
        selected ? "!border-lantern !bg-lake-3" : ""
      }`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-ink">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" draggable={false} className="h-11 w-11 object-contain" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-mist" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display text-lg leading-tight text-moon">{title}</span>
          {disabled ? (
            <span className="shrink-0 rounded-full border-2 border-line bg-lantern px-2 py-px text-[10px] font-extrabold text-line">
              Coming soon
            </span>
          ) : (
            selected && (
              <span className="shrink-0 rounded-full border-2 border-line bg-lantern px-2 py-px text-[10px] font-extrabold text-line">
                Equipped
              </span>
            )
          )}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-mist">{description}</span>
        {(effects.length > 0 || (tier && !disabled)) && (
          <span className="mt-1 block text-xs font-bold text-lantern">
            {compact([tier && !disabled ? `Tier ${tier}` : null, ...effects]).join(" · ")}
          </span>
        )}
      </span>
    </button>
  );
}

function OddsBar({ loadout }: { loadout: Loadout }) {
  const stats = resolveStats(loadout);
  const weights = rarityWeights(stats.rarityBoost);
  const total = RARITIES.reduce((sum, r) => sum + weights[r], 0);

  return (
    <div className="panel-raised p-3">
      <p className="font-display text-lg text-moon">Your catch odds</p>
      <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full border-2 border-line bg-ink">
        {RARITIES.map((r) => (
          <div
            key={r}
            style={{ width: `${(weights[r] / total) * 100}%`, backgroundColor: RARITY_INFO[r].color }}
          />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-5 gap-1 text-center">
        {RARITIES.map((r) => (
          <li key={r}>
            <p className="text-[11px] font-extrabold" style={{ color: RARITY_INFO[r].color }}>
              {RARITY_INFO[r].label}
            </p>
            <p data-testid={`odds-${r}`} className="text-sm font-bold tabular-nums text-moon">
              {((weights[r] / total) * 100).toFixed(1)}%
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface GearListProps {
  loadout: Loadout;
  onChange: (next: Loadout) => void;
}

/** Everything the player can equip, with the resulting catch odds on top. */
export function GearList({ loadout, onChange }: GearListProps) {
  const toggleAccessory = (id: string, slot: string) => {
    const owned = loadout.accessoryIds.includes(id);
    const withoutSlot = loadout.accessoryIds.filter(
      (existing) => ACCESSORIES.find((a) => a.id === existing)?.slot !== slot,
    );
    onChange({ ...loadout, accessoryIds: owned ? withoutSlot : [...withoutSlot, id] });
  };

  return (
    <div>
      <OddsBar loadout={loadout} />

      <Section title="Map">
        {LOCATIONS.map((item) => (
          <Option
            key={item.id}
            testId={`loc-${item.id}`}
            icon={item.comingSoon ? undefined : `/art/maps/${item.id}.jpg`}
            selected={loadout.locationId === item.id}
            disabled={item.comingSoon}
            onClick={() => onChange({ ...loadout, locationId: item.id })}
            title={item.name}
            description={item.description}
            effects={[]}
          />
        ))}
      </Section>

      <Section title="Rod">
        {RODS.map((item) => (
          <Option
            key={item.id}
            testId={`rod-${item.id}`}
            icon={`/art/items/${item.id}.png`}
            selected={loadout.rodId === item.id}
            onClick={() => onChange({ ...loadout, rodId: item.id })}
            title={item.name}
            tier={item.tier}
            description={item.description}
            effects={compact([boostLabel(item.rarityBoost)])}
          />
        ))}
      </Section>

      <Section title="Bait">
        {BAITS.map((item) => (
          <Option
            key={item.id}
            testId={`bait-${item.id}`}
            icon={`/art/items/${item.id}.png`}
            selected={loadout.baitId === item.id}
            onClick={() => onChange({ ...loadout, baitId: item.id })}
            title={item.name}
            tier={item.tier}
            description={item.description}
            effects={compact([
              item.waitMultiplier === 1 ? null : `Bites ${num(1 / item.waitMultiplier)}x faster`,
              boostLabel(item.rarityBoost),
            ])}
          />
        ))}
      </Section>

      <Section title="Accessories" hint="Tap an equipped one again to remove it.">
        {ACCESSORIES.map((item) => (
          <Option
            key={item.id}
            testId={`acc-${item.id}`}
            icon={`/art/items/${item.id}.png`}
            selected={loadout.accessoryIds.includes(item.id)}
            onClick={() => toggleAccessory(item.id, item.slot)}
            title={item.name}
            tier={item.tier}
            description={item.description}
            effects={compact([
              item.windowBonusMs > 0 ? `Hook window +${item.windowBonusMs} ms` : null,
              item.escapeMultiplier !== 1 ? `Fish pull back x${num(item.escapeMultiplier)}` : null,
              boostLabel(item.rarityBoost),
            ])}
          />
        ))}
      </Section>
    </div>
  );
}

interface GearPanelProps extends GearListProps {
  onClose: () => void;
}

export function GearPanel({ loadout, onChange, onClose }: GearPanelProps) {
  return (
    <Sheet title="Gear" onClose={onClose} testId="gear-sheet" closeTestId="gear-close">
      <p className="text-sm text-mist">Everything is free during the beta. Pick what you like.</p>
      <div className="mt-3">
        <GearList loadout={loadout} onChange={onChange} />
      </div>
    </Sheet>
  );
}
