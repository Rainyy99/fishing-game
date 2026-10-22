"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { RARITY_INFO, type Fish, type Rarity } from "@/game/data";
import { fishValue } from "@/game/save";
import { MAX_LEVEL, levelFromXp, xpForLevel, type CatchGain } from "@/game/progress";
import { FishArt } from "./FishArt";
import { Button } from "./ui/Button";
import { RarityTag } from "./ui/RarityTag";

const CATCH_TITLE: Record<Rarity, string> = {
  common: "Fresh from the Mist!",
  uncommon: "Good Haul!",
  rare: "Moonlit Find!",
  epic: "Lantern-Lit Prize!",
  legendary: "Legend of the Lake!",
};

export interface CatchInfo {
  gain: CatchGain;
  xpBefore: number;
  /** Chance of landing this species on one cast, in percent. */
  chance: number;
}

interface CatchCardProps {
  fish: Fish;
  info: CatchInfo;
  onClose: () => void;
}

const FOCUSABLE = "button:not(:disabled)";

function oddsText(chance: number) {
  if (chance <= 0) return "Rare find";
  const n = Math.max(2, Math.round(100 / chance));
  return `1 in ${n}`;
}

/** The catch screen: a sign, the fish on a ray burst, what it is worth, and the XP it earned. */
export function CatchCard({ fish, info, onClose }: CatchCardProps) {
  const { gain, xpBefore, chance } = info;
  const rarity = RARITY_INFO[fish.rarity];
  const ref = useRef<HTMLDivElement>(null);
  // The last reel tap often lands as the card appears; ignore presses for a moment so it cannot dismiss the card.
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = performance.now();
  }, []);
  const dismiss = useCallback(() => {
    if (performance.now() - shownAt.current < 800) return;
    onClose();
  }, [onClose]);

  const [bar, setBar] = useState(() => {
    const before = levelFromXp(xpBefore);
    return { level: before.level, fraction: before.fraction, snap: false };
  });
  const [leveled, setLeveled] = useState(false);

  useEffect(() => {
    const before = levelFromXp(xpBefore);
    const after = levelFromXp(xpBefore + gain.xp);
    const ids: number[] = [];
    const later = (ms: number, fn: () => void) => ids.push(window.setTimeout(fn, ms));
    if (after.level === before.level) {
      later(500, () => setBar({ level: after.level, fraction: after.fraction, snap: false }));
    } else {
      // Fill the bar, flash the level-up, then start the next level from empty.
      later(500, () => setBar({ level: before.level, fraction: 1, snap: false }));
      later(1250, () => {
        setBar({ level: after.level, fraction: 0, snap: true });
        setLeveled(true);
      });
      later(1330, () => setBar({ level: after.level, fraction: after.fraction, snap: false }));
    }
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [xpBefore, gain.xp]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [dismiss]);

  const sparkles = fish.rarity === "rare" || fish.rarity === "epic" || fish.rarity === "legendary";
  const levelUp = gain.levelAfter > gain.levelBefore;
  const needed = bar.level >= MAX_LEVEL ? 0 : xpForLevel(bar.level);
  const into = Math.round(bar.fraction * needed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`${CATCH_TITLE[fish.rarity]} ${fish.name}`}
        data-testid="catch-card"
        className="catch-in panel relative mt-6 w-full max-w-sm px-4 pb-4 pt-10"
        style={{ boxShadow: `inset 0 0 0 2px ${rarity.color}, 0 6px 0 rgba(0,0,0,0.35), 0 0 36px ${rarity.color}44` }}
      >
        {/* Hanging sign */}
        <div aria-hidden className="absolute -top-9 left-1/2 flex w-56 -translate-x-1/2 justify-between px-10">
          <span className="h-7 w-1.5 rounded bg-[#c9a25a] shadow-[0_0_0_2px_var(--color-line)]" />
          <span className="h-7 w-1.5 rounded bg-[#c9a25a] shadow-[0_0_0_2px_var(--color-line)]" />
        </div>
        <div className="sign absolute -top-4 left-1/2 w-[78%] -translate-x-1/2 px-2 py-1.5 text-center">
          <h2 className="lettered text-[22px] leading-tight" style={{ color: rarity.color === "#9aa5b1" ? undefined : rarity.color }}>
            {CATCH_TITLE[fish.rarity]}
          </h2>
        </div>

        {/* Fish on a ray burst */}
        <div className="relative mt-2 flex h-44 items-center justify-center overflow-hidden rounded-2xl">
          <div aria-hidden className="rays absolute inset-0" style={{ "--ray": rarity.color } as CSSProperties} />
          {[
            ["8%", "62%", 14, 0],
            ["84%", "24%", 10, 0.8],
            ["16%", "18%", 8, 1.5],
            ["78%", "70%", 16, 0.4],
          ].map(([left, top, size, delay]) => (
            <span
              key={`${left}-${top}`}
              aria-hidden
              className="bubble absolute rounded-full border-2 border-moon/40 bg-moon/10"
              style={{ left: left as string, top: top as string, width: size as number, height: size as number, animationDelay: `${delay}s` }}
            />
          ))}
          {sparkles &&
            [
              ["20%", "30%"],
              ["74%", "40%"],
              ["50%", "12%"],
            ].map(([left, top], i) => (
              <svg
                key={`${left}-${top}`}
                aria-hidden
                viewBox="0 0 20 20"
                className="star absolute h-4 w-4"
                style={{ left, top, animationDelay: `${i * 0.7}s`, color: rarity.color }}
              >
                <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="currentColor" />
              </svg>
            ))}
          <FishArt fish={fish} className="fish-in relative h-auto max-h-36 w-56 object-contain" />
        </div>

        <div className="mt-3 flex flex-col items-center gap-1.5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border-2 border-brass/60 bg-ink/60 px-3 py-0.5 text-sm font-extrabold text-moon" data-testid="catch-odds">
              {oddsText(chance)}
            </span>
            {gain.isNew && (
              <span className="rounded-full border-2 border-line bg-lantern px-2.5 py-0.5 text-xs font-extrabold text-line">
                New in your journal!
              </span>
            )}
          </div>
          <p className="lettered text-4xl leading-none">{fish.name}</p>
          <RarityTag rarity={fish.rarity} />
          <p className="mt-1 flex items-center gap-1.5 text-base font-extrabold text-lantern">
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
              <circle cx="12" cy="12" r="10" fill="#f4a636" stroke="#081726" strokeWidth="2.4" />
              <circle cx="12" cy="12" r="6" fill="none" stroke="#b9650f" strokeWidth="1.6" />
            </svg>
            +{fishValue(fish)} pts when sold
          </p>
        </div>

        {/* XP and level */}
        <div className="panel-raised mt-3 flex flex-col gap-1.5 px-3 py-2.5" data-testid="catch-xp">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg text-moon">+{gain.xp} XP</span>
            <span className="text-xs font-bold text-mist">
              {gain.isNew ? "New species bonus" : `${RARITY_INFO[fish.rarity].label} catch`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-display flex h-9 min-w-9 items-center justify-center rounded-full border-3 border-line bg-lantern px-1 text-lg text-line"
              data-testid="catch-level"
            >
              {bar.level}
            </span>
            <div className="flex-1">
              <div
                role="progressbar"
                aria-label="Level progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(bar.fraction * 100)}
                className="h-4 overflow-hidden rounded-full border-2 border-line bg-lake"
              >
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[#3fd6a0] to-[#7fe8ff] ${bar.snap ? "" : "xp-fill"}`}
                  style={{ width: `${bar.fraction * 100}%` }}
                />
              </div>
              <p className="mt-0.5 text-right text-[11px] font-bold text-mist">
                {needed > 0 ? `${into} / ${needed} XP` : "Max level"}
              </p>
            </div>
          </div>

          {levelUp && leveled && (
            <div className="level-up mt-1 rounded-xl border-3 border-line bg-lantern px-3 py-2 text-center text-line" data-testid="level-up">
              <p className="font-display text-xl leading-none">Level up!</p>
              <ul className="mt-1 text-sm font-extrabold">
                {gain.rewards.map((r) => (
                  <li key={r.level}>
                    Level {r.level}: +{r.points} pts{r.title ? ` · New title: ${r.title}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button variant="primary" className="mt-3 h-14 w-full text-xl" data-testid="catch-continue" onClick={dismiss}>
          Keep fishing
        </Button>
      </div>
    </div>
  );
}
