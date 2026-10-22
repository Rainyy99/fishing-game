"use client";

import type { ReactNode } from "react";
import { levelFromXp, titleForLevel } from "@/game/progress";
import { useSave } from "@/game/store";
import { Portrait } from "./Portrait";
import { Sheet } from "./ui/Sheet";

export type MenuTarget = "fish" | "profile" | "bag" | "book" | "map" | "shop" | "ranks" | "help";

const ICONS: Record<MenuTarget, ReactNode> = {
  fish: <path d="M3 12c3-5 8-6 12-3l4-3v12l-4-3c-4 3-9 2-12-3zm13-1.5h.01" />,
  profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 8c0-4 4-6 8-6s8 2 8 6" />,
  bag: <path d="M6 8h12l1 12H5L6 8zm3 0V6a3 3 0 0 1 6 0v2" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zm2 14h13M9 7h6" />,
  map: <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14" />,
  shop: <path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0" />,
  ranks: <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM5 5H3v2a3 3 0 0 0 3 3m13-5h2v2a3 3 0 0 1-3 3M12 13v4m-4 3h8" />,
  help: <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />,
};

const ITEMS: ReadonlyArray<{ id: MenuTarget; label: string; soon?: boolean }> = [
  { id: "fish", label: "Fishing" },
  { id: "profile", label: "Profile" },
  { id: "bag", label: "Inventory" },
  { id: "book", label: "Collection" },
  { id: "map", label: "Map" },
  { id: "shop", label: "Shop", soon: true },
  { id: "ranks", label: "Ranks", soon: true },
  { id: "help", label: "How to play" },
];

/** Half-screen menu that rises from the bottom. */
export function MenuPanel({ onSelect, onClose }: { onSelect: (to: MenuTarget) => void; onClose: () => void }) {
  const save = useSave();
  const info = levelFromXp(save.xp);

  return (
    <Sheet title="Menu" size="half" onClose={onClose} testId="menu" closeTestId="menu-close">
      <button
        type="button"
        data-testid="menu-profile"
        onClick={() => onSelect("profile")}
        className="panel-raised mb-3 flex w-full items-center gap-3 p-2.5 text-left"
      >
        <Portrait size={52} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-lantern">{titleForLevel(info.level)}</span>
          <span className="mt-1 block h-2.5 overflow-hidden rounded-full border-2 border-line bg-lake">
            <span className="block h-full bg-gradient-to-r from-[#3fd6a0] to-[#7fe8ff]" style={{ width: `${info.fraction * 100}%` }} />
          </span>
        </span>
        <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-3 border-line bg-lantern text-lg text-line">
          {info.level}
        </span>
      </button>

      <div className="grid grid-cols-4 gap-2">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={`menu-${item.id}`}
            onClick={() => onSelect(item.id)}
            className="panel-raised relative flex flex-col items-center gap-1 px-1 py-2.5 text-moon focus-visible:outline-2 focus-visible:outline-moon"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {ICONS[item.id]}
            </svg>
            <span className="font-display text-[12px] leading-tight">{item.label}</span>
            {item.soon && (
              <span className="absolute -right-1 -top-1.5 rounded-full border-2 border-line bg-lantern px-1 text-[8px] font-extrabold text-line">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
