"use client";

import { RARITIES, RARITY_INFO } from "@/game/data";
import { MAX_LEVEL, TITLES, levelFromXp, levelRewardPoints, titleForLevel } from "@/game/progress";
import { useState } from "react";
import { NAME_MAX, PLAYABLE_FISH, NAME_MIN, cleanName, discoveredCount } from "@/game/save";
import { updateSave, useSave } from "@/game/store";
import { FishArt } from "./FishArt";
import { Portrait } from "./Portrait";
import { RarityTag } from "./ui/RarityTag";

function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="panel-raised flex flex-col items-center gap-0.5 px-2 py-2.5 text-center">
      <span data-testid={testId} className="font-display text-2xl leading-none text-moon">
        {value}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-mist">{label}</span>
    </div>
  );
}

function NameEditor({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const valid = cleanName(draft);

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <p className="lettered min-w-0 break-words text-2xl leading-tight" data-testid="profile-name">
          {name}
        </p>
        <button
          type="button"
          data-testid="name-edit"
          aria-label="Change name"
          onClick={() => {
            setDraft(name);
            setEditing(true);
          }}
          className="btn btn-quiet flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          </svg>
        </button>
      </div>
    );
  }

  const save = () => {
    if (!valid) return;
    updateSave((s) => ({ ...s, name: valid }));
    setEditing(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-1.5"
    >
      <input
        data-testid="name-input"
        aria-label="Player name"
        autoFocus
        value={draft}
        maxLength={NAME_MAX}
        onChange={(e) => setDraft(e.target.value)}
        className="h-10 w-full rounded-xl border-3 border-line bg-ink px-3 text-lg font-extrabold text-moon outline-none focus:border-lantern"
      />
      <div className="flex items-center gap-2">
        <button type="submit" data-testid="name-save" disabled={!valid} className="btn btn-primary h-9 px-4 text-sm">
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="btn btn-quiet h-9 px-3 text-sm">
          Cancel
        </button>
      </div>
      {!valid && (
        <p className="text-xs text-signal">
          {NAME_MIN}-{NAME_MAX} letters, numbers, spaces, _ or -.
        </p>
      )}
    </form>
  );
}

export function ProfileScreen() {
  const save = useSave();
  const info = levelFromXp(save.xp);
  const title = titleForLevel(info.level);
  const { casts, catches, lost } = save.stats;

  const nextLevel = info.level + 1;
  const nextTitle = TITLES.find((t) => t.level === nextLevel)?.title;
  const upcomingTitle = TITLES.find((t) => t.level > info.level);

  const rarest = PLAYABLE_FISH.filter((f) => (save.caught[f.id] ?? 0) > 0).reduce<(typeof PLAYABLE_FISH)[number] | null>(
    (best, f) => (best === null || RARITIES.indexOf(f.rarity) > RARITIES.indexOf(best.rarity) ? f : best),
    null,
  );

  const rate = casts > 0 ? `${Math.round((catches / casts) * 100)}%` : "–";

  return (
    <div className="flex flex-col gap-3" data-testid="profile">
      <section className="panel flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <Portrait size={84} />
          <div className="min-w-0 flex-1">
            <NameEditor key={save.name} name={save.name} />
            <p className="mt-1 text-sm font-extrabold text-lantern" data-testid="profile-title">
              {title}
            </p>
          </div>
          <span className="font-display flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-3 border-line bg-lantern leading-none text-line">
            <span className="text-[10px] font-extrabold">LV</span>
            <span className="text-2xl" data-testid="profile-level">
              {info.level}
            </span>
          </span>
        </div>

        <div>
          <div
            role="progressbar"
            aria-label="Level progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(info.fraction * 100)}
            className="h-4 overflow-hidden rounded-full border-2 border-line bg-lake"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3fd6a0] to-[#7fe8ff]"
              style={{ width: `${info.fraction * 100}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs font-bold text-mist" data-testid="profile-xp">
            {info.needed > 0 ? `${info.into} / ${info.needed} XP` : "Max level"}
          </p>
        </div>

        {info.level < MAX_LEVEL && (
          <p className="rounded-xl border-2 border-line bg-ink/50 px-3 py-2 text-sm text-mist">
            Next: <b className="text-moon">Level {nextLevel}</b> pays{" "}
            <b className="text-lantern">+{levelRewardPoints(nextLevel)} pts</b>
            {nextTitle ? (
              <>
                {" "}
                and the title <b className="text-moon">{nextTitle}</b>
              </>
            ) : null}
            .
          </p>
        )}
      </section>

      <section aria-label="Stats" className="grid grid-cols-3 gap-2">
        <Stat label="Fish caught" value={String(catches)} testId="stat-catches" />
        <Stat label="Species" value={`${discoveredCount(save)}/${PLAYABLE_FISH.length}`} testId="stat-species" />
        <Stat label="Casts" value={String(casts)} testId="stat-casts" />
        <Stat label="Got away" value={String(lost)} testId="stat-lost" />
        <Stat label="Success" value={rate} testId="stat-rate" />
        <Stat label="Points" value={String(save.points)} testId="stat-points" />
      </section>

      <section className="panel p-3" aria-label="Rarest catch">
        <h2 className="font-display mb-2 text-lg text-moon">Rarest catch</h2>
        {rarest ? (
          <div className="flex items-center gap-3">
            <div
              className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl border-2 border-line"
              style={{ background: `radial-gradient(circle at 50% 40%, ${RARITY_INFO[rarest.rarity].color}33, var(--color-ink) 75%)` }}
            >
              <FishArt fish={rarest} className="h-auto max-h-16 w-24 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="lettered text-2xl leading-tight">{rarest.name}</p>
              <RarityTag rarity={rarest.rarity} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-mist">Land your first fish and it will show up here.</p>
        )}
      </section>

      <section className="panel p-3" aria-label="Titles">
        <h2 className="font-display mb-2 text-lg text-moon">Titles</h2>
        <ul className="flex flex-col gap-1.5">
          {TITLES.map((t) => {
            const open = info.level >= t.level;
            const current = open && t.title === title;
            return (
              <li
                key={t.title}
                className={`flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-1.5 text-sm ${
                  current ? "border-lantern bg-lantern/15" : "border-line bg-ink/40"
                } ${open ? "text-moon" : "text-mist/60"}`}
              >
                <span className="font-extrabold">{open ? t.title : "???"}</span>
                <span className="text-xs font-bold">{current ? "Wearing" : open ? "Unlocked" : `Level ${t.level}`}</span>
              </li>
            );
          })}
        </ul>
        {upcomingTitle && (
          <p className="mt-2 text-xs text-mist">Next title at level {upcomingTitle.level}.</p>
        )}
      </section>
    </div>
  );
}
