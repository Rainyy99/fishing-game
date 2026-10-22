"use client";

import { useState } from "react";
import { LOCATIONS, RARITIES, RARITY_INFO, getLocation, type Rarity } from "@/game/data";
import { JOURNAL } from "@/game/journal";
import { ALL_FISH, PLAYABLE_FISH, catchChance, discoveredCount, fishValue, sellFish, type BookFish } from "@/game/save";
import { updateSave, useSave } from "@/game/store";
import { FishArt } from "./FishArt";
import { Button } from "./ui/Button";
import { RarityTag } from "./ui/RarityTag";
import { Segmented } from "./ui/Segmented";
import { Sheet } from "./ui/Sheet";

type View = "collection" | "list";

/** Chance that a single cast lands this exact species, with the equipped gear. */
function useCatchChance() {
  const save = useSave();
  return (fish: BookFish) => catchChance(save.loadout, fish.id);
}

function FishDetail({ fish, onClose }: { fish: BookFish; onClose: () => void }) {
  const save = useSave();
  const chance = useCatchChance();
  const info = RARITY_INFO[fish.rarity];
  const entry = JOURNAL[fish.id];
  const caught = save.caught[fish.id] ?? 0;
  const inBag = save.bag[fish.id] ?? 0;
  const found = caught > 0;

  return (
    <Sheet title={found ? fish.name : "Unknown fish"} onClose={onClose} testId="fish-detail">
      <div
        className="flex items-center justify-center rounded-2xl border-3 border-line px-4 py-5"
        style={{ background: `radial-gradient(circle at 50% 40%, ${info.color}33, var(--color-ink) 70%)` }}
      >
        <div style={found ? undefined : { filter: "brightness(0)", opacity: 0.4 }}>
          <FishArt fish={fish} className="h-auto max-h-40 w-60 object-contain" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <RarityTag rarity={fish.rarity} />
        {found && entry && <span className="text-sm italic text-mist">{entry.latin}</span>}
      </div>

      {found && entry ? (
        <>
          <p className="mt-3 text-base leading-relaxed text-[#dcebf3]">{entry.note}</p>
          {entry.size && (
            <p className="mt-3 text-sm text-mist">
              <span className="font-bold text-moon">Size</span> · {entry.size}
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-base leading-relaxed text-[#dcebf3]">
          You have not landed this one yet. It lives in {getLocation(fish.locationId).name}. Better rods and baits raise
          your odds of rarer fish.
        </p>
      )}

      <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[
          ["Caught", String(caught)],
          ["In bag", String(inBag)],
          ["Worth", `${fishValue(fish)}`],
          ["Chance", `${chance(fish).toFixed(1)}%`],
        ].map(([label, value]) => (
          <div key={label} className="panel-raised p-2">
            <dt className="text-[11px] text-mist">{label}</dt>
            <dd className="font-display text-lg leading-tight text-moon">{value}</dd>
          </div>
        ))}
      </dl>

      {inBag > 0 && (
        <div className="mt-4 flex gap-2">
          <Button variant="quiet" className="flex-1" onClick={() => updateSave((s) => sellFish(s, fish.id, 1))}>
            Sell 1
          </Button>
          <Button className="flex-1" onClick={() => updateSave((s) => sellFish(s, fish.id, inBag))}>
            Sell all {inBag}
          </Button>
        </div>
      )}
    </Sheet>
  );
}

function Tile({ fish, found, onOpen }: { fish: BookFish; found: boolean; onOpen: () => void }) {
  const info = RARITY_INFO[fish.rarity];
  return (
    <li>
      <button
        type="button"
        data-testid={`fish-${fish.id}`}
        data-found={found}
        onClick={onOpen}
        aria-label={found ? `${fish.name}, ${info.label}` : `Unknown ${info.label} fish`}
        className="panel-raised flex w-full flex-col items-center p-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon"
        style={found ? { borderColor: info.color } : undefined}
      >
        <span className="flex h-20 w-full items-center justify-center rounded-lg bg-ink">
          <span style={found ? undefined : { filter: "brightness(0)", opacity: 0.35 }}>
            <FishArt fish={fish} className="h-auto max-h-16 w-28 object-contain" />
          </span>
        </span>
        <span className="mt-1.5 w-full truncate font-display text-base leading-tight text-moon">
          {found ? fish.name : "???"}
        </span>
        <span className="text-[11px] font-extrabold" style={{ color: info.color }}>
          {info.label}
        </span>
      </button>
    </li>
  );
}

function Row({ fish, found, caught, chance, onOpen }: { fish: BookFish; found: boolean; caught: number; chance: number; onOpen: () => void }) {
  const info = RARITY_INFO[fish.rarity];
  return (
    <li>
      <button
        type="button"
        data-testid={`row-${fish.id}`}
        onClick={onOpen}
        className="panel-raised flex w-full items-center gap-3 p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon"
      >
        <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-ink">
          <span style={found ? undefined : { filter: "brightness(0)", opacity: 0.35 }}>
            <FishArt fish={fish} className="h-auto max-h-10 w-14 object-contain" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base leading-tight text-moon">{found ? fish.name : "???"}</span>
          <span className="text-xs font-extrabold" style={{ color: info.color }}>
            {info.label}
          </span>
        </span>
        <span className="text-right">
          <span className="block font-display text-base leading-tight text-moon">{chance.toFixed(1)}%</span>
          <span className="text-[11px] text-mist">{found ? `Caught ${caught}` : "Not caught"}</span>
        </span>
      </button>
    </li>
  );
}

export function JournalScreen() {
  const save = useSave();
  const chance = useCatchChance();
  const [view, setView] = useState<View>("collection");
  const [filter, setFilter] = useState<Rarity | "all">("all");
  const [open, setOpen] = useState<BookFish | null>(null);
  const found = discoveredCount(save);
  const total = PLAYABLE_FISH.length;

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Journal views"
        value={view}
        onChange={setView}
        options={[
          { id: "collection", label: "Collection" },
          { id: "list", label: "Fish list" },
        ]}
      />

      <section className="panel p-4">
        <div className="flex items-end justify-between gap-3">
          <p className="font-display text-2xl text-moon">{view === "collection" ? "Collection book" : "All species"}</p>
          <p className="text-sm font-bold text-mist">
            <span data-testid="book-found" className="text-lantern">
              {found}
            </span>{" "}
            of {total} found
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by rarity">
          {(["all", ...RARITIES] as const).map((r) => {
            const active = filter === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(r)}
                className={`rounded-full border-2 border-line px-3 py-1 text-xs font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-moon ${
                  active ? "bg-lantern text-line" : "bg-ink text-mist"
                }`}
              >
                {r === "all" ? "All" : RARITY_INFO[r].label}
              </button>
            );
          })}
        </div>
      </section>

      {[...LOCATIONS].sort((a, b) => Number(!!a.comingSoon) - Number(!!b.comingSoon)).map((location) => {
        if (location.comingSoon) {
          return (
            <section key={location.id} className="panel flex items-center justify-between gap-3 p-4 opacity-80">
              <div>
                <h3 className="font-display text-xl text-moon">{location.name}</h3>
                <p className="text-xs text-mist">New fish are being drawn for this map.</p>
              </div>
              <span className="shrink-0 rounded-full border-2 border-line bg-lantern px-2.5 py-0.5 text-[11px] font-extrabold text-line">
                Coming soon
              </span>
            </section>
          );
        }
        const all = ALL_FISH.filter((f) => f.locationId === location.id);
        const fish = all.filter((f) => filter === "all" || f.rarity === filter);
        const locFound = all.filter((f) => (save.caught[f.id] ?? 0) > 0).length;
        return (
          <section key={location.id}>
            <div className="flex items-baseline justify-between px-1">
              <h3 className="font-display text-xl text-moon">{location.name}</h3>
              <p className="text-xs font-bold text-mist">
                {locFound} / {all.length}
              </p>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border-2 border-line bg-ink">
              <div className="h-full bg-lantern" style={{ width: `${(locFound / all.length) * 100}%` }} />
            </div>
            {fish.length === 0 ? (
              <p className="mt-3 text-sm text-mist">No fish of this rarity here.</p>
            ) : view === "collection" ? (
              <ul className="mt-3 grid grid-cols-2 gap-2.5">
                {fish.map((f) => (
                  <Tile key={f.id} fish={f} found={(save.caught[f.id] ?? 0) > 0} onOpen={() => setOpen(f)} />
                ))}
              </ul>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {fish.map((f) => (
                  <Row
                    key={f.id}
                    fish={f}
                    found={(save.caught[f.id] ?? 0) > 0}
                    caught={save.caught[f.id] ?? 0}
                    chance={chance(f)}
                    onOpen={() => setOpen(f)}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {open && <FishDetail fish={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
