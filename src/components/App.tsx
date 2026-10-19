"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { GAME_NAME } from "@/game/brand";
import { useSave } from "@/game/store";
import { FishingGame } from "./FishingGame";
import { InventoryScreen } from "./InventoryScreen";
import { JournalScreen } from "./JournalScreen";
import { MapScreen } from "./MapScreen";
import { Scene } from "./Scene";
import { Sheet } from "./ui/Sheet";

type Tab = "fish" | "bag" | "book" | "map" | "shop";

const ICONS: Record<Tab, ReactNode> = {
  fish: <path d="M3 12c3-5 8-6 12-3l4-3v12l-4-3c-4 3-9 2-12-3zm13-1.5h.01" />,
  bag: <path d="M6 8h12l1 12H5L6 8zm3 0V6a3 3 0 0 1 6 0v2" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zm2 14h13M9 7h6" />,
  map: <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14" />,
  shop: <path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0" />,
};

const TABS: ReadonlyArray<{ id: Tab; label: string; soon?: boolean }> = [
  { id: "fish", label: "Fish" },
  { id: "bag", label: "Inventory" },
  { id: "book", label: "Collection" },
  { id: "map", label: "Map" },
  { id: "shop", label: "Shop", soon: true },
];

function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav aria-label="Main" className="plank fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto flex max-w-md px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`tab-${item.id}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moon ${
                active ? "text-moon" : "text-[#e9c99a]/80"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full border-3 transition-colors ${
                  active
                    ? "border-line bg-lantern text-line shadow-[0_0_18px_rgba(244,166,54,0.65)]"
                    : "border-transparent"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[item.id]}
                </svg>
              </span>
              <span className="font-display text-[12px] leading-none">{item.label}</span>
              {item.soon && (
                <span className="absolute right-0 top-0.5 rounded-full bg-line px-1 py-px text-[8px] font-extrabold text-moon">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

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
  const { points } = useSave();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-4 pb-24 pt-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="lettered mr-auto text-3xl leading-none">{GAME_NAME}</h1>
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
          data-testid="ranks-open"
          aria-label="Leaderboard"
          onClick={() => setRanks(true)}
          className="btn btn-quiet flex h-11 w-11 shrink-0 items-center justify-center p-0"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM5 5H3v2a3 3 0 0 0 3 3m13-5h2v2a3 3 0 0 1-3 3M12 13v4m-4 3h8" />
          </svg>
        </button>
        <button
          type="button"
          data-testid="help-open"
          aria-label="How to play"
          onClick={() => setHelp(true)}
          className="btn btn-quiet flex h-11 w-11 shrink-0 items-center justify-center text-xl"
        >
          ?
        </button>
      </header>

      {tab !== "fish" && <Scene phase="idle" dim />}
      {tab === "fish" && <FishingGame />}
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
      <TabBar tab={tab} onChange={setTab} />
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
