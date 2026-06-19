# Felt & Fury — Modernization Roadmap

> **Living document.** This is the hand-off spec for the AI agent (Claude, Opus-class) and humans
> driving the dicer.io-class modernization of Felt & Fury. Update the relevant section — especially
> the **Phase roadmap** status boxes and the **Changelog** — at the end of every merged phase.
> Keep it accurate: if a file, function, or token named here changes, fix it here too.

---

## 1. Vision & benchmark

Felt & Fury is a play-money craps **table + strategy trainer**. The goal of this effort is to make
it **more interactive, modern, and sleek**, benchmarked against **[dicer.io](https://dicer.io)** —
"A Revolutionary Online Craps Strategy Builder and Simulator." dicer.io's standout pieces are a
**visual strategy builder**, a **Monte-Carlo simulator with graphs**, and a clean board, wrapped in
a polished app UI.

"Like dicer.io" therefore means **both**:
- a **visual / interaction overhaul** (sleek dark app shell around a modernized green felt, spring
  motion, 3D dice, sound, haptics), and
- a **feature expansion** — a custom **Strategy Builder** and a **Monte-Carlo Simulator**.

**Targets:** Safari on **iPhone 15 Pro Max** (primary mobile) and **desktop PCs**.

**"Done" looks like:** a installable PWA where a user can play the felt with tactile feedback,
visually compose a custom betting strategy, simulate it over 100k+ hands off the main thread, and
read rich risk/EV charts — all smooth on an iPhone and a desktop.

### Confirmed product decisions
- **Aesthetic:** *Modernize the felt* — keep casino-green felt as the hero; sleek dark chrome,
  glass panels, neon-gold accents, motion around it.
- **Scope:** *Full dicer.io parity* — facelift + simulator + strategy builder.
- **Native extras:** PWA + offline, iOS haptics, sound effects, 3D/physics dice (all in).
- **No backend.** Static Netlify SPA; persist to `localStorage` via Zustand `persist`.
  Accounts / cloud-sync are **out of scope**.

---

## 2. Current architecture

One-way dependency — **`engine → store → components`**. The engine has **zero** React/DOM imports
and must stay that way (it powers headless simulation).

| Layer | File | Responsibility |
|-------|------|----------------|
| Engine | [`src/engine/CrapsMath.js`](../src/engine/CrapsMath.js) | Pure rules: `resolveRoll`, payouts, bet model, limits |
| Engine | [`src/engine/TrainerLogic.js`](../src/engine/TrainerLogic.js) | Coach: `getTasks`/`nextTask`/`evaluatePlacement` (Molly/Dolly) |
| State | [`src/store/useCrapsStore.js`](../src/store/useCrapsStore.js) | Zustand store: bankroll, bets, point, puck, analytics, volume, toasts |
| UI | [`src/components/Table.jsx`](../src/components/Table.jsx) | Felt board, number boxes, center props, puck, flashes |
| UI | [`src/components/Controls.jsx`](../src/components/Controls.jsx) | Mode, guidance card, chips, roll/undo |
| UI | [`src/components/ChipStack.jsx`](../src/components/ChipStack.jsx) | Physical chip piles (denominations + wobble) |
| UI | [`src/components/Dice.jsx`](../src/components/Dice.jsx) | CSS pip dice with tumble |
| UI | [`src/components/Puck.jsx`](../src/components/Puck.jsx) | 3D flip ON/OFF dealer puck |
| UI | [`src/components/AnalyticsDashboard.jsx`](../src/components/AnalyticsDashboard.jsx) | Recharts: roll dist, last-10 games, bet-mix donut |
| Shell | [`src/App.jsx`](../src/App.jsx) | Header + layout + toasts |

**Stack:** React 18 · Vite 8 · Zustand 4 · Recharts 2 · Tailwind 3.

### Pure-engine reuse points (do not reinvent)
- `resolveRoll(prev, d1, d2)` — resolves one roll; **the simulator loops this headlessly**.
- `atRisk`, `oddsProfit`, `emptyBets`/`cloneBets`, `HARD_PAYOUT`/`PROP_PAYOUT`, `formatMoney`,
  `round2` — [`CrapsMath.js`](../src/engine/CrapsMath.js).
- `getTasks`/`nextTask`/`evaluatePlacement` — [`TrainerLogic.js`](../src/engine/TrainerLogic.js).
  **Generalize these into a data-driven strategy spec (Phase 9); preserve semantics.**
- `compactMoney`, chart shells, `tooltipStyle` — [`AnalyticsDashboard.jsx`](../src/components/AnalyticsDashboard.jsx).
- Measured puck positioning + flash logic — [`Table.jsx`](../src/components/Table.jsx).

---

## 3. Design system

Source of truth = CSS variables in [`src/index.css`](../src/index.css) `:root`, exposed through
[`tailwind.config.js`](../tailwind.config.js). Established tokens today: `--gold`, `--gold-bright`,
`--gold-deep`, `--crimson`, `--win`, `--felt`.

**Add (Phase 5):**
- **Palette:** dark neutral chrome (`--bg`, `--surface`, `--surface-2`, `--border`), neon-gold
  accents, semantic `--win`/`--lose`/`--info`. Keep felt green as the board hero.
- **Type scale:** display (existing `.display-font`), body, mono (`.digital`); fluid sizes via
  `clamp()`.
- **Spacing / radii / shadows / glass:** spacing step, radius scale, layered shadow tokens, a
  `--glass-blur` + translucent surface for panels.
- **Motion tokens:** durations (`--dur-fast/base/slow`) and easings/spring presets; everything
  must degrade under the existing `@media (prefers-reduced-motion: reduce)` block.

**Felt-modernization rules:** felt stays green with the fabric-noise texture (added Phase 3);
chrome around it goes dark/glass; gold is the single accent; motion is springy but subtle; never
sacrifice legibility or touch-target size for flourish.

---

## 4. Phase roadmap

Status: `[ ]` not started · `[~]` in progress · `[x]` merged. **Current focus → Phase 5.**

| # | Phase | Status | Acceptance |
|---|-------|--------|------------|
| 1 | Dealer puck & spatial refactor | `[x]` | Puck reflects point; header card removed |
| 2 | Center-table prop bets | `[x]` | Hardways + one-roll bets resolve at true odds |
| 3 | Tactile chips, felt texture, prop hitboxes | `[x]` | Physical chip stacks; fabric felt; hover/focus |
| 4 | Line-vs-prop analytics + Netlify | `[x]` | Bet-mix donut; `netlify.toml` |
| 5 | Design system & motion foundation | `[ ]` | Tokens drive components; no regressions; this doc exists |
| 6 | Responsive app shell (iPhone 15 PM + PC) | `[ ]` | No overflow / Dynamic-Island overlap; desktop ≥ today |
| 7 | Tactile board & chip motion | `[ ]` | Spring placements/resolutions; reduced-motion snaps; 60fps |
| 8 | 3D dice + sound + haptics | `[ ]` | Dice land on real face; cues + toggles persist |
| 9 | Data-driven strategy engine | `[ ]` | Built-in Molly/Dolly specs reproduce today exactly |
| 10 | Strategy Builder UI | `[ ]` | Build→save→play a custom strategy; persists; validates |
| 11 | Monte-Carlo simulator (Web Worker) | `[ ]` | 100k+ hands off-thread; EV matches textbook edge |
| 12 | Simulation analytics dashboard | `[ ]` | Trajectory/drawdown/risk-of-ruin; A/B compare |
| 13 | PWA, offline, persistence, performance | `[ ]` | Installs on iPhone; offline; smaller initial JS |
| 14 | Polish, a11y, QA, deploy | `[ ]` | Clean a11y; smooth on real iPhone; live deploy verified |

Per-phase detail (goals, files, exact acceptance) lives in the approved plan; mirror any changes
back into the table above.

---

## 5. Strategy spec (Phase 9 schema)

A `StrategySpec` is plain JSON so the **trainer and simulator share it**. Proposed shape (refine
during Phase 9; keep it serializable and engine-pure):

```js
/** @typedef {Object} StrategySpec
 * @property {string} id            unique id (slug)
 * @property {string} name          display name
 * @property {'right'|'dark'} side  pass/come vs don't-pass/don't-come
 * @property {number} baseUnit      base flat bet (multiple of MIN_BET)
 * @property {number} oddsMultiple  odds to take/lay behind each point (×, capped by MAX_ODDS_MULT)
 * @property {number} workingNumbers target count of working numbers (e.g. 3 for Molly/Dolly)
 * @property {Object} [props]       optional prop rules { hard?: number[], oneRoll?: string[] }
 * @property {Object} [press]       press/regression on hits { mode:'flat'|'press'|'regress', ... }
 * @property {Object} [stop]        session stops { winGoal?: number, lossLimit?: number }
 */
```

A pure `StrategyEngine.next({ spec, point, bets, history })` returns the ordered next action(s)
(`place`/`odds`/`roll`) — the generalization of `getTasks`. `evaluatePlacement` becomes
spec-driven. **Built-in specs** for Molly/Dolly must reproduce current guidance and accuracy
(regression-test before merging Phase 9).

---

## 6. Agent operating guide

**Workflow (one phase per PR):**
1. Sync: `git checkout main && git pull origin main`.
2. Branch: `git checkout -b phase-N-short-name`.
3. Implement the phase; keep the engine React-free.
4. Verify (below). Update this doc's roadmap table + changelog.
5. Commit (end message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`), push
   `-u origin phase-N-...`. **The user opens & merges the PR** (no `gh` here — plain git only).
6. After merge, sync `main` before the next phase.

**Hard rules:**
- `src/engine/**` must have **no** React/DOM imports — it is the headless simulation core.
- Don't change Molly/Dolly behavior without a passing regression check.
- Everything animated must degrade under `prefers-reduced-motion`.
- Respect table limits/constants in `CrapsMath.js` (`MIN_BET`, `MAX_SPOT`, `MAX_ODDS_MULT`).

**Verify each phase:**
- `npm run build` → clean (watch the bundle trend **down** after Phase 13 code-splitting).
- Pure-engine assertions via `node --input-type=module -e "..."` importing from
  `./src/engine/*` (this pattern was used to validate Phases 2 & the trainer fix). Required for
  Phase 9 (specs reproduce Molly/Dolly) and Phase 11 (sim EV ≈ 1.36% / 1.40% edge).
- Manual QA on **desktop and iPhone 15 Pro Max Safari** — use the Netlify **deploy-preview URL**
  from the phase's PR to test on a real device before merge.

**iPhone 15 Pro Max / Safari constraints:**
`viewport-fit=cover` + `env(safe-area-inset-*)` padding (Dynamic Island / home indicator);
use `100dvh` not `100vh`; `-webkit-tap-highlight-color: transparent` and ≥44px touch targets;
`touch-action` / `overscroll-behavior` to stop rubber-banding; profile 3D dice + backdrop-blur for
perf; iOS haptics are best-effort (`navigator.vibrate` may be unavailable — no-op gracefully);
PWA needs `apple-touch-icon`, `apple-mobile-web-app-*` meta, a maskable icon, and a custom splash.

---

## 7. Netlify deployment

The repo ships [`netlify.toml`](../netlify.toml) (build command, `dist` publish dir, `NODE_VERSION`,
SPA redirect), so connecting the repo is nearly zero-config.

1. **Connect:** Netlify dashboard → **Add new site → Import an existing project** → **GitHub** →
   `NCSTATEPACK16/Felt-and-Fury` → production branch **`main`**.
2. **Build settings:** auto-detected from `netlify.toml` (`command = "npm run build"`,
   `publish = "dist"`, `NODE_VERSION = "18"`, `/* → /index.html` 200). No manual entry needed.
3. **Deploy Previews:** enable so **every PR gets a preview URL** — open it on the iPhone to test
   each phase before merging.
4. **PWA headers (add in Phase 13):** in `netlify.toml`, no-cache `sw.js` + the web manifest,
   long-cache-immutable `/assets/*`, and correct `application/manifest+json` MIME for `.webmanifest`.
   Service workers require HTTPS (Netlify provides it automatically).
5. **HTTPS / custom domain:** HTTPS is auto-provisioned; add a domain later under **Domain
   management** if desired.
6. **Verify on device:** open the deploy URL in iPhone 15 Pro Max Safari → **Share → Add to Home
   Screen** → confirm icon/splash, offline launch, and safe-area layout.

---

## 8. Changelog

- **Phase 1** — Dealer puck & point UI spatial refactor (PR #1).
- **Phase 2** — Center-table proposition bets + analytics/trainer fixes (PR #2).
- **Phase 3** — Tactile chip stacks, felt texture, prop hitbox polish (PR #3).
- **Phase 4** — Line-vs-prop analytics + Netlify deploy config (PR #4).
- _Add one line here per merged modernization phase (5–14)._
