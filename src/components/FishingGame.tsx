"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { RARITY_INFO, getBait, getRod } from "@/game/data";
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
import { Button } from "./ui/Button";
import { RarityTag } from "./ui/RarityTag";
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
  waiting: "Wait for the bobber to dip...",
  bite: "Fish on! Set the hook!",
  fight: "Tap in a steady beat. Stop on red.",
  result: "Ready for another cast?",
};

const BUTTON_LABEL: Record<ScenePhase, string> = {
  idle: "Cast",
  waiting: "Waiting...",
  bite: "HOOK IT!",
  fight: "TAP TO REEL",
  result: "Cast again",
};

function ResultPanel({ cast, result }: { cast: Cast; result: CastResult }) {
  const info = RARITY_INFO[cast.fish.rarity];
  const caught = result.outcome === "caught";

  let title: string;
  let body: string;
  switch (result.outcome) {
    case "caught":
      title = cast.fish.name;
      body = caught && cast.fish.rarity !== "common" && cast.fish.rarity !== "uncommon"
        ? `A ${info.label.toLowerCase()} catch. Nicely reeled.`
        : "Added to your bag.";
      break;
    case "escaped":
      title = "It got away";
      body = `The ${cast.fish.name} pulled free before you landed it. Tap faster when the bar is low.`;
      break;
    case "snapped":
      title = "Line snapped";
      body = `You tapped too hard and the ${cast.fish.name} broke the line. Ease off when the red bar fills.`;
      break;
    case "too-late":
      title = "Bait eaten";
      body = `The ${cast.fish.name} took your bait and swam off. Tap as soon as you see the red !`;
      break;
    case "too-early":
      title = "Too early";
      body = "You pulled before the bite. Wait for the bobber to dip.";
      break;
  }

  return (
    <div
      role="status"
      className="result-in panel flex items-center gap-3 p-2.5"
      style={caught ? { boxShadow: `inset 0 0 0 2px ${info.color}, 0 5px 0 rgba(0,0,0,0.28)` } : undefined}
    >
      {result.outcome !== "too-early" && (
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-ink/70">
          <FishArt
            fish={cast.fish}
            className={`h-auto max-h-14 w-20 object-contain ${caught ? "" : "opacity-40 grayscale"}`}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {caught && <RarityTag rarity={cast.fish.rarity} />}
        <p className="lettered truncate text-2xl leading-tight" style={caught ? { color: info.color } : undefined}>
          {title}
        </p>
        <p className="text-xs leading-snug text-mist">
          {caught ? `${body} +${fishValue(cast.fish)} pts when sold.` : body}
        </p>
      </div>
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
  const [tapCount, setTapCount] = useState(0);
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
      setTapCount((n) => n + 1);
      if (typeof navigator.vibrate === "function") {
        navigator.vibrate(8);
      }
    } else if (phase === "bite" && cast) {
      const hook = resolveHook(cast, Math.max(0, performance.now() - biteAt));
      if (hook === "hooked") {
        startFight(cast);
        taps.current = 1; // the tap that set the hook is the first reel tap
        setTapCount((n) => n + 1);
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

  const rod = getRod(loadout.rodId);
  const bait = getBait(loadout.baitId);
  const busy = view.phase !== "idle" && view.phase !== "result";

  const inFight = view.phase === "fight";
  const danger = inFight && (fightUi.surging || fightUi.warning);
  const actionLabel = inFight && fightUi.surging
    ? "Hold off!"
    : inFight && fightUi.warning
      ? "Easy..."
      : BUTTON_LABEL[view.phase];
  const actionVariant = danger || view.phase === "bite" ? "alert" : view.phase === "waiting" ? "quiet" : "primary";

  return (
    <div data-phase={view.phase} className="flex flex-1 flex-col">
      <Scene
        phase={view.phase}
        rodId={loadout.rodId}
        taps={tapCount}
        tension={fightUi.tension}
        surging={fightUi.surging}
        eaten={
          view.phase === "result" &&
          (view.result?.outcome === "too-late" ||
            view.result?.outcome === "escaped" ||
            view.result?.outcome === "snapped")
        }
      />

      <div className="min-h-12">
        {(inFight || view.phase === "bite") && (
          <div className="flex flex-col gap-1.5 rounded-2xl border-3 border-line bg-ink/85 p-2 backdrop-blur-sm">
            {inFight ? (
              <>
                <Meter label="Catch" value={fightUi.progress} fill="bg-gradient-to-r from-[#3fd6a0] to-[#7fe8ff]" testId="meter-catch" />
                <Meter
                  label="Line"
                  value={fightUi.tension}
                  fill={fightUi.tension > 0.75 ? "bg-signal" : "bg-gradient-to-r from-[#ffd37a] to-lantern"}
                  alert={fightUi.surging}
                  mark={0.75}
                  testId="meter-line"
                />
              </>
            ) : (
              view.cast && (
                <div className="flex items-center gap-2">
                  <span className="font-display w-12 text-sm text-moon">Hook!</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-line bg-lake">
                    <div
                      className="timer-bar h-full rounded-full bg-gradient-to-r from-[#ff8d9c] to-signal"
                      style={{ animationDuration: `${view.cast.windowMs}ms` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {view.phase === "result" && view.cast && view.result && (
          <ResultPanel cast={view.cast} result={view.result} />
        )}

        <p
          aria-live="polite"
          className="text-right text-sm font-bold text-moon [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.7)]"
        >
          {STATUS_TEXT[view.phase]}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            data-testid="gear-open"
            aria-label={`Gear: ${rod.name}, ${bait.name}`}
            disabled={busy}
            onClick={() => setGearOpen(true)}
            className="btn btn-quiet flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/art/items/${rod.id}.png`} alt="" draggable={false} className="h-9 w-9 object-contain" />
          </button>
          <Button
            variant={actionVariant}
            data-testid="action"
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            className={`h-14 w-44 px-4 text-xl ${view.phase === "bite" ? "animate-pulse" : ""}`}
          >
            {actionLabel}
          </Button>
        </div>
      </div>

      {gearOpen && (
        <GearPanel loadout={loadout} onChange={changeLoadout} onClose={() => setGearOpen(false)} />
      )}
    </div>
  );
}

function Meter({
  label,
  value,
  fill,
  alert,
  mark,
  testId,
}: {
  label: string;
  value: number;
  fill: string;
  alert?: boolean;
  mark?: number;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display w-12 text-sm text-moon">{label}</span>
      <div
        data-testid={testId}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        className={`relative h-4 flex-1 overflow-hidden rounded-full border-2 border-line bg-lake ${alert ? "animate-pulse" : ""}`}
      >
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${value * 100}%` }} />
        {mark !== undefined && (
          <span aria-hidden className="absolute inset-y-0 w-0.5 bg-moon/70" style={{ left: `${mark * 100}%` }} />
        )}
      </div>
    </div>
  );
}
