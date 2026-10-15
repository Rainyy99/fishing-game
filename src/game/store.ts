"use client";

import { useSyncExternalStore } from "react";
import {
  SAVE_KEY,
  emptySave,
  parseSave,
  serializeSave,
  type SaveData,
} from "./save";

// A tiny external store over localStorage. If storage is blocked (private mode,
// full disk) the game keeps working and just keeps progress in memory.

const SERVER_SNAPSHOT: SaveData = emptySave();
const listeners = new Set<() => void>();

let current: SaveData | null = null;
let currentRaw: string | null = null;
let storageOk = true;
let listening = false;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

export function getSnapshot(): SaveData {
  if (current !== null && !storageOk) {
    return current;
  }
  const raw = readRaw();
  if (current === null || raw !== currentRaw) {
    current = parseSave(raw);
    currentRaw = raw;
  }
  return current;
}

const getServerSnapshot = (): SaveData => SERVER_SNAPSHOT;

function notify() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key === SAVE_KEY || event.key === null) {
    notify();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!listening) {
    window.addEventListener("storage", onStorage);
    listening = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && listening) {
      window.removeEventListener("storage", onStorage);
      listening = false;
    }
  };
}

export function updateSave(change: (save: SaveData) => SaveData): void {
  const before = getSnapshot();
  const next = change(before);
  if (next === before) {
    return;
  }
  const raw = serializeSave(next);
  try {
    window.localStorage.setItem(SAVE_KEY, raw);
    storageOk = true;
    currentRaw = raw;
  } catch {
    storageOk = false;
  }
  current = next;
  notify();
}

export function resetSave(): void {
  updateSave(() => emptySave());
}

export function useSave(): SaveData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
