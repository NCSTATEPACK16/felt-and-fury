// src/engine/CrapsMath.js
// Pure, framework-free craps mathematics and roll resolution.
// No React, no store, no DOM — just data in, data out. This keeps the rules
// testable in isolation (see the Monte-Carlo notes in the README).

export const BOXES = [4, 5, 6, 8, 9, 10];
export const START_BANKROLL = 1000;
export const MIN_BET = 5;
export const MAX_SPOT = 500;     // table max per individual spot
export const MAX_ODDS_MULT = 5;  // cap odds at 5x the flat bet they back

export const round2 = (x) => Math.round(x * 100) / 100;

export function formatMoney(x) {
  const neg = x < 0;
  const v = Math.abs(round2(x));
  const s = Number.isInteger(v)
    ? v.toLocaleString("en-US")
    : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (neg ? "-$" : "$") + s;
}

export function emptyBets() {
  return {
    passLine: 0, passOdds: 0,
    dontPass: 0, dontPassOdds: 0,
    come: 0, dontCome: 0,                          // pending on the come / don't-come line
    comeNum: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
    comeOdds: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
    dcNum: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
    dcOdds: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
  };
}

export function cloneBets(b) {
  return {
    passLine: b.passLine, passOdds: b.passOdds,
    dontPass: b.dontPass, dontPassOdds: b.dontPassOdds,
    come: b.come, dontCome: b.dontCome,
    comeNum: { ...b.comeNum }, comeOdds: { ...b.comeOdds },
    dcNum: { ...b.dcNum }, dcOdds: { ...b.dcOdds },
  };
}

export function atRisk(b) {
  let t = b.passLine + b.passOdds + b.dontPass + b.dontPassOdds + b.come + b.dontCome;
  for (const n of BOXES) t += b.comeNum[n] + b.comeOdds[n] + b.dcNum[n] + b.dcOdds[n];
  return round2(t);
}

// True-odds profit for `stake` riding on number `n`.
// Right side (take): 2:1 on 4/10, 3:2 on 5/9, 6:5 on 6/8.
// Dark side (lay):   1:2 on 4/10, 2:3 on 5/9, 5:6 on 6/8.
export function oddsProfit(n, stake, lay) {
  if (lay) {
    if (n === 4 || n === 10) return stake * 0.5;
    if (n === 5 || n === 9) return stake * (2 / 3);
    return stake * (5 / 6);
  }
  if (n === 4 || n === 10) return stake * 2;
  if (n === 5 || n === 9) return stake * 1.5;
  return stake * 1.2;
}

export function rollDice() {
  return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
}

/**
 * Resolve a single roll against a snapshot of {bets, point}.
 * Pure: returns a fresh bets object plus everything the store needs to apply.
 *
 * House rule: all odds (pass/come/don't) work on every roll, including the
 * come-out. This is a real casino-selectable rule and keeps resolution
 * deterministic and easy to verify.
 *
 * @returns {{
 *   bets: object, point: number|null, total: number, word: string,
 *   events: Array<{area:string, kind:'win'|'lose'|'push'|'move'|'set', pnl:number}>,
 *   bankrollReturn: number,  // money to add back to bankroll
 *   pnl: number,             // realized profit/loss this roll
 *   sevenOut: boolean, pointMade: boolean, pointEstablished: boolean
 * }}
 */
export function resolveRoll(prev, d1, d2) {
  const T = d1 + d2;
  const b = cloneBets(prev.bets);
  let point = prev.point;
  const events = [];
  let ret = 0;

  // helpers — `win` returns principal + profit; `winRide` keeps the principal
  // on the felt (used for line bets that ride into the next come-out).
  const win = (area, stake, profit) => { ret += stake + profit; events.push({ area, kind: "win", pnl: round2(profit) }); };
  const winRide = (area, profit) => { ret += profit; events.push({ area, kind: "win", pnl: round2(profit) }); };
  const lose = (area, stake) => { events.push({ area, kind: "lose", pnl: round2(-stake) }); };
  const push = (area, stake) => { ret += stake; events.push({ area, kind: "push", pnl: 0 }); };

  // ---- 1) existing Come / Don't Come NUMBER bets (odds working) ----
  if (T === 7) {
    for (const n of BOXES) {
      if (b.comeNum[n] > 0) {
        lose("box-" + n, b.comeNum[n]);
        if (b.comeOdds[n] > 0) lose("box-" + n, b.comeOdds[n]);
        b.comeNum[n] = 0; b.comeOdds[n] = 0;
      }
      if (b.dcNum[n] > 0) {
        win("box-" + n, b.dcNum[n], b.dcNum[n]);                         // flat 1:1
        if (b.dcOdds[n] > 0) win("box-" + n, b.dcOdds[n], oddsProfit(n, b.dcOdds[n], true));
        b.dcNum[n] = 0; b.dcOdds[n] = 0;
      }
    }
  } else if (BOXES.includes(T)) {
    if (b.comeNum[T] > 0) {
      win("box-" + T, b.comeNum[T], b.comeNum[T]);                       // come point hit — comes down
      if (b.comeOdds[T] > 0) win("box-" + T, b.comeOdds[T], oddsProfit(T, b.comeOdds[T], false));
      b.comeNum[T] = 0; b.comeOdds[T] = 0;
    }
    if (b.dcNum[T] > 0) {                                                // shooter hit the dark number
      lose("box-" + T, b.dcNum[T]);
      if (b.dcOdds[T] > 0) lose("box-" + T, b.dcOdds[T]);
      b.dcNum[T] = 0; b.dcOdds[T] = 0;
    }
  }

  // ---- 2) pending Come / Don't Come on the line ----
  if (b.come > 0) {
    if (T === 7 || T === 11) { win("come", b.come, b.come); b.come = 0; }
    else if (T === 2 || T === 3 || T === 12) { lose("come", b.come); b.come = 0; }
    else { b.comeNum[T] += b.come; b.come = 0; events.push({ area: "box-" + T, kind: "move", pnl: 0 }); }
  }
  if (b.dontCome > 0) {
    if (T === 2 || T === 3) { win("dontCome", b.dontCome, b.dontCome); b.dontCome = 0; }
    else if (T === 7 || T === 11) { lose("dontCome", b.dontCome); b.dontCome = 0; }
    else if (T === 12) { push("dontCome", b.dontCome); b.dontCome = 0; }
    else { b.dcNum[T] += b.dontCome; b.dontCome = 0; events.push({ area: "box-" + T, kind: "move", pnl: 0 }); }
  }

  // ---- 3) Pass / Don't Pass line ----
  let word = "";
  let sevenOut = false, pointMade = false, pointEstablished = false;

  if (point === null) {
    // come-out roll
    if (T === 7 || T === 11) {
      word = "Natural";
      if (b.passLine > 0) winRide("passLine", b.passLine);
      if (b.dontPass > 0) { lose("dontPass", b.dontPass); b.dontPass = 0; }
    } else if (T === 2 || T === 3) {
      word = "Craps";
      if (b.passLine > 0) { lose("passLine", b.passLine); b.passLine = 0; }
      if (b.dontPass > 0) winRide("dontPass", b.dontPass);
    } else if (T === 12) {
      word = "Craps · bar 12";
      if (b.passLine > 0) { lose("passLine", b.passLine); b.passLine = 0; }
      if (b.dontPass > 0) events.push({ area: "dontPass", kind: "push", pnl: 0 }); // bar = push, stays up
    } else {
      point = T; word = "Point is " + T; pointEstablished = true;
      events.push({ area: "passLine", kind: "set", pnl: 0 });
    }
  } else {
    // point phase
    if (T === point) {
      word = "Point made — " + T; pointMade = true;
      if (b.passLine > 0) winRide("passLine", b.passLine);
      if (b.passOdds > 0) { win("passOdds", b.passOdds, oddsProfit(point, b.passOdds, false)); b.passOdds = 0; }
      if (b.dontPass > 0) { lose("dontPass", b.dontPass); b.dontPass = 0; }
      if (b.dontPassOdds > 0) { lose("dontPassOdds", b.dontPassOdds); b.dontPassOdds = 0; }
      point = null;
    } else if (T === 7) {
      word = "Seven out"; sevenOut = true;
      if (b.passLine > 0) { lose("passLine", b.passLine); b.passLine = 0; }
      if (b.passOdds > 0) { lose("passOdds", b.passOdds); b.passOdds = 0; }
      if (b.dontPass > 0) { win("dontPass", b.dontPass, b.dontPass); b.dontPass = 0; }
      if (b.dontPassOdds > 0) { win("dontPassOdds", b.dontPassOdds, oddsProfit(point, b.dontPassOdds, true)); b.dontPassOdds = 0; }
      point = null;
    } else {
      word = "No decision — point " + point;
    }
  }

  const pnl = events.reduce((s, e) => s + e.pnl, 0);
  return {
    bets: b, point, total: T, word, events,
    bankrollReturn: round2(ret), pnl: round2(pnl),
    sevenOut, pointMade, pointEstablished,
  };
}
