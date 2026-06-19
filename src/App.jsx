// src/App.jsx
import Table from "./components/Table.jsx";
import Controls from "./components/Controls.jsx";
import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";
import { useCrapsStore, selectAtRisk } from "./store/useCrapsStore.js";
import { formatMoney } from "./engine/CrapsMath.js";

function Header() {
  const bankroll = useCrapsStore((s) => s.bankroll);
  const rollLog = useCrapsStore((s) => s.rollLog);
  const reset = useCrapsStore((s) => s.reset);
  const risk = useCrapsStore(selectAtRisk);

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h1 className="display-font text-2xl sm:text-3xl">
            Felt <span className="text-[color:var(--gold)]">&amp;</span> Fury
          </h1>
          <span className="text-emerald-200/70 text-xs sm:text-sm hidden sm:inline">
            Craps table &amp; strategy trainer
          </span>
        </div>
        <button
          className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg bg-rose-900/50 hover:bg-rose-800/60 border border-rose-400/25 transition"
          onClick={reset}
        >
          New session
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div className="readout rounded-xl px-4 py-3">
          <div className="text-[10px] uppercase tracking-[.15em] text-emerald-200/60">Bankroll</div>
          <div className="digital text-2xl sm:text-3xl font-bold text-[color:var(--gold)]">{formatMoney(bankroll)}</div>
        </div>
        <div className="readout rounded-xl px-4 py-3">
          <div className="text-[10px] uppercase tracking-[.15em] text-emerald-200/60">At risk</div>
          <div className="digital text-2xl sm:text-3xl font-bold">{formatMoney(risk)}</div>
        </div>
        <div className="readout rounded-xl px-4 py-3 col-span-2 lg:col-span-1">
          <div className="text-[10px] uppercase tracking-[.15em] text-emerald-200/60">Last 5 rolls</div>
          <div className="digital text-sm font-semibold flex gap-2 mt-1 flex-wrap text-emerald-100/90">
            {rollLog.length === 0
              ? "—"
              : rollLog.map((t, i) => (
                  <span key={i} className={i === 0 ? "text-[color:var(--gold)]" : ""}>
                    {t}
                    {i < rollLog.length - 1 && <span className="opacity-30 ml-2">·</span>}
                  </span>
                ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function Toasts() {
  const toasts = useCrapsStore((s) => s.toasts);
  const dismiss = useCrapsStore((s) => s.dismissToast);
  return (
    <div id="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1180px] mx-auto px-3 sm:px-5 py-4 sm:py-6">
        <Header />
        <main className="grid lg:grid-cols-[1fr_330px] gap-4 items-start">
          <Table />
          <Controls />
        </main>
        <AnalyticsDashboard />
        <footer className="text-center text-[11px] text-emerald-200/40 mt-6">
          Practice tool with play money — no real wagering. Payouts use true casino odds.
        </footer>
      </div>
      <Toasts />
    </div>
  );
}
