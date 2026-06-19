# Felt & Fury — Craps Table & Strategy Trainer

A component-based craps simulator and strategy coach. Play manually with true casino
payouts, or drop into **Three Point Molly** (right-side) / **Three Point Dolly** (dark-side)
trainer modes that highlight the correct next move and grade your accuracy. A live analytics
dashboard charts roll distribution and per-game ROI.

**Stack:** React 18 · Vite 5 · Zustand 4 · Recharts 2 · Tailwind 3

> 🛠️ **Roadmap:** the dicer.io-class modernization (phases 5–14: modern app shell, 3D dice,
> sound/haptics, Strategy Builder, Monte-Carlo simulator, PWA) is tracked in
> [`docs/MODERNIZATION.md`](docs/MODERNIZATION.md) — the living spec the build agent iterates on.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Build for production / preview:

```bash
npm run build
npm run preview
```

Requires Node 18+. Works on Windows/macOS/Linux.

---

## Architecture (mapped to the build PRs)

| PR | Concern | Files |
|----|---------|-------|
| 1 | Pure math + global state | `src/engine/CrapsMath.js`, `src/store/useCrapsStore.js` |
| 2 | Strategy coach (decoupled from UI) | `src/engine/TrainerLogic.js` |
| 3 | Felt board, dice, controls | `src/components/Table.jsx`, `Dice.jsx`, `Controls.jsx` |
| 4 | Analytics + charts | `src/components/AnalyticsDashboard.jsx` |
| 5 | Assembly + styling | `src/App.jsx`, `src/index.css` |

The dependency arrow points one way: **engine → store → components**. The engine has zero
React/DOM imports, so the rules are unit-testable in plain Node (see *Validation* below).

### Data model (store)
- `bankroll`, `point` (null or 4–10), `bets` (Pass/Don't Pass/Come/Don't Come flats + odds per number)
- Session tracking: `rollDistribution` (2–12), `archivedGames` (last 10 `{net, strategy, rolls}`),
  `totalRolls`, `sevenOuts`, `peak`, derived `averageRollValue`
- A **game** = come-out → 7-out. Net P/L accumulates per roll via `resolveRoll().pnl` and archives on a 7-out.

---

## House rules baked into the math
- Pass/Come pay even money; Don't Pass/Don't Come pay even money, **bar 12** (push).
- Odds pay true: **2:1** on 4/10, **3:2** on 5/9, **6:5** on 6/8 (lay odds inverted).
- Odds are capped at **5×** the flat they back; table max **$500/spot**; min chip **$5**.
- **All odds work on every roll, including the come-out** — a casino-selectable rule chosen here
  to keep resolution deterministic and the trainer logic clean.
- **Center-table props:** Hardways pay true **7:1** (hard 4/10) and **9:1** (hard 6/8) — multi-roll,
  they ride on a hard hit and come down on the easy number or any 7 (working on every roll, same rule
  as odds). One-roll bets resolve the next roll and come down: Any Craps **7:1**, Yo-11 **15:1**,
  Aces (2) / Boxcars (12) **30:1**, Any Seven **4:1**.

## Trainer behavior
- The guidance card shows the next required action with an **ACT** / **ROLL** badge and the *why*.
- Off-strategy placements are **allowed but flagged** (toast) and count against accuracy, so you can
  experiment and see the consequence. Rolling before a placement step is finished is **blocked**.

---

## Validation
All checks run against the same pure engine the UI uses:
- **Production build:** `vite build` transforms 849 modules, no errors.
- **House edge (Monte Carlo, 1.5M hands each):** Pass line ≈ 1.36%, Don't Pass ≈ 1.34% — consistent
  with the textbook 1.41% / 1.36%. Odds payout assertions pass exactly.
- **Trainer sequencing:** 20/20 assertions across full Molly and Dolly sequences (place → odds →
  build to three numbers → maintain/replace), plus manual mode emitting zero tasks.

## Notes
- The Recharts bundle is large (~160 KB gzipped); the build's size warning is benign for a single-page tool.
  Code-split with dynamic `import()` if you later trim it.
- Play money only — no real wagering.
