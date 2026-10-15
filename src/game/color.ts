// Small color helpers for the SVG art (pure functions).

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hexToHsl(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const n = parseInt(match[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) {
    return [0, 0, l];
  }
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) {
    h = ((g - b) / d) % 6;
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  h *= 60;
  if (h < 0) {
    h += 360;
  }
  return [h, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(1, Math.max(0, s));
  const lig = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;
  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`;
}

export interface FishPalette {
  top: string;
  mid: string;
  belly: string;
  fin: string;
  accent: string;
}

/** Builds a palette from a rarity color, nudged per species so fish of one rarity still differ. */
export function fishPalette(baseHex: string, seed: number): FishPalette {
  const [h, s, l] = hexToHsl(baseHex);
  const hue = h + ((seed % 31) - 15);
  const sat = Math.max(s, 0.18);
  return {
    top: hslToHex(hue, sat, l * 0.5),
    mid: hslToHex(hue, sat, l * 0.8),
    belly: hslToHex(hue, sat * 0.8, Math.min(0.92, l + 0.2)),
    fin: hslToHex(hue + 12, sat, l * 0.65),
    accent: hslToHex(hue - 12, Math.min(1, sat + 0.1), l * 0.38),
  };
}
