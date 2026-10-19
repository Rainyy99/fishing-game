"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { RARITY_INFO, getBait, getLocation, getRod } from "@/game/data";
import {
  fightResult,
  resolveCast,
  resolveHook,
  startCast,
  type Cast,
  type CastResult,
  type Loadout,
} from "@/game/engine";
import { createFight, stepFight, type FightState } from "@/game/fight";
import { applyCastResult, fishValue, withLoadout } from "@/game/save";
import { updateSave, useSave } from "@/game/store";
import { FishArt } from "./FishArt";
import { GearPanel } from "./GearPanel";
import { Scene, type ScenePhase } from "./Scene";

interface View {
  phase: ScenePhase;
  cast: Cast | null;
  result: CastResult | null;
}

const INITIAL_VIEW: View = { phase: "idle", cast: null, result: null };

const STATUS_TEXT: Record<ScenePhase, string> = {
  idle: "Tap Cast to throw your line.",
  waiting: "Waiting for a bite... do not tap yet!",
  bite: "Fish on! Tap now to set the hook!",
  fight: "Tap in a steady rhythm. Stop when the fish surges!",
  result: "Ready for another cast?",
};

const BUTTON_LABEL: Record<ScenePhase, string> = {
  idle: "Cast",
  waiting: "Waiting...",
  bite: "SET THE HOOK!",
  fight: "TAP TO REEL",
  result: "Cast again",
};

const BUTTON_STYLE: Record<ScenePhase, string> = {
  idle: "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950",
  result: "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950",
  waiting: "border border-white/15 bg-white/10 text-slate-300",
  bite: "animate-pulse bg-gradient-to-r from-rose-500 to-amber-400 text-white",
  fight: "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950",
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
      body = `The ${describe(cast)} took your bait and slipped off the hook.`;
      break;
    case "snapped":
      title = "Line snapped!";
      body = `You pulled too hard. The ${describe(cast)} snapped the line.`;
      break;
    case "too-late":
      title = "Bait eaten!";
      body = `The ${describe(cast)} ate your bait and swam off.`;
      break;
    case "too-early":
      title = "Too early!";
      body = "You pulled the line before the bite. Wait for the splash!";
      break;
  }

  return (
    <div
      role="status"
      className="result-in rounded-2xl border bg-slate-950/85 p-2.5 text-center backdrop-blur-sm"
      style={{ borderColor: caught ? info.color : "rgba(255,255,255,0.12)" }}
    >
      {result.outcome !== "too-early" && (
        <FishArt
          fish={cast.fish}
          className={`mx-auto h-auto w-40 ${caught ? "" : "opacity-40 grayscale"}`}
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
        <p className="mt-1 text-sm font-bold text-amber-300">
          Added to your bag · worth {fishValue(cast.fish)} pts
        </p>
      )}
    </div>
  );
}

export function FishingGame() {
  const { loadout } = useSave();
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [gearOpen, setGearOpen] = useState(false);
  const [fightUi, setFightUi] = useState({ tension: 0, progress: 0, surging: false, warning: false });
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const taps = useRef(0);
  const live = useRef<{ phase: ScenePhase; cast: Cast | null; biteAt: number }>({
    phase: "idle",
    cast: null,
    biteAt: 0,
  });

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    window.cancelAnimationFrame(raf.current);
    taps.current = 0;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finish = useCallback(
    (cast: Cast, result: CastResult) => {
      const { phase } = live.current;
      if (phase !== "waiting" && phase !== "bite" && phase !== "fight") {
        return;
      }
      clearTimers();
      live.current.phase = "result";
      updateSave((save) => applyCastResult(save, cast.fish.id, result.outcome));
      setView((v) => ({ ...v, phase: "result", result }));
    },
    [clearTimers],
  );

  const startFight = useCallback(
    (cast: Cast) => {
      clearTimers();
      const rarity = cast.fish.rarity;
      let state: FightState = createFight(rarity);
      let last = performance.now();
      live.current.phase = "fight";
      setFightUi({ tension: state.tension, progress: state.progress, surging: false, warning: false });
      setView((v) => ({ ...v, phase: "fight" }));
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const pending = taps.current;
        taps.current = 0;
        state = stepFight(state, rarity, pending, dt, Math.random, cast.slackMultiplier);
        setFightUi({
          tension: state.tension,
          progress: state.progress,
          surging: state.surging,
          warning: state.warning,
        });
        if (state.end) {
          finish(cast, fightResult(cast, state.end));
          return;
        }
        raf.current = window.requestAnimationFrame(tick);
      };
      raf.current = window.requestAnimationFrame(tick);
    },
    [clearTimers, finish],
  );

  const startNewCast = useCallback(() => {
    clearTimers();
    const cast = startCast(loadout);
    live.current = { phase: "waiting", cast, biteAt: 0 };
    setView({ phase: "waiting", cast, result: null });

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
              finish(cast, resolveCast(cast, null));
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
      finish(cast, resolveCast(cast, -1));
    } else if (phase === "fight") {
      taps.current += 1;
      if (typeof navigator.vibrate === "function") {
        navigator.vibrate(8);
      }
    } else if (phase === "bite" && cast) {
      const hook = resolveHook(cast, Math.max(0, performance.now() - biteAt));
      if (hook === "hooked") {
        startFight(cast);
        taps.current = 1; // the tap that set the hook is the first reel tap
      } else {
        finish(cast, resolveCast(cast, null));
      }
    }
  }, [finish, startFight, startNewCast]);

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

  const changeLoadout = (next: Loadout) =>
    updateSave((save) => withLoadout(save, next));

  const location = getLocation(loadout.locationId);
  const rod = getRod(loadout.rodId);
  const bait = getBait(loadout.baitId);
  const busy = view.phase !== "idle" && view.phase !== "result";

  return (
    <div data-phase={view.phase} className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(56,189,248,0.12)]">
        <Scene
          phase={view.phase}
          eaten={
            view.phase === "result" &&
            (view.result?.outcome === "too-late" ||
              view.result?.outcome === "escaped")
          }
        />
        {view.phase === "result" && view.cast && view.result && (
          <div className="absolute inset-x-3 top-[24%]">
            <ResultPanel cast={view.cast} result={view.result} />
          </div>
        )}
        {(view.phase === "fight" || view.phase === "bite") && (
          <div className="absolute inset-x-3 top-3 rounded-2xl bg-slate-950/70 p-2.5">
        {view.phase === "fight" && (
        <div className="flex flex-col gap-1.5" data-testid="fight-meters">
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Catch progress"
            aria-valuenow={Math.round(fightUi.progress * 100)}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
              style={{ width: `${fightUi.progress * 100}%` }}
            />
          </div>
          <div
            className={`h-2.5 w-full overflow-hidden rounded-full bg-white/10 ${fightUi.surging ? "animate-pulse" : ""}`}
            role="progressbar"
            aria-label="Line tension"
            aria-valuenow={Math.round(fightUi.tension * 100)}
          >
            <div
              className={`h-full rounded-full ${fightUi.tension > 0.75 ? "bg-rose-500" : "bg-amber-300"}`}
              style={{ width: `${fightUi.tension * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className={`mt-0 h-2.5 w-full overflow-hidden rounded-full bg-white/10 ${view.phase === "fight" ? "hidden" : ""}`}>
        {view.phase === "bite" && view.cast && (
          <div
            className="timer-bar h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-300"
            style={{ animationDuration: `${view.cast.windowMs}ms` }}
          />
        )}
      </div>

          </div>
        )}
        <div className="absolute bottom-3 right-3 w-[62%]">
      <button
        type="button"
        data-testid="action"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`h-16 w-full touch-manipulation select-none rounded-2xl text-xl font-extrabold tracking-wide transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${view.phase === "fight" && (fightUi.surging || fightUi.warning) ? "bg-gradient-to-r from-rose-500 to-red-600 text-white" : BUTTON_STYLE[view.phase]}`}
      >
        {view.phase === "fight" && fightUi.surging
          ? "HOLD OFF!"
          : view.phase === "fight" && fightUi.warning
            ? "EASY..."
            : BUTTON_LABEL[view.phase]}
      </button>

        </div>
      </div>
      <button
        type="button"
        data-testid="gear-open"
        disabled={busy}
        onClick={() => setGearOpen(true)}
        className="flex items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-50"
      >
        <span className="truncate">
          {location.name} · {rod.name} · {bait.name}
          {loadout.accessoryIds.length > 0
            ? ` · +${loadout.accessoryIds.length}`
            : ""}
        </span>
        <span className={`shrink-0 text-sky-300 ${busy ? "invisible" : ""}`}>
          Change
        </span>
      </button>

      <p aria-live="polite" className="min-h-6 text-center text-sm text-slate-300">
        {STATUS_TEXT[view.phase]}
      </p>

      {gearOpen && (
        <GearPanel
          loadout={loadout}
          onChange={changeLoadout}
          onClose={() => setGearOpen(false)}
        />
      )}
    </div>
  );
}
