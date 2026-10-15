"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { GAME_NAME } from "@/game/brand";
import {
  DEFAULT_LOADOUT,
  RARITY_INFO,
  getBait,
  getLocation,
  getRod,
} from "@/game/data";
import {
  resolveCast,
  startCast,
  type Cast,
  type CastResult,
  type Loadout,
} from "@/game/engine";
import { FishSvg } from "./FishSvg";
import { GearPanel } from "./GearPanel";
import { Scene, type ScenePhase } from "./Scene";

interface View {
  phase: ScenePhase;
  cast: Cast | null;
  result: CastResult | null;
  points: number;
}

const INITIAL_VIEW: View = { phase: "idle", cast: null, result: null, points: 0 };

const STATUS_TEXT: Record<ScenePhase, string> = {
  idle: "Tap Cast to throw your line.",
  waiting: "Waiting for a bite... do not tap yet!",
  bite: "Fish on! Tap now!",
  result: "Ready for another cast?",
};

const BUTTON_LABEL: Record<ScenePhase, string> = {
  idle: "Cast",
  waiting: "Waiting...",
  bite: "REEL IN!",
  result: "Cast again",
};

const BUTTON_STYLE: Record<ScenePhase, string> = {
  idle: "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950",
  result: "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950",
  waiting: "border border-white/15 bg-white/10 text-slate-300",
  bite: "animate-pulse bg-gradient-to-r from-rose-500 to-amber-400 text-white",
};

function describe(cast: Cast): string {
  return `${cast.fish.name} (${RARITY_INFO[cast.fish.rarity].label})`;
}

function ResultPanel({ cast, result }: { cast: Cast; result: CastResult }) {
  const info = RARITY_INFO[cast.fish.rarity];
  const caught = result.outcome === "caught";

  let title: string;
  let body: string;
  switch (result.outcome) {
    case "caught":
      title = cast.fish.rarity === "common" || cast.fish.rarity === "uncommon"
        ? "Nice catch!"
        : `${info.label} catch!`;
      body = describe(cast);
      break;
    case "escaped":
      title = "It got away!";
      body = `The ${describe(cast)} slipped off the hook.`;
      break;
    case "too-late":
      title = "Too slow!";
      body = `The ${describe(cast)} swam away.`;
      break;
    case "too-early":
      title = "Too early!";
      body = "You pulled the line before the bite. Wait for the splash!";
      break;
  }

  return (
    <div
      role="status"
      className="result-in rounded-2xl border bg-slate-950/85 p-3 text-center backdrop-blur-sm"
      style={{ borderColor: caught ? info.color : "rgba(255,255,255,0.12)" }}
    >
      {result.outcome !== "too-early" && (
        <FishSvg
          fish={cast.fish}
          className={`mx-auto h-auto w-32 ${caught ? "" : "opacity-40 grayscale"}`}
        />
      )}
      <p
        className="mt-2 text-lg font-extrabold"
        style={caught ? { color: info.color } : undefined}
      >
        {title}
      </p>
      <p className="text-sm text-slate-300">{body}</p>
      {caught && (
        <p className="mt-1 text-xl font-extrabold tabular-nums text-amber-300">
          +{result.points} pts
        </p>
      )}
    </div>
  );
}

function SoonChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400"
    >
      {label}
      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
        Soon
      </span>
    </button>
  );
}

export function FishingGame() {
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [loadout, setLoadout] = useState<Loadout>(DEFAULT_LOADOUT);
  const [gearOpen, setGearOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const live = useRef<{ phase: ScenePhase; cast: Cast | null; biteAt: number }>({
    phase: "idle",
    cast: null,
    biteAt: 0,
  });

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finish = useCallback(
    (result: CastResult) => {
      if (live.current.phase !== "waiting" && live.current.phase !== "bite") {
        return;
      }
      clearTimers();
      live.current.phase = "result";
      setView((v) => ({
        ...v,
        phase: "result",
        result,
        points: v.points + result.points,
      }));
    },
    [clearTimers],
  );

  const startNewCast = useCallback(() => {
    clearTimers();
    const cast = startCast(loadout);
    live.current = { phase: "waiting", cast, biteAt: 0 };
    setView((v) => ({ ...v, phase: "waiting", cast, result: null }));

    timers.current.push(
      window.setTimeout(() => {
        if (live.current.phase !== "waiting") {
          return;
        }
        live.current.phase = "bite";
        live.current.biteAt = performance.now();
        setView((v) => ({ ...v, phase: "bite" }));
        if (typeof navigator.vibrate === "function") {
          navigator.vibrate(40);
        }
        timers.current.push(
          window.setTimeout(() => {
            if (live.current.phase === "bite") {
              finish(resolveCast(cast, null));
            }
          }, cast.windowMs),
        );
      }, cast.biteDelayMs),
    );
  }, [clearTimers, finish, loadout]);

  const act = useCallback(() => {
    const { phase, cast, biteAt } = live.current;
    if (phase === "idle" || phase === "result") {
      startNewCast();
    } else if (phase === "waiting" && cast) {
      finish(resolveCast(cast, -1));
    } else if (phase === "bite" && cast) {
      finish(resolveCast(cast, Math.max(0, performance.now() - biteAt)));
    }
  }, [finish, startNewCast]);

  // Taps are handled on pointerdown for a snappier feel. A click with detail 0
  // can only come from the keyboard or assistive tech, so handle just those.
  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }
    act();
  };
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) {
      act();
    }
  };

  const location = getLocation(loadout.locationId);
  const rod = getRod(loadout.rodId);
  const bait = getBait(loadout.baitId);
  const busy = view.phase === "waiting" || view.phase === "bite";

  return (
    <main
      data-phase={view.phase}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-4 pb-8 pt-4"
    >
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-wide">{GAME_NAME}</h1>
          <p className="text-xs text-slate-400">Free-play beta</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest text-slate-400">Points</p>
          <p
            data-testid="points"
            className="text-2xl font-extrabold tabular-nums text-amber-300"
          >
            {view.points}
          </p>
        </div>
      </header>

      <div className="flex gap-2">
        <SoonChip label="Connect wallet" />
        <SoonChip label="Leaderboard" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(56,189,248,0.12)]">
        <Scene phase={view.phase} />
        {view.phase === "result" && view.cast && view.result && (
          <div className="absolute inset-x-3 bottom-3">
            <ResultPanel cast={view.cast} result={view.result} />
          </div>
        )}
      </div>
      <button
        type="button"
        data-testid="gear-open"
        disabled={busy}
        onClick={() => setGearOpen(true)}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-slate-200 disabled:opacity-50"
      >
        {location.name} · {rod.name} · {bait.name}
        {loadout.accessoryIds.length > 0
          ? ` · +${loadout.accessoryIds.length}`
          : ""}
        <span className={`ml-2 text-sky-300 ${busy ? "invisible" : ""}`}>
          Change gear
        </span>
      </button>

      <p aria-live="polite" className="min-h-6 text-center text-sm text-slate-300">
        {STATUS_TEXT[view.phase]}
      </p>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        {view.phase === "bite" && view.cast && (
          <div
            className="timer-bar h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-300"
            style={{ animationDuration: `${view.cast.windowMs}ms` }}
          />
        )}
      </div>

      <button
        type="button"
        data-testid="action"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`h-16 w-full touch-manipulation select-none rounded-2xl text-xl font-extrabold tracking-wide transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${BUTTON_STYLE[view.phase]}`}
      >
        {BUTTON_LABEL[view.phase]}
      </button>

      <footer className="mt-auto pt-6 text-center text-[11px] text-slate-500">
        Free-play beta. No wallet needed.
      </footer>
      {gearOpen && (
        <GearPanel
          loadout={loadout}
          onChange={setLoadout}
          onClose={() => setGearOpen(false)}
        />
      )}
    </main>
  );
}
