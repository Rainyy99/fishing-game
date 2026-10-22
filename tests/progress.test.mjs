// Run with: node --experimental-strip-types tests/progress.test.mjs
// Checks XP, levels, level rewards, titles and how a catch feeds into the save.
import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-loader.mjs", import.meta.url);
const P = await import("../src/game/progress.ts");
const S = await import("../src/game/save.ts");

// --- XP curve ---
assert.deepEqual(
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(P.xpForLevel),
  [100, 128, 164, 210, 268, 344, 440, 563, 721],
  "XP needed per level",
);
for (let l = 1; l < 59; l++) {
  assert.ok(P.xpForLevel(l + 1) > P.xpForLevel(l), "every level asks for more XP than the one before");
}

// --- levelFromXp ---
assert.deepEqual(P.levelFromXp(0), { level: 1, into: 0, needed: 100, fraction: 0 });
assert.equal(P.levelFromXp(99).level, 1);
assert.equal(P.levelFromXp(100).level, 2);
assert.equal(P.levelFromXp(100 + 127).level, 2);
assert.equal(P.levelFromXp(100 + 128).level, 3);
assert.equal(P.levelFromXp(-5).level, 1, "negative XP counts as zero");
for (let level = 1; level <= P.MAX_LEVEL; level++) {
  assert.equal(P.levelFromXp(P.xpAtLevel(level)).level, level, `start of level ${level}`);
  if (level > 1) assert.equal(P.levelFromXp(P.xpAtLevel(level) - 1).level, level - 1);
}
const capped = P.levelFromXp(1e15);
assert.equal(capped.level, P.MAX_LEVEL);
assert.equal(capped.needed, 0);
assert.equal(capped.fraction, 1);

// --- rewards and titles ---
assert.equal(P.levelRewardPoints(1), 0);
assert.deepEqual([2, 3, 4, 5, 6, 7, 8, 9, 10].map(P.levelRewardPoints), [10, 15, 20, 40, 30, 40, 50, 60, 100]);
assert.equal(P.levelRewardPoints(11), 120);
assert.equal(P.levelRewardPoints(15), Math.round((100 + 5 * 20) * 1.5));
assert.ok(P.levelRewardPoints(20) > P.levelRewardPoints(19), "milestones pay more");
assert.equal(P.titleForLevel(1), "Rookie Angler");
assert.equal(P.titleForLevel(4), "Rookie Angler");
assert.equal(P.titleForLevel(5), "Lake Regular");
assert.equal(P.titleForLevel(14), "Mist Walker");
assert.equal(P.titleForLevel(60), "Legend of the Lake");

// --- XP per catch ---
assert.equal(P.xpForCatch("common", false), 10);
assert.equal(P.xpForCatch("common", true), 15);
assert.equal(P.xpForCatch("legendary", false), 400);
assert.equal(P.xpForCatch("legendary", true), 600);
const order = ["common", "uncommon", "rare", "epic", "legendary"];
for (let i = 1; i < order.length; i++) {
  assert.ok(P.XP_PER_RARITY[order[i]] > P.XP_PER_RARITY[order[i - 1]], "rarer fish give more XP");
}

// --- one catch, no level-up ---
let gain = P.gainFromCatch(0, "common", false);
assert.equal(gain.xp, 10);
assert.equal(gain.levelBefore, 1);
assert.equal(gain.levelAfter, 1);
assert.deepEqual(gain.rewards, []);
assert.equal(gain.rewardPoints, 0);

// --- one catch that levels up, and one that skips several levels ---
gain = P.gainFromCatch(95, "common", false);
assert.equal(gain.levelAfter, 2);
assert.deepEqual(gain.rewards, [{ level: 2, points: 10 }]);
gain = P.gainFromCatch(0, "legendary", true);
assert.equal(gain.xp, 600);
assert.equal(gain.levelAfter, P.levelFromXp(600).level);
assert.ok(gain.levelAfter >= 4);
assert.equal(gain.rewards.length, gain.levelAfter - 1);
assert.equal(gain.rewardPoints, gain.rewards.reduce((n, r) => n + r.points, 0));
gain = P.gainFromCatch(P.xpAtLevel(5) - 1, "common", false);
assert.equal(gain.levelAfter, 5);
assert.equal(gain.rewards[0].title, "Lake Regular", "level 5 unlocks a title");

// --- the save ---
const fresh = S.emptySave();
assert.equal(fresh.xp, 0);
assert.equal(S.parseSave(JSON.stringify({ version: 1, points: 5 })).xp, 0, "older saves start at 0 XP");
assert.equal(S.parseSave(JSON.stringify({ ...fresh, xp: 250 })).xp, 250);
assert.equal(S.parseSave(JSON.stringify({ ...fresh, xp: -4 })).xp, 0);
assert.equal(S.parseSave(JSON.stringify({ ...fresh, xp: "lots" })).xp, 0);

const fish = S.ALL_FISH.find((f) => f.rarity === "common");
const rare = S.ALL_FISH.find((f) => f.rarity === "rare");
let save = S.applyCastResult(fresh, fish.id, "caught");
assert.equal(save.xp, 15, "first catch of a species earns the new-species bonus");
assert.equal(S.catchGain(save, fish.id).isNew, false);
save = S.applyCastResult(save, fish.id, "caught");
assert.equal(save.xp, 25, "later catches earn the plain amount");
assert.equal(save.stats.catches, 2);

const before = save.xp;
for (const outcome of ["escaped", "snapped", "too-late", "too-early"]) {
  const next = S.applyCastResult(save, fish.id, outcome);
  assert.equal(next.xp, before, `${outcome} earns no XP`);
  assert.equal(next.points, save.points, `${outcome} earns no points`);
}
assert.equal(S.applyCastResult(save, "not-a-fish", "caught").xp, before, "unknown fish earn nothing");

// A level-up pays out its reward points once, and the screen preview agrees with the save.
let near = { ...S.emptySave(), xp: 99, caught: { [fish.id]: 3 } };
const preview = S.catchGain(near, fish.id);
const after = S.applyCastResult(near, fish.id, "caught");
assert.equal(preview.levelAfter, 2);
assert.equal(after.points, preview.rewardPoints);
assert.equal(after.points, 10);
assert.equal(P.levelFromXp(after.xp).level, 2);
const again = S.applyCastResult(after, fish.id, "caught");
assert.equal(again.points, 10, "the reward is not paid twice");

// A rare catch is worth more than a common one.
assert.ok(S.catchGain(fresh, rare.id).xp > S.catchGain(fresh, fish.id).xp);

console.log("progress tests passed");
