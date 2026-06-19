// src/engine/TrainerLogic.js
// The "coach": reads game state and returns the ordered list of tasks the
// player should perform next. Fully decoupled from the UI — the Table reads
// the first task to draw a highlight, and the store reads it to validate clicks.

import { BOXES } from "./CrapsMath.js";

const META = {
  molly: {
    title: "Three Point Molly",
    side: "right",
    why:
      "Molly keeps three numbers working (Pass Line + two Come points) backed by true odds. " +
      "Odds carry no house edge, so loading them dilutes the line bet's edge toward the table minimum.",
  },
  dolly: {
    title: "Three Point Dolly",
    side: "dark",
    why:
      "Dolly is Molly inverted: three numbers laid against the shooter. You concede small amounts " +
      "to repeat numbers, then sweep the whole wall when the seven finally lands.",
  },
};

export function getTrainerMeta(mode) {
  return META[mode] || null;
}

function countCome(bets) { let c = 0; for (const n of BOXES) if (bets.comeNum[n] > 0) c++; return c; }
function countDc(bets) { let c = 0; for (const n of BOXES) if (bets.dcNum[n] > 0) c++; return c; }

/**
 * @param {{mode:string, point:number|null, bets:object}} state
 * @returns {Array<{area?:string, boxId?:string, action:'place'|'odds'|'roll', text:string, warning:string}>}
 */
export function getTasks(state) {
  if (state.mode === "molly") return mollyTasks(state);
  if (state.mode === "dolly") return dollyTasks(state);
  return [];
}

export function nextTask(state) {
  const t = getTasks(state);
  return t.length ? t[0] : null;
}

// ---- Three Point Molly (right side) ----
function mollyTasks({ point, bets }) {
  const t = [];

  if (point === null) {
    if (bets.passLine <= 0)
      t.push({ area: "passLine", action: "place", text: "Put your baseline bet on the Pass Line.", warning: "Molly starts on the Pass Line during the come-out." });
    else
      t.push({ action: "roll", text: "Pass Line is set — roll for your point.", warning: "" });
    return t;
  }

  // point is on
  if (bets.passLine > 0 && bets.passOdds <= 0)
    t.push({ area: "passOdds", action: "odds", text: `Back your Pass Line point (${point}) with full odds.`, warning: "Take odds on the point before adding numbers." });

  for (const n of BOXES)
    if (bets.comeNum[n] > 0 && bets.comeOdds[n] <= 0)
      t.push({ area: "comeOdds:" + n, boxId: "box-" + n, action: "odds", text: `Take odds on your Come point ${n}.`, warning: `Your Come point on ${n} should be backed with odds.` });

  const working = (bets.passLine > 0 ? 1 : 0) + countCome(bets);
  if (working < 3 && bets.come <= 0)
    t.push({ area: "come", action: "place", text: `Place a Come bet to build toward three working numbers (${working}/3).`, warning: "Add a Come bet to keep three numbers working." });

  if (t.length === 0)
    t.push({ action: "roll", text: "Three numbers working with odds — roll. Replace any number that hits with a fresh Come bet.", warning: "" });

  return t;
}

// ---- Three Point Dolly (dark side) ----
function dollyTasks({ point, bets }) {
  const t = [];

  if (point === null) {
    if (bets.dontPass <= 0)
      t.push({ area: "dontPass", action: "place", text: "Put your baseline bet on the Don't Pass bar.", warning: "Dolly starts on Don't Pass during the come-out." });
    else
      t.push({ action: "roll", text: "Don't Pass is set — roll for the point.", warning: "" });
    return t;
  }

  if (bets.dontPass > 0 && bets.dontPassOdds <= 0)
    t.push({ area: "dontPassOdds", action: "odds", text: `Lay odds behind your Don't Pass point (${point}).`, warning: "Lay odds behind the point before adding numbers." });

  for (const n of BOXES)
    if (bets.dcNum[n] > 0 && bets.dcOdds[n] <= 0)
      t.push({ area: "dcOdds:" + n, boxId: "box-" + n, action: "odds", text: `Lay odds against your Don't Come number ${n}.`, warning: `Your Don't Come number ${n} should be backed with lay odds.` });

  const working = (bets.dontPass > 0 ? 1 : 0) + countDc(bets);
  if (working < 3 && bets.dontCome <= 0)
    t.push({ area: "dontCome", action: "place", text: `Place a Don't Come bet to build a 3-number wall (${working}/3).`, warning: "Add a Don't Come bet to extend the wall." });

  if (t.length === 0)
    t.push({ action: "roll", text: "Three dark numbers laid — stand pat and roll. Replace any number the shooter knocks out.", warning: "" });

  return t;
}
