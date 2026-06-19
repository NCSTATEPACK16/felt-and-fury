// src/components/Controls.jsx
import { useCrapsStore } from "../store/useCrapsStore.js";
import { getTasks, getTrainerMeta } from "../engine/TrainerLogic.js";
import { formatMoney } from "../engine/CrapsMath.js";

const CHIPS = [5, 25, 100];

function GuidanceCard() {
  const mode = useCrapsStore((s) => s.mode);
  const point = useCrapsStore((s) => s.point);
  const bets = useCrapsStore((s) => s.bets);
  if (mode === "manual") return null;

  const meta = getTrainerMeta(mode);
  const task = getTasks({ mode, point, bets })[0];
  const dark = mode === "dolly";
  const isRoll = task && task.action === "roll";

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: dark ? "rgba(76,5,25,.45)" : "rgba(6,78,59,.5)",
        borderColor: dark ? "rgba(244,63,94,.4)" : "rgba(233,196,106,.4)",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="display-font text-sm tracking-wide">
          {meta.title} <span className="opacity-70">· {dark ? "dark side" : "right side"}</span>
        </div>
        <div
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: isRoll ? "var(--gold)" : dark ? "var(--crimson)" : "#10b981",
            color: isRoll ? "#062b20" : "#fff",
          }}
        >
          {isRoll ? "ROLL" : "ACT"}
        </div>
      </div>
      <div className="text-sm leading-snug mb-2">{task ? task.text : ""}</div>
      <div className="text-[11px] leading-snug opacity-80">{meta.why}</div>
    </div>
  );
}

export default function Controls() {
  const mode = useCrapsStore((s) => s.mode);
  const chip = useCrapsStore((s) => s.chip);
  const rolling = useCrapsStore((s) => s.rolling);
  const setMode = useCrapsStore((s) => s.setMode);
  const setChip = useCrapsStore((s) => s.setChip);
  const roll = useCrapsStore((s) => s.roll);
  const undo = useCrapsStore((s) => s.undo);

  return (
    <aside className="space-y-3">
      {/* mode */}
      <div className="readout rounded-xl p-4">
        <label className="text-[10px] uppercase tracking-[.15em] text-emerald-200/60">Game mode</label>
        <select
          className="digital mt-1 w-full bg-emerald-950/70 border border-emerald-400/25 rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[color:var(--gold)]"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="manual">Manual play</option>
          <option value="molly">Three Point Molly — trainer</option>
          <option value="dolly">Three Point Dolly — trainer</option>
        </select>
      </div>

      <GuidanceCard />

      {/* chips */}
      <div className="readout rounded-xl p-4">
        <div className="text-[10px] uppercase tracking-[.15em] text-emerald-200/60 mb-2">
          Chip size <span className="text-emerald-200/40">· min $5 · max $500/spot</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {CHIPS.map((v) => (
            <button
              key={v}
              className={`chipbtn chip chip-${v} ${chip === v ? "selectchip" : ""}`}
              onClick={() => setChip(v)}
            >
              ${v}
            </button>
          ))}
          <div className="ml-auto text-right">
            <div className="text-[10px] text-emerald-200/60">Selected</div>
            <div className="digital text-xl font-bold text-[color:var(--gold)]">{formatMoney(chip)}</div>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="space-y-2">
        <button
          className="w-full display-font tracking-wider text-lg py-4 rounded-xl text-emerald-950 shadow-lg active:translate-y-px transition disabled:opacity-60"
          style={{ background: "linear-gradient(to bottom, var(--gold-bright), var(--gold-deep))" }}
          onClick={roll}
          disabled={rolling}
        >
          {rolling ? "ROLLING…" : "ROLL DICE"}
        </button>
        <button
          className="w-full text-sm font-semibold py-2.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/70 border border-emerald-400/20 transition"
          onClick={undo}
        >
          Undo last chip
        </button>
      </div>

      {/* legend */}
      <div className="readout rounded-xl p-4 text-[11px] leading-relaxed text-emerald-100/80">
        <div className="display-font text-xs tracking-wide text-[color:var(--gold)] mb-1">How to play</div>
        Tap a chip size, then tap a bet area to place it. Pass / Don't Pass open only on the come-out.
        Come / Don't Come open once a point is set. Tap a number box to back a Come/Don't Come point with{" "}
        <em>odds</em>. <span className="text-emerald-200/60">Odds work on every roll (casino-selectable rule).</span>
      </div>
    </aside>
  );
}
