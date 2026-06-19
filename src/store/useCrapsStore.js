// src/store/useCrapsStore.js
// Global game state (Zustand). Holds bankroll, bets, point, session analytics,
// and toast notifications. All rules live in the engine modules; the store just
// applies their results and tracks history.

import { create } from "zustand";
import {
  BOXES, START_BANKROLL, MAX_SPOT, MAX_ODDS_MULT,
  emptyBets, cloneBets, atRisk, resolveRoll, rollDice, round2, formatMoney,
} from "../engine/CrapsMath.js";
import { nextTask } from "../engine/TrainerLogic.js";

const ROLL_MS = 620;
let toastSeq = 0;
let rollSeq = 0;

const emptyDistribution = () => ({ 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 });

const initialState = () => ({
  bankroll: START_BANKROLL,
  point: null,
  puckPosition: null,        // null = OFF (come-out); 4/5/6/8/9/10 = ON, marks the point
  mode: "manual",            // manual | molly | dolly
  chip: 5,
  bets: emptyBets(),
  dice: [5, 2],
  rolling: false,
  rollLog: [],               // last 5 totals (most recent first)
  undoStack: [],             // placements since the last roll
  lastEvents: [],            // events from the most recent roll (for flashes)
  lastWord: "",
  rollId: 0,                 // bumps each resolved roll, drives flash effects

  // ---- session tracking ----
  rollDistribution: emptyDistribution(),
  totalRolls: 0,
  sevenOuts: 0,
  peak: START_BANKROLL,
  archivedGames: [],         // last 10 completed games: {id, net, strategy, rolls}
  currentGameNet: 0,         // realized P/L since the current game began
  currentGameRolls: 0,

  // ---- trainer accuracy (resets when a trainer mode is selected) ----
  correct: 0,
  actions: 0,

  // ---- transient toasts ----
  toasts: [],
});

export const useCrapsStore = create((set, get) => ({
  ...initialState(),

  // ---------- toasts ----------
  pushToast: (msg, type = "info") =>
    set((s) => {
      const toast = { id: ++toastSeq, msg, type };
      setTimeout(() => get().dismissToast(toast.id), 3500);
      return { toasts: [...s.toasts, toast].slice(-3) };
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ---------- simple setters ----------
  setChip: (v) => set({ chip: v }),

  setMode: (mode) => {
    set({ mode, correct: 0, actions: 0 });
    const msg =
      mode === "manual" ? "Manual play — bet freely."
        : mode === "molly" ? "Three Point Molly loaded."
          : "Three Point Dolly loaded.";
    get().pushToast(msg, "info");
  },

  // ---------- place a chip ----------
  placeBet: (area) => {
    const s = get();

    // trainer enforcement: warn on deviation, count toward accuracy, still allow.
    if (s.mode !== "manual") {
      const nt = nextTask(s);
      const onPath = nt && nt.action !== "roll" && nt.area === area;
      set({ actions: s.actions + 1, correct: s.correct + (onPath ? 1 : 0) });
      if (!onPath) get().pushToast("Off-strategy: " + (nt ? nt.warning || nt.text : "follow the highlighted area."), "warn");
    }

    const res = applyPlacement(get(), area);
    if (!res.ok) { get().pushToast(res.msg, "warn"); return false; }
    set({ bankroll: res.bankroll, bets: res.bets, undoStack: res.undoStack });
    return true;
  },

  // ---------- undo the last placement of this betting turn ----------
  undo: () => {
    const s = get();
    if (!s.undoStack.length) { get().pushToast("Nothing to undo since the last roll.", "info"); return; }
    const stack = s.undoStack.slice();
    const last = stack.pop();
    const bets = cloneBets(s.bets);
    if (last.n == null) bets[last.path] -= last.amount;
    else bets[last.path][last.n] -= last.amount;
    set({ bets, bankroll: round2(s.bankroll + last.amount), undoStack: stack });
    get().pushToast("Chip taken back.", "info");
  },

  // ---------- roll the dice ----------
  roll: () => {
    const s = get();
    if (s.rolling) return;
    if (atRisk(s.bets) <= 0) { get().pushToast("Place a bet before rolling.", "warn"); return; }

    if (s.mode !== "manual") {
      const nt = nextTask(s);
      if (nt && nt.action !== "roll") {
        get().pushToast("Finish the highlighted step first: " + nt.text, "warn");
        return;
      }
    }

    set({ rolling: true });

    setTimeout(() => {
      const cur = get();
      const [d1, d2] = rollDice();
      const out = resolveRoll({ bets: cur.bets, point: cur.point }, d1, d2);

      const bankroll = round2(cur.bankroll + out.bankrollReturn);
      const rollLog = [out.total, ...cur.rollLog].slice(0, 5);
      const rollDistribution = { ...cur.rollDistribution, [out.total]: cur.rollDistribution[out.total] + 1 };
      const peak = Math.max(cur.peak, round2(bankroll + atRisk(out.bets)));

      let archivedGames = cur.archivedGames;
      let currentGameNet = round2(cur.currentGameNet + out.pnl);
      let currentGameRolls = cur.currentGameRolls + 1;
      let sevenOuts = cur.sevenOuts;

      if (out.sevenOut) {
        sevenOuts += 1;
        const lastId = cur.archivedGames.length ? cur.archivedGames[cur.archivedGames.length - 1].id : 0;
        const game = { id: lastId + 1, net: currentGameNet, strategy: cur.mode, rolls: currentGameRolls };
        archivedGames = [...cur.archivedGames, game].slice(-10);
        currentGameNet = 0;
        currentGameRolls = 0;
      }

      set({
        rolling: false,
        dice: [d1, d2],
        bets: out.bets,
        point: out.point,
        puckPosition: out.point,   // puck follows the point: ON over the number, or OFF when null
        lastEvents: out.events,
        lastWord: out.word,
        rollId: ++rollSeq,
        rollLog,
        rollDistribution,
        totalRolls: cur.totalRolls + 1,
        sevenOuts,
        peak,
        archivedGames,
        currentGameNet,
        currentGameRolls,
        bankroll,
        undoStack: [],
      });

      const tone = out.pnl > 0 ? "win" : out.pnl < 0 ? "lose" : "info";
      const tail = out.pnl !== 0 ? ` (${out.pnl > 0 ? "+" : ""}${formatMoney(out.pnl)})` : "";
      get().pushToast(`${out.total} · ${out.word}${tail}`, tone);
    }, ROLL_MS);
  },

  // ---------- new session ----------
  reset: () => {
    set({ ...initialState() });
    get().pushToast("New session — good luck.", "info");
  },
}));

// ---------- derived selectors (use with the hook) ----------
export const selectAtRisk = (s) => atRisk(s.bets);
export const selectEquity = (s) => round2(s.bankroll + atRisk(s.bets));
export const selectAccuracy = (s) => (s.actions > 0 ? Math.round((100 * s.correct) / s.actions) : null);
export const selectAverageRoll = (s) => {
  let sum = 0, n = 0;
  for (let k = 2; k <= 12; k++) { sum += k * s.rollDistribution[k]; n += s.rollDistribution[k]; }
  return n ? sum / n : 0;
};

// ---------- pure placement validation/application ----------
// Returns {ok, msg} on failure, or {ok, bets, bankroll, undoStack} on success.
function applyPlacement(s, area) {
  const bets = cloneBets(s.bets);
  const undoStack = s.undoStack.slice();
  const chip = s.chip;
  const point = s.point;
  let bankroll = s.bankroll;

  const n = area.startsWith("comeOdds:") || area.startsWith("dcOdds:") ? Number(area.split(":")[1]) : null;
  const fail = (msg) => ({ ok: false, msg });
  const funds = (amt) => bankroll + 1e-9 >= amt;

  const commit = (path, n2, amount) => {
    if (!funds(amount)) return fail("Not enough bankroll for that chip.");
    if (n2 == null) {
      if (bets[path] + amount > MAX_SPOT) return fail(`Table max is ${formatMoney(MAX_SPOT)} per spot.`);
      bets[path] += amount;
    } else {
      if (bets[path][n2] + amount > MAX_SPOT) return fail(`Table max is ${formatMoney(MAX_SPOT)} per spot.`);
      bets[path][n2] += amount;
    }
    bankroll = round2(bankroll - amount);
    undoStack.push({ path, n: n2, amount });
    return { ok: true };
  };

  let r;
  if (area === "passLine") {
    if (point !== null) return fail("Pass Line is closed once a point is set. Use Come.");
    r = commit("passLine", null, chip);
  } else if (area === "dontPass") {
    if (point !== null) return fail("Don't Pass is closed once a point is set. Use Don't Come.");
    r = commit("dontPass", null, chip);
  } else if (area === "come") {
    if (point === null) return fail("Come bets open after a point is established.");
    r = commit("come", null, chip);
  } else if (area === "dontCome") {
    if (point === null) return fail("Don't Come bets open after a point is established.");
    r = commit("dontCome", null, chip);
  } else if (area === "passOdds") {
    if (point === null) return fail("Take odds after your point is set.");
    if (bets.passLine <= 0) return fail("Put a Pass Line bet down first.");
    if (bets.passOdds + chip > bets.passLine * MAX_ODDS_MULT) return fail(`Max ${MAX_ODDS_MULT}x odds on your line bet.`);
    r = commit("passOdds", null, chip);
  } else if (area === "dontPassOdds") {
    if (point === null) return fail("Lay odds after your point is set.");
    if (bets.dontPass <= 0) return fail("Put a Don't Pass bet down first.");
    if (bets.dontPassOdds + chip > bets.dontPass * MAX_ODDS_MULT) return fail(`Max ${MAX_ODDS_MULT}x odds on your line bet.`);
    r = commit("dontPassOdds", null, chip);
  } else if (area.startsWith("comeOdds:")) {
    if (!BOXES.includes(n) || bets.comeNum[n] <= 0) return fail(`You need a Come point on ${n} first.`);
    if (bets.comeOdds[n] + chip > bets.comeNum[n] * MAX_ODDS_MULT) return fail(`Max ${MAX_ODDS_MULT}x odds on that Come bet.`);
    r = commit("comeOdds", n, chip);
  } else if (area.startsWith("dcOdds:")) {
    if (!BOXES.includes(n) || bets.dcNum[n] <= 0) return fail(`You need a Don't Come point behind ${n} first.`);
    if (bets.dcOdds[n] + chip > bets.dcNum[n] * MAX_ODDS_MULT) return fail(`Max ${MAX_ODDS_MULT}x lay odds.`);
    r = commit("dcOdds", n, chip);
  } else {
    return fail("That area can't take a chip right now.");
  }

  if (!r.ok) return r;
  return { ok: true, bets, bankroll, undoStack };
}
