// src/components/Table.jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCrapsStore } from "../store/useCrapsStore.js";
import { BOXES, HARD_PAYOUT, PROP_PAYOUT } from "../engine/CrapsMath.js";
import { nextTask } from "../engine/TrainerLogic.js";
import Dice from "./Dice.jsx";
import Puck from "./Puck.jsx";
import ChipStack from "./ChipStack.jsx";

const BOX_LABEL = { 4: "FOUR", 5: "FIVE", 6: "SIX", 8: "EIGHT", 9: "NINE", 10: "TEN" };

export default function Table() {
  const bets = useCrapsStore((s) => s.bets);
  const point = useCrapsStore((s) => s.point);
  const puckPosition = useCrapsStore((s) => s.puckPosition);
  const mode = useCrapsStore((s) => s.mode);
  const rollTotal = useCrapsStore((s) => (s.rollLog.length ? s.rollLog[0] : null));
  const lastWord = useCrapsStore((s) => s.lastWord);
  const lastEvents = useCrapsStore((s) => s.lastEvents);
  const rollId = useCrapsStore((s) => s.rollId);
  const placeBet = useCrapsStore((s) => s.placeBet);
  const pushToast = useCrapsStore((s) => s.pushToast);

  // win/lose flashes keyed off each resolved roll
  const [flash, setFlash] = useState({});
  useEffect(() => {
    if (!rollId) return;
    const map = {};
    for (const e of lastEvents) {
      if (e.kind === "win" || e.kind === "lose") map[e.area] = e.kind;
    }
    setFlash(map);
    const t = setTimeout(() => setFlash({}), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);

  // ---- dealer puck positioning ----
  // A single absolutely-positioned puck glides between its OFF home (rail) and
  // the top corner of the established point's number box. We measure the target
  // relative to the felt and move the puck with a transform, so CSS animates it.
  const feltRef = useRef(null);
  const offHomeRef = useRef(null);
  const boxRefs = useRef({});
  const [puckXY, setPuckXY] = useState(null);

  useLayoutEffect(() => {
    const felt = feltRef.current;
    if (!felt) return;

    const measure = () => {
      const target = puckPosition == null ? offHomeRef.current : boxRefs.current[puckPosition];
      if (!target) return;
      const f = felt.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      // Sit flush over the OFF home ring; tuck into the top-left corner of a box.
      const inset = puckPosition == null ? 0 : 6;
      setPuckXY({ left: t.left - f.left + inset, top: t.top - f.top + inset });
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(felt);
    return () => ro.disconnect();
  }, [puckPosition]);

  const task = mode === "manual" ? null : nextTask({ mode, point, bets });
  const highlightId = task && task.area ? task.boxId || task.area : null;

  const cls = (id, base) => {
    const f = flash[id] === "win" ? " flash-win" : flash[id] === "lose" ? " flash-lose" : "";
    const h = highlightId === id ? " highlight" : "";
    return base + f + h;
  };

  const clickBox = (n) => {
    let area = bets.comeNum[n] > 0 ? "comeOdds:" + n : bets.dcNum[n] > 0 ? "dcOdds:" + n : null;
    if (!area) {
      pushToast(`No Come / Don't Come point on ${n} yet to back with odds.`, "warn");
      return;
    }
    placeBet(area);
  };

  // A center-table proposition zone (hardway or one-roll bet).
  const propZone = (id, area, label, payTo) => {
    const value = id.startsWith("hard-")
      ? bets.hard[Number(id.slice(5))]
      : bets.prop[area.slice(area.indexOf(":") + 1)];
    return (
      <div
        id={id}
        role="button"
        tabIndex={0}
        aria-label={`${label}, pays ${payTo} to 1`}
        className={cls(id, "bet prop h-14 flex flex-col items-center justify-center text-center")}
        onClick={() => placeBet(area)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); placeBet(area); }
        }}
      >
        <div className="lbl display-font text-[13px] leading-none">{label}</div>
        <div className="lbl text-[9px] tracking-wider text-emerald-200/55 mt-0.5">{payTo}:1</div>
        <ChipStack items={[{ v: value }]} />
      </div>
    );
  };

  return (
    <section className="rail">
      <div ref={feltRef} className="felt p-3 sm:p-5">
        {/* dealer puck rail — the puck's OFF home lives here during the come-out */}
        <div className="puck-rail">
          <div ref={offHomeRef} className="puck-home" aria-hidden="true" />
          <div className="text-[10px] uppercase tracking-[.2em] text-emerald-200/45">
            Dealer puck · marks the point
          </div>
        </div>

        {/* main play area: line/come/number grid (left) + center prop table (right) */}
        <div className="grid lg:grid-cols-[1fr_180px] gap-3 items-start">
          <div>
            {/* number boxes */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {BOXES.map((n) => (
                <div
                  key={n}
                  id={"box-" + n}
                  ref={(el) => { boxRefs.current[n] = el; }}
                  className={cls("box-" + n, "bet h-24 flex flex-col items-center justify-center")}
                  onClick={() => clickBox(n)}
                >
                  <div className="lbl display-font text-2xl leading-none">{n}</div>
                  <div className="lbl text-[9px] tracking-[.18em] text-emerald-200/55">{BOX_LABEL[n]}</div>
                  <ChipStack
                    items={[
                      { v: bets.comeNum[n], title: "Come point" },
                      { v: bets.comeOdds[n], odds: true, title: "Come odds" },
                      { v: bets.dcNum[n], title: "Don't Come" },
                      { v: bets.dcOdds[n], odds: true, title: "Lay odds" },
                    ]}
                  />
                </div>
              ))}
            </div>

            {/* come */}
            <div
              id="come"
              className={cls("come", "bet h-16 mb-2 flex items-center justify-center")}
              onClick={() => placeBet("come")}
            >
              <div className="lbl text-center">
                <div className="display-font text-xl tracking-[.2em]">C O M E</div>
                <div className="text-[10px] text-emerald-200/60">wins 7·11 · travels to box</div>
              </div>
              <ChipStack items={[{ v: bets.come }]} />
            </div>

            {/* don't come */}
            <div
              id="dontCome"
              className={cls("dontCome", "bet dark h-12 mb-3 flex items-center justify-center")}
              onClick={() => placeBet("dontCome")}
            >
              <div className="lbl text-center">
                <div className="display-font text-sm tracking-[.18em] text-rose-200">
                  DON'T COME <span className="text-rose-300/70">· bar 12</span>
                </div>
              </div>
              <ChipStack items={[{ v: bets.dontCome }]} />
            </div>

            {/* don't pass + lay odds */}
            <div
              id="dontPass"
              className={cls("dontPass", "bet dark h-14 mb-2 flex items-center justify-between px-4")}
              onClick={() => placeBet("dontPass")}
            >
              <div className="lbl">
                <div className="display-font text-base tracking-[.14em] text-rose-200">DON'T PASS BAR</div>
                <div className="text-[10px] text-rose-300/60">wins 2·3 · push 12 · loses 7·11</div>
              </div>
              <div
                id="dontPassOdds"
                className={cls("dontPassOdds", "bet dark h-10 w-24 flex items-center justify-center rounded-lg")}
                onClick={(e) => { e.stopPropagation(); placeBet("dontPassOdds"); }}
              >
                <span className="lbl text-[10px] tracking-wider text-rose-200/80">LAY ODDS</span>
                <ChipStack items={[{ v: bets.dontPassOdds, odds: true }]} />
              </div>
              <ChipStack items={[{ v: bets.dontPass }]} />
            </div>

            {/* pass line + take odds */}
            <div
              id="passLine"
              className={cls("passLine", "bet h-16 flex items-center justify-between px-4")}
              onClick={() => placeBet("passLine")}
            >
              <div className="lbl">
                <div className="display-font text-lg tracking-[.16em] text-[color:var(--gold)]">PASS LINE</div>
                <div className="text-[10px] text-emerald-200/60">wins 7·11 · loses 2·3·12 · sets point</div>
              </div>
              <div
                id="passOdds"
                className={cls("passOdds", "bet h-11 w-24 flex items-center justify-center rounded-lg")}
                onClick={(e) => { e.stopPropagation(); placeBet("passOdds"); }}
              >
                <span className="lbl text-[10px] tracking-wider text-emerald-100/80">TAKE ODDS</span>
                <ChipStack items={[{ v: bets.passOdds, odds: true }]} />
              </div>
              <ChipStack items={[{ v: bets.passLine }]} />
            </div>
          </div>

          {/* center table — proposition bets */}
          <div className="center-table flex flex-col gap-2 p-2">
            <div className="text-[9px] uppercase tracking-[.2em] text-emerald-200/45 text-center">
              Center table
            </div>
            {propZone("prop-anySeven", "prop:anySeven", "ANY 7", PROP_PAYOUT.anySeven)}
            <div className="grid grid-cols-2 gap-2">
              {propZone("hard-4", "hard:4", "HARD 4", HARD_PAYOUT[4])}
              {propZone("hard-6", "hard:6", "HARD 6", HARD_PAYOUT[6])}
              {propZone("hard-8", "hard:8", "HARD 8", HARD_PAYOUT[8])}
              {propZone("hard-10", "hard:10", "HARD 10", HARD_PAYOUT[10])}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {propZone("prop-aces", "prop:aces", "ACES 2", PROP_PAYOUT.aces)}
              {propZone("prop-yo", "prop:yo", "YO 11", PROP_PAYOUT.yo)}
              {propZone("prop-boxcars", "prop:boxcars", "BOX 12", PROP_PAYOUT.boxcars)}
            </div>
            {propZone("prop-anyCraps", "prop:anyCraps", "ANY CRAPS", PROP_PAYOUT.anyCraps)}
          </div>
        </div>

        {/* dice + odds hint */}
        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Dice />
            <div className="leading-tight">
              <div className="digital text-3xl font-bold">{rollTotal ?? "—"}</div>
              <div className="text-[11px] text-emerald-200/70 uppercase tracking-wider">
                {lastWord || "roll the dice"}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-emerald-200/60 max-w-[230px]">
            Odds pay true: <span className="text-[color:var(--gold)]">2:1</span> on 4/10,{" "}
            <span className="text-[color:var(--gold)]">3:2</span> on 5/9,{" "}
            <span className="text-[color:var(--gold)]">6:5</span> on 6/8.
          </div>
        </div>

        {/* dealer puck — moved via transform, glides between OFF home and the point box */}
        {puckXY && (
          <div
            className="puck-layer"
            style={{ transform: `translate(${puckXY.left}px, ${puckXY.top}px)` }}
          >
            <Puck on={puckPosition != null} />
          </div>
        )}
      </div>
    </section>
  );
}
