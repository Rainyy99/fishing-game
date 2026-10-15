"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { GAME_NAME } from "@/game/brand";
import { useSave } from "@/game/store";
import { FishingGame } from "./FishingGame";
import { InventoryScreen } from "./InventoryScreen";

type Tab = "fish" | "bag" | "shop" | "ranks";

const ICONS: Record<Tab, ReactNode> = {
  fish: (
    <path d="M3 12c3-5 8-6 12-3l4-3v12l-4-3c-4 3-9 2-12-3zm13-1.5h.01" />
  ),
  bag: <path d="M6 8h12l1 12H5L6 8zm3 0V6a3 3 0 0 1 6 0v2" />,
  shop: <path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0" />,
  ranks: <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM5 5H3v2a3 3 0 0 0 3 3m13-5h2v2a3 3 0 0 1-3 3M12 13v4m-4 3h8" />,
};

const TABS: ReadonlyArray<{ id: Tab; label: string; soon?: boolean }> = [
  { id: "fish", label: "Fish" },
  { id: "bag", label: "Inventory" },
  { id: "shop", label: "Shop", soon: true },
  { id: "ranks", label: "Ranks", soon: true },
];

function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md pb-[env(safe-area-inset-bottom)]">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`tab-${item.id}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-300 ${
                active ? "text-sky-300" : "text-slate-400"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ICONS[item.id]}
              </svg>
              <span>{item.label}</span>
              {item.soon && (
                <span className="absolute right-0.5 top-1 rounded-full bg-white/10 px-1 text-[8px] uppercase tracking-wider text-slate-300">
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

function SoonScreen({
  title,
  lead,
  items,
}: {
  title: string;
  lead: string;
  items: string[];
}) {
  return (
    <section
      data-testid="soon-screen"
      className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center"
    >
      <p className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-300">
        Coming soon
      </p>
      <h2 className="mt-3 text-2xl font-extrabold">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{lead}</p>
      <ul className="mt-4 space-y-2 text-left text-sm text-slate-300">
        {items.map((text) => (
          <li key={text} className="flex gap-2">
            <span aria-hidden className="text-sky-300">
              •
            </span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>("fish");
  const { points } = useSave();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3 px-4 pb-28 pt-4">
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
            {points}
          </p>
        </div>
      </header>

      <div className="flex">
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400"
        >
          Connect wallet
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
            Soon
          </span>
        </button>
      </div>

      {tab === "fish" && <FishingGame />}
      {tab === "bag" && <InventoryScreen />}
      {tab === "shop" && (
        <SoonScreen
          title="Shop"
          lead="Better rods, baits and accessories are on the way."
          items={[
            "Everything is free to use during the beta.",
            "Later, gear will be unlocked with the game token.",
            "Higher tiers will give better odds at rare fish.",
          ]}
        />
      )}
      {tab === "ranks" && (
        <SoonScreen
          title="Leaderboard"
          lead="Weekly rankings are on the way."
          items={[
            "Compete on points earned from the fish you sell.",
            "Weekly rewards for the top anglers.",
            "Connect a wallet to join once wallets are live.",
          ]}
        />
      )}

      <footer className="mt-auto pt-6 text-center text-[11px] text-slate-500">
        Free-play beta · Progress is saved on this device
      </footer>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}
