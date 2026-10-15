"use client";

import { useEffect, useState } from "react";
import { LOCATIONS, RARITY_INFO } from "@/game/data";
import {
  ALL_FISH,
  bagCount,
  bagValue,
  discoveredCount,
  fishValue,
  sellAll,
  sellFish,
  type BookFish,
} from "@/game/save";
import { updateSave, useSave } from "@/game/store";
import { FishSvg } from "./FishSvg";

function FishCard({
  fish,
  inBag,
  caught,
}: {
  fish: BookFish;
  inBag: number;
  caught: number;
}) {
  const info = RARITY_INFO[fish.rarity];
  const found = caught > 0;
  const price = fishValue(fish);

  return (
    <li
      data-testid={`fish-${fish.id}`}
      data-found={found}
      className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-2.5"
      style={found ? { borderColor: `${info.color}66` } : undefined}
    >
      <div
        className="flex h-16 items-center justify-center"
        style={found ? undefined : { filter: "brightness(0)", opacity: 0.35 }}
      >
        <FishSvg fish={fish} className="h-auto w-24" />
      </div>
      <p className="mt-1 truncate text-sm font-bold">{found ? fish.name : "???"}</p>
      <p
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: info.color }}
      >
        {info.label}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {found ? `Caught ${caught} · ${price} pts each` : "Not caught yet"}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-200">
        In bag: <span data-testid={`bag-${fish.id}`}>{inBag}</span>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          data-testid={`sell1-${fish.id}`}
          disabled={inBag === 0}
          onClick={() => updateSave((s) => sellFish(s, fish.id, 1))}
          className="h-9 rounded-lg bg-white/10 text-xs font-bold text-slate-100 disabled:opacity-30"
        >
          Sell 1
        </button>
        <button
          type="button"
          data-testid={`sellall-${fish.id}`}
          disabled={inBag === 0}
          onClick={() => updateSave((s) => sellFish(s, fish.id, inBag))}
          className="h-9 rounded-lg bg-amber-300/90 text-xs font-bold text-slate-950 disabled:opacity-30"
        >
          Sell all
        </button>
      </div>
    </li>
  );
}

export function InventoryScreen() {
  const save = useSave();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) {
      return;
    }
    const id = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  const count = bagCount(save);
  const value = bagValue(save);
  const found = discoveredCount(save);

  const onSellEverything = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    updateSave(sellAll);
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Your bag
            </p>
            <p className="mt-1 text-lg font-extrabold">
              <span data-testid="bag-total">{count}</span> fish ·{" "}
              <span data-testid="bag-value" className="text-amber-300">
                {value} pts
              </span>
            </p>
          </div>
          <button
            type="button"
            data-testid="sell-everything"
            disabled={count === 0}
            onClick={onSellEverything}
            className={`h-10 shrink-0 rounded-xl px-3 text-sm font-bold disabled:opacity-30 ${
              confirming
                ? "bg-rose-500 text-white"
                : "bg-gradient-to-r from-amber-300 to-yellow-200 text-slate-950"
            }`}
          >
            {confirming ? `Confirm: sell for ${value}` : "Sell everything"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Selling turns fish into points. Fish you have caught stay in your
          collection book even after you sell them.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Collection book
          </h2>
          <p className="text-xs font-semibold text-slate-300">
            <span data-testid="book-found">{found}</span> / {ALL_FISH.length}{" "}
            found
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
            style={{ width: `${(found / ALL_FISH.length) * 100}%` }}
          />
        </div>
      </section>

      {LOCATIONS.map((location) => {
        const fish = ALL_FISH.filter((f) => f.locationId === location.id);
        const locFound = fish.filter((f) => (save.caught[f.id] ?? 0) > 0).length;
        return (
          <section key={location.id}>
            <div className="flex items-baseline justify-between">
              <h3 className="font-bold">{location.name}</h3>
              <p className="text-xs text-slate-400">
                {locFound} / {fish.length}
              </p>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {fish.map((f) => (
                <FishCard
                  key={f.id}
                  fish={f}
                  inBag={save.bag[f.id] ?? 0}
                  caught={save.caught[f.id] ?? 0}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
