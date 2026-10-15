"use client";

import { useEffect } from "react";
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

interface GearPanelProps {
  loadout: Loadout;
  onChange: (next: Loadout) => void;
  onClose: () => void;
}

const num = (n: number) => String(Number(n.toFixed(2)));

function boostLabel(boost: number): string | null {
  return boost === 1 ? null : `Rare odds x${num(boost)}`;
}

function compact(parts: (string | null)[]): string[] {
  return parts.filter((p): p is string => p !== null);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
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
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  tier?: Tier;
  description: string;
  effects: string[];
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
        selected
          ? "border-sky-300 bg-sky-400/10"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{title}</span>
        <span className="flex items-center gap-2">
          {tier && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              Tier {tier}
            </span>
          )}
          <span
            aria-hidden
            className={`h-4 w-4 rounded-full border-2 ${
              selected ? "border-sky-300 bg-sky-300" : "border-white/30"
            }`}
          />
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-300">{description}</p>
      {effects.length > 0 && (
        <p className="mt-1 text-xs font-semibold text-cyan-300">
          {effects.join(" · ")}
        </p>
      )}
    </button>
  );
}

function OddsBar({ loadout }: { loadout: Loadout }) {
  const stats = resolveStats(loadout);
  const weights = rarityWeights(stats.rarityBoost);
  const total = RARITIES.reduce((sum, r) => sum + weights[r], 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Your catch odds
      </p>
      <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-white/10">
        {RARITIES.map((r) => (
          <div
            key={r}
            style={{
              width: `${(weights[r] / total) * 100}%`,
              backgroundColor: RARITY_INFO[r].color,
            }}
          />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-5 gap-1 text-center">
        {RARITIES.map((r) => (
          <li key={r}>
            <p
              className="text-[10px] font-semibold uppercase"
              style={{ color: RARITY_INFO[r].color }}
            >
              {RARITY_INFO[r].label}
            </p>
            <p
              data-testid={`odds-${r}`}
              className="text-sm font-bold tabular-nums"
            >
              {((weights[r] / total) * 100).toFixed(1)}%
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-400">
        Bite speed x{num(1 / stats.waitMultiplier)} · Tap window +
        {stats.windowBonusMs} ms
        {stats.escapeMultiplier !== 1
          ? ` · Escapes x${num(stats.escapeMultiplier)}`
          : ""}
      </p>
    </div>
  );
}

export function GearPanel({ loadout, onChange, onClose }: GearPanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleAccessory = (id: string, slot: string) => {
    const owned = loadout.accessoryIds.includes(id);
    const withoutSlot = loadout.accessoryIds.filter(
      (existing) => ACCESSORIES.find((a) => a.id === existing)?.slot !== slot,
    );
    onChange({
      ...loadout,
      accessoryIds: owned ? withoutSlot : [...withoutSlot, id],
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gear"
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-slate-950/95 backdrop-blur-sm"
    >
      <div className="w-full max-w-md px-4 pb-10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold tracking-wide">Gear</h1>
          <button
            type="button"
            data-testid="gear-close"
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-4 py-1.5 text-sm font-bold text-slate-950"
          >
            Done
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Everything is free during the beta. Pick what you like.
        </p>

        <div className="mt-4">
          <OddsBar loadout={loadout} />
        </div>

        <Section title="Location">
          {LOCATIONS.map((item) => (
            <Option
              key={item.id}
              testId={`loc-${item.id}`}
              selected={loadout.locationId === item.id}
              onClick={() => onChange({ ...loadout, locationId: item.id })}
              title={item.name}
              tier={item.tier}
              description={item.description}
              effects={compact([
                boostLabel(item.rarityBoost),
                `${item.fish.length} fish`,
              ])}
            />
          ))}
        </Section>

        <Section title="Rod">
          {RODS.map((item) => (
            <Option
              key={item.id}
              testId={`rod-${item.id}`}
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
              selected={loadout.baitId === item.id}
              onClick={() => onChange({ ...loadout, baitId: item.id })}
              title={item.name}
              tier={item.tier}
              description={item.description}
              effects={compact([
                item.waitMultiplier === 1
                  ? null
                  : `Bites ${num(1 / item.waitMultiplier)}x faster`,
                boostLabel(item.rarityBoost),
              ])}
            />
          ))}
        </Section>

        <Section title="Accessories (tap again to remove)">
          {ACCESSORIES.map((item) => (
            <Option
              key={item.id}
              testId={`acc-${item.id}`}
              selected={loadout.accessoryIds.includes(item.id)}
              onClick={() => toggleAccessory(item.id, item.slot)}
              title={item.name}
              tier={item.tier}
              description={item.description}
              effects={compact([
                item.windowBonusMs > 0
                  ? `Tap window +${item.windowBonusMs} ms`
                  : null,
                item.escapeMultiplier !== 1
                  ? `Escapes x${num(item.escapeMultiplier)}`
                  : null,
                boostLabel(item.rarityBoost),
              ])}
            />
          ))}
        </Section>
      </div>
    </div>
  );
}
