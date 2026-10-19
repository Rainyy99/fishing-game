"use client";

import { useEffect, useState } from "react";
import { RARITIES } from "@/game/data";
import {
  ALL_FISH,
  bagCount,
  bagValue,
  fishValue,
  sellAll,
  sellFish,
  withLoadout,
  type BookFish,
} from "@/game/save";
import { updateSave, useSave } from "@/game/store";
import { FishArt } from "./FishArt";
import { GearList } from "./GearPanel";
import { Button } from "./ui/Button";
import { RarityTag } from "./ui/RarityTag";
import { Segmented } from "./ui/Segmented";

/* ---------------------------------------------------------------- Catch */

function CatchRow({ fish, inBag }: { fish: BookFish; inBag: number }) {
  return (
    <li data-testid={`fish-${fish.id}`} className="panel-raised flex items-center gap-3 p-2.5">
      <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-ink">
        <FishArt fish={fish} className="h-auto max-h-14 w-[4.25rem] object-contain" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg leading-tight text-moon">{fish.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <RarityTag rarity={fish.rarity} />
          <span className="text-xs font-bold text-mist">
            x<span data-testid={`bag-${fish.id}`}>{inBag}</span> · {fishValue(fish)} pts each
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="quiet"
            data-testid={`sell1-${fish.id}`}
            onClick={() => updateSave((s) => sellFish(s, fish.id, 1))}
          >
            Sell 1
          </Button>
          {inBag > 1 && (
            <Button
              size="sm"
              data-testid={`sellall-${fish.id}`}
              onClick={() => updateSave((s) => sellFish(s, fish.id, inBag))}
            >
              Sell all {inBag}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

function CatchPage({ onGoFish }: { onGoFish: () => void }) {
  const save = useSave();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  const count = bagCount(save);
  const value = bagValue(save);
  const inBag = ALL_FISH.filter((f) => (save.bag[f.id] ?? 0) > 0).sort(
    (a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity),
  );

  const onSellEverything = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    updateSave(sellAll);
  };

  return (
    <div className="flex flex-col gap-3">
      <section className="panel p-4">
        <p className="text-sm text-mist">In your bag</p>
        <p className="font-display text-3xl leading-tight text-moon">
          <span data-testid="bag-total">{count}</span> fish
          <span className="mx-2 text-brass">·</span>
          <span data-testid="bag-value" className="text-lantern">
            {value} pts
          </span>
        </p>
        <Button
          className="mt-3 w-full"
          variant={confirming ? "alert" : "primary"}
          data-testid="sell-everything"
          disabled={count === 0}
          onClick={onSellEverything}
        >
          {confirming ? `Tap again to sell for ${value} pts` : "Sell everything"}
        </Button>
        <p className="mt-2 text-xs leading-relaxed text-mist">
          Selling turns fish into points. Every species you have landed stays in your journal.
        </p>
      </section>

      {inBag.length === 0 ? (
        <section className="panel flex flex-col items-center gap-3 p-6 text-center">
          <p className="font-display text-2xl text-moon">Your bag is empty</p>
          <p className="max-w-[28ch] text-sm text-mist">Land a fish and it shows up here, ready to sell.</p>
          <Button onClick={onGoFish}>Go fishing</Button>
        </section>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {inBag.map((f) => (
            <CatchRow key={f.id} fish={f} inBag={save.bag[f.id] ?? 0} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Page */

type BagPage = "catch" | "gear";

export function InventoryScreen({ onGoFish }: { onGoFish: () => void }) {
  const save = useSave();
  const [page, setPage] = useState<BagPage>("catch");

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Inventory pages"
        value={page}
        onChange={setPage}
        options={[
          { id: "catch", label: "Catch", count: String(bagCount(save)) },
          { id: "gear", label: "Gear" },
        ]}
      />
      {page === "catch" && <CatchPage onGoFish={onGoFish} />}
      {page === "gear" && (
        <GearList loadout={save.loadout} onChange={(next) => updateSave((s) => withLoadout(s, next))} />
      )}
    </div>
  );
}
