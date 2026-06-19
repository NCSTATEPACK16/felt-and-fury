// src/components/ChipStack.jsx
// A tactile chip readout. Instead of a single chip labelled with a dollar amount,
// each bet renders a *physical* pile: the value is broken into chip denominations
// (100 / 25 / 5) and stacked with small, deterministic wobble offsets so it reads
// like chips a dealer actually placed. Odds bets keep their gold chips.

const DENOMS = [100, 25, 5];
const MAX_CHIPS = 6; // cap the visible tower; the total still shows on the top chip

function chipColorClass(denom) {
  return denom >= 100 ? "chip-100" : denom >= 25 ? "chip-25" : "chip-5";
}

// Greedy break of a dollar amount into physical chip denominations (largest first).
function toChips(value) {
  const out = [];
  let remaining = value;
  for (const d of DENOMS) {
    while (remaining >= d) { out.push(d); remaining -= d; }
  }
  return out.length ? out : [DENOMS[DENOMS.length - 1]];
}

// Deterministic pseudo-random in [0,1) — keeps each chip's wobble stable across
// re-renders (so the stack doesn't jitter every state change) while varying by
// position and bet size.
function rand(i, salt) {
  const s = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function formatTotal(value) {
  return value >= 1000 ? value / 1000 + "k" : value;
}

function ChipPile({ value, odds, title }) {
  const denoms = toChips(value).slice(0, MAX_CHIPS); // largest-first → bottom-to-top
  const top = denoms.length - 1;
  return (
    <div className="chip-pile" title={title || ""}>
      {denoms.map((d, k) => {
        const x = (rand(k * 2, value) - 0.5) * 5;
        const rot = (rand(k * 2 + 1, value) - 0.5) * 10;
        const y = -k * 6; // each chip sits slightly higher than the one below
        return (
          <div
            key={k}
            className={`chip ${odds ? "chip-gold odds" : chipColorClass(d)}`}
            style={{ transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`, zIndex: k }}
          >
            {k === top ? formatTotal(value) : ""}
          </div>
        );
      })}
    </div>
  );
}

export default function ChipStack({ items }) {
  const visible = items.filter((it) => it.v > 0);
  if (!visible.length) return null;
  return (
    <div className="chipstack">
      {visible.map((it, i) => (
        <ChipPile key={i} value={it.v} odds={it.odds} title={it.title} />
      ))}
    </div>
  );
}
