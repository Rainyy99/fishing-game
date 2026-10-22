"use client";

import { useEffect, useState } from "react";
import { GAME_NAME } from "@/game/brand";
import { levelFromXp } from "@/game/progress";
import { defaultName } from "@/game/save";
import { updateSave, useSave } from "@/game/store";
import { FishingGame } from "./FishingGame";
import { InventoryScreen } from "./InventoryScreen";
import { JournalScreen } from "./JournalScreen";
import { MapScreen } from "./MapScreen";
import { MenuPanel, type MenuTarget } from "./MenuPanel";
import { ProfileScreen } from "./ProfileScreen";
import { Scene } from "./Scene";
import { Sheet } from "./ui/Sheet";

type Tab = "fish" | "profile" | "bag" | "book" | "map" | "shop";

function Coin() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#f4a636" stroke="#081726" strokeWidth="2.4" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#b9650f" strokeWidth="1.6" />
      <path d="M9.5 12.2l1.7 1.7 3.3-3.6" fill="none" stroke="#081726" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEPS: ReadonlyArray<{ title: string; text: string }> = [
  { title: "Cast", text: "Tap Cast, then wait for a bite. Pulling early scares the fish off." },
  { title: "Set the hook", text: "When the bobber dips and a red ! appears, tap before the bar runs out." },
  {
    title: "Reel in rhythm",
    text: "Tap in a steady beat. Too fast and the line snaps; too slow and the fish pulls free. When the button turns red, stop tapping until it passes.",
  },
  { title: "Sell and collect", text: "Sell fish for points, and fill your journal with every species you land." },
];

function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="How to play" onClose={onClose} testId="howto" closeTestId="howto-close">
      <ol className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="panel-raised flex gap-3 p-3">
            <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-3 border-line bg-lantern text-lg text-line">
              {i + 1}
            </span>
            <div>
              <p className="font-display text-lg text-moon">{step.title}</p>
              <p className="text-sm leading-relaxed text-mist">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm leading-relaxed text-mist">
        Everything is free during the beta and your progress is saved on this device. Wallet connection, a shop and weekly rankings are coming.
      </p>
    </Sheet>
  );
}

function SoonScreen({ title, lead, items }: { title: string; lead: string; items: string[] }) {
  return (
    <section data-testid="soon-screen" className="panel p-5">
      <p className="inline-block rounded-full border-2 border-line bg-lantern px-3 py-0.5 text-xs font-extrabold text-line">
        Coming soon
      </p>
      <h2 className="lettered mt-3 text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-mist">{lead}</p>
      <ul className="mt-4 space-y-2 text-sm text-[#cfe3ee]">
        {items.map((text) => (
          <li key={text} className="flex gap-2.5">
            <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lantern" />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>("fish");
  const [help, setHelp] = useState(false);
  const [ranks, setRanks] = useState(false);
  const [menu, setMenu] = useState(false);
  const { points, xp, name } = useSave();
  useEffect(() => {
    if (name === "") updateSave((save) => (save.name === "" ? { ...save, name: defaultName() } : save));
  }, [name]);
  const level = levelFromXp(xp).level;

  const choose = (to: MenuTarget) => {
    setMenu(false);
    if (to === "ranks") setRanks(true);
    else if (to === "help") setHelp(true);
    else setTab(to);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="lettered mr-auto text-3xl leading-none">{GAME_NAME}</h1>
        <button
          type="button"
          data-testid="level-badge"
          aria-label={`Level ${level}. Open profile`}
          onClick={() => setTab("profile")}
          className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-3 border-line bg-lantern text-xl text-line shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]"
        >
          {level}
        </button>
        <div
          className="flex items-center gap-1.5 rounded-full border-3 border-line bg-lake py-1 pl-1.5 pr-3 shadow-[inset_0_0_0_1px_rgba(201,162,90,0.35)]"
          aria-label="Points"
        >
          <Coin />
          <span data-testid="points" className="font-display text-xl tabular-nums text-moon">
            {points}
          </span>
        </div>
        <button
          type="button"
          data-testid="menu-open"
          aria-label="Menu"
          aria-haspopup="dialog"
          onClick={() => setMenu(true)}
          className="btn btn-quiet flex h-11 w-11 shrink-0 items-center justify-center p-0"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {tab !== "fish" && (
        <button
          type="button"
          data-testid="back-to-fishing"
          onClick={() => setTab("fish")}
          className="btn btn-quiet flex h-11 items-center gap-1.5 self-start px-4 text-base"
        >
          <span aria-hidden>←</span> Fishing
        </button>
      )}
      {tab !== "fish" && <Scene phase="idle" dim />}
      {tab === "fish" && <FishingGame onOpenBag={() => setTab("bag")} />}
      {tab === "profile" && <ProfileScreen />}
      {tab === "bag" && <InventoryScreen onGoFish={() => setTab("fish")} />}
      {tab === "book" && <JournalScreen />}
      {tab === "map" && <MapScreen onGoFish={() => setTab("fish")} />}
      {tab === "shop" && (
        <SoonScreen
          title="Shop"
          lead="Better rods, baits and accessories are on the way."
          items={[
            "Everything is free to use during the beta.",
            "Later, gear will be unlocked with the game token.",
            "Higher tiers give better odds at rare fish.",
          ]}
        />
      )}
      {tab !== "fish" && (
        <footer className="mt-auto pt-6 text-center text-xs text-mist/80">
          Free-play beta · Progress is saved on this device
        </footer>
      )}
      {menu && <MenuPanel onSelect={choose} onClose={() => setMenu(false)} />}
      {ranks && (
        <Sheet title="Leaderboard" onClose={() => setRanks(false)} testId="ranks">
          <SoonScreen
            title="Weekly ranks"
            lead="Rankings are on the way."
            items={[
              "Compete on points earned from the fish you sell.",
              "Weekly rewards for the top anglers.",
              "Connect a wallet to join once wallets are live.",
            ]}
          />
        </Sheet>
      )}
      {help && <HowToPlay onClose={() => setHelp(false)} />}
    </div>
  );
}
