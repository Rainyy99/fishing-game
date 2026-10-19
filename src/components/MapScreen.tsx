"use client";

import { LOCATIONS } from "@/game/data";
import { ALL_FISH, withLoadout } from "@/game/save";
import { updateSave, useSave } from "@/game/store";
import { Button } from "./ui/Button";

/** Pick where to fish. Maps without fish art yet are shown as coming soon. */
export function MapScreen({ onGoFish }: { onGoFish: () => void }) {
  const save = useSave();

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-mist">Each map has its own fish. Travel to change where your line goes.</p>
      {[...LOCATIONS].sort((a, b) => Number(!!a.comingSoon) - Number(!!b.comingSoon)).map((location) => {
        const fish = ALL_FISH.filter((f) => f.locationId === location.id);
        const found = fish.filter((f) => (save.caught[f.id] ?? 0) > 0).length;
        const current = save.loadout.locationId === location.id;
        return (
          <section
            key={location.id}
            data-testid={`map-${location.id}`}
            className={`panel overflow-hidden p-0 ${location.comingSoon ? "opacity-80" : ""}`}
            style={current ? { borderColor: "var(--color-lantern)" } : undefined}
          >
            <div className="relative h-28 bg-ink">
              {location.comingSoon ? (
                <div className="flex h-full items-center justify-center bg-gradient-to-b from-lake-2 to-ink text-mist">
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/art/maps/${location.id}.jpg`} alt="" draggable={false} className="h-full w-full object-cover" />
              )}
              <span className="absolute right-2 top-2 rounded-full border-2 border-line bg-ink/90 px-2.5 py-0.5 text-[11px] font-extrabold text-moon">
                {location.comingSoon ? "Coming soon" : current ? "You are here" : `Tier ${location.tier}`}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-display text-2xl leading-tight text-moon">{location.name}</h3>
              <p className="mt-0.5 text-sm leading-snug text-mist">{location.description}</p>
              {!location.comingSoon && (
                <>
                  <div className="mt-2.5 h-2.5 overflow-hidden rounded-full border-2 border-line bg-ink">
                    <div className="h-full bg-lantern" style={{ width: `${(found / fish.length) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-mist">
                    {found} of {fish.length} fish found
                  </p>
                  <Button
                    className="mt-3 w-full"
                    variant={current ? "quiet" : "primary"}
                    onClick={() => {
                      if (!current) updateSave((s) => withLoadout(s, { ...s.loadout, locationId: location.id }));
                      onGoFish();
                    }}
                  >
                    {current ? "Keep fishing here" : "Travel here"}
                  </Button>
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
