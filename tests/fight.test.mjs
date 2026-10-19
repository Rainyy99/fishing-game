// Run with: node --experimental-strip-types tests/fight.test.mjs
// Checks the reeling rules in fight.js with simulated players.
import assert from "node:assert/strict";
import * as F from "../src/game/fight.ts";
const Fight = { create: F.createFight, step: F.stepFight, RARITIES: Object.keys(F.FIGHT_PROFILES) };

function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// `decide(observation, time)` returns true to tap REEL on this frame. It sees the game `delay` seconds late.
function play(rarity, seed, decide, delay = 0, dt = 1 / 60) {
  const rng = mulberry(seed);
  let state = Fight.create(rarity, rng);
  const history = [];
  let frames = 0;
  while (!state.end) {
    assert.ok(state.tension >= 0 && state.tension <= 1, "tension stays in 0..1");
    assert.ok(state.progress >= 0 && state.progress <= 1, "progress stays in 0..1");
    history.push(state);
    const seen = history[Math.max(0, history.length - 1 - Math.round(delay / dt))];
    state = Fight.step(state, rarity, decide(seen, state.time) ? 1 : 0, dt, rng);
    assert.ok(++frames < 60 * 40, "a fight always ends");
  }
  return state.end;
}

const winRate = (rarity, makePlayer, delay, n = 300) => {
  let wins = 0;
  for (let i = 0; i < n; i++) if (play(rarity, i * 7919 + 13, makePlayer(), delay) === "caught") wins++;
  return wins / n;
};

const spam = () => () => true; // a tap on every frame
const idle = () => () => false;
// Steady tapper: one tap every `gap` seconds, but waits while the fish surges or the line is tight.
function makeSteady(gap = 0.26, limit = 0.8) {
  let last = -1;
  return (s, time) => {
    if (s.surging || s.warning || s.tension > limit || time - last < gap) return false;
    last = time;
    return true;
  };
}

for (const rarity of Fight.RARITIES) {
  assert.equal(winRate(rarity, spam, 0), 0, `${rarity}: tapping on every frame must never win`);
  assert.equal(winRate(rarity, idle, 0), 0, `${rarity}: doing nothing must never win`);
  // Tapping too slowly loses to the fish.
  assert.equal(winRate(rarity, () => makeSteady(1.2), 0), 0, `${rarity}: a very slow tapper must never win`);
}

assert.ok(winRate("common", makeSteady, 0.3) >= 0.95, "a steady tapper catches common fish");
assert.ok(winRate("legendary", makeSteady, 0.3) < winRate("common", makeSteady, 0.3), "legendary fish are harder than common");
assert.ok(winRate("legendary", makeSteady, 0.3) > 0.05, "legendary fish can still be caught");

// Surging fish raise tension by themselves.
const rng = mulberry(1);
let s = Fight.create("legendary", rng);
s = { ...s, nextSurge: 0, tension: 0.5 };
const after = Fight.step(s, "legendary", 0, 0.1, rng);
assert.ok(after.surging, "a surge starts when its time comes");

// Bad input is ignored.
assert.equal(Fight.step(s, "common", 1, 0), s);
assert.equal(Fight.step(s, "common", 1, -1), s);
const finished = { ...s, end: "caught" };
assert.equal(Fight.step(finished, "common", 1, 0.1), finished);

console.log("fight tests passed");

// Gear: a lower slack multiplier makes the same fight easier, and bad values are ignored.
{
  const run = (mult) => {
    let wins = 0;
    for (let i = 0; i < 300; i++) {
      const r = mulberry(i * 7919 + 13);
      let st = Fight.create("legendary", r);
      const player = makeSteady();
      for (let n = 0; !st.end && n < 3000; n++) st = F.stepFight(st, "legendary", player(st, st.time) ? 1 : 0, 1 / 60, r, mult);
      if (st.end === "caught") wins++;
    }
    return wins;
  };
  assert.ok(run(0.5) >= run(1), "less slack is never harder");
  assert.ok(run(Number.NaN) === run(1), "NaN multiplier falls back to 1");
}
console.log("fight gear tests passed");
