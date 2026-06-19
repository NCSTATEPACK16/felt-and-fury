// src/components/AnalyticsDashboard.jsx
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import {
  useCrapsStore, selectAverageRoll, selectAccuracy,
} from "../store/useCrapsStore.js";
import { formatMoney } from "../engine/CrapsMath.js";

const GOLD = "#e9c46a";
const CRIMSON = "#e23b54";
const WIN = "#36d399";
const AXIS = "#9fb3ab";

const tooltipStyle = {
  background: "#08201a",
  border: "1px solid rgba(233,196,106,.35)",
  borderRadius: 10,
  color: "#fff",
  fontSize: 12,
};

function StatCard({ label, value, accent }) {
  return (
    <div className="readout rounded-xl px-4 py-3">
      <div className="text-[10px] uppercase tracking-[.15em] text-emerald-200/60">{label}</div>
      <div className="digital text-2xl font-bold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}

function ChartShell({ title, subtitle, empty, emptyMsg, children }) {
  return (
    <div className="readout rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="display-font text-sm tracking-wide">{title}</div>
        <div className="text-[10px] text-emerald-200/50">{subtitle}</div>
      </div>
      <div className="h-56">
        {empty ? (
          <div className="h-full flex items-center justify-center text-center text-emerald-200/50 text-sm px-6">
            {emptyMsg}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const distribution = useCrapsStore((s) => s.rollDistribution);
  const totalRolls = useCrapsStore((s) => s.totalRolls);
  const sevenOuts = useCrapsStore((s) => s.sevenOuts);
  const peak = useCrapsStore((s) => s.peak);
  const games = useCrapsStore((s) => s.archivedGames);
  const mode = useCrapsStore((s) => s.mode);
  const avgRoll = useCrapsStore(selectAverageRoll);
  const accuracy = useCrapsStore(selectAccuracy);

  const distData = [];
  for (let k = 2; k <= 12; k++) distData.push({ name: String(k), count: distribution[k] });

  const gameData = games.map((g, i) => ({
    name: "G" + (i + 1),
    net: g.net,
    strategy: g.strategy,
  }));

  const accuracyDisplay = mode === "manual" && accuracy === null ? "—" : accuracy === null ? "—" : accuracy + "%";

  return (
    <section className="mt-5">
      <h2 className="display-font text-lg mb-3 tracking-wide">
        Session analytics <span className="text-emerald-200/40 text-sm">· live</span>
      </h2>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <StatCard label="Average roll value" value={avgRoll ? avgRoll.toFixed(2) : "—"} />
        <StatCard label="Total 7-outs" value={sevenOuts} accent={CRIMSON} />
        <StatCard label="Peak bankroll" value={formatMoney(peak)} accent={GOLD} />
        <StatCard label="Strategy accuracy" value={accuracyDisplay} accent={WIN} />
      </div>

      {/* charts */}
      <div className="grid lg:grid-cols-2 gap-3">
        <ChartShell
          title="Roll distribution"
          subtitle={`${totalRolls} roll${totalRolls === 1 ? "" : "s"}`}
          empty={totalRolls === 0}
          emptyMsg="Roll the dice to start charting how often each total comes up. Seven is shown in red."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 12 }} stroke="rgba(255,255,255,.2)" />
              <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 12 }} stroke="rgba(255,255,255,.2)" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,.05)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distData.map((d) => (
                  <Cell key={d.name} fill={d.name === "7" ? CRIMSON : GOLD} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell
          title="Last 10 games · net result"
          subtitle="come-out to 7-out"
          empty={gameData.length === 0}
          emptyMsg="Finish a full game (come-out through 7-out) and its net win or loss lands here, so you can see whether your strategy is trending up or down."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gameData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 12 }} stroke="rgba(255,255,255,.2)" />
              <YAxis tick={{ fill: AXIS, fontSize: 12 }} stroke="rgba(255,255,255,.2)" />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255,255,255,.05)" }}
                formatter={(value, _n, item) => [formatMoney(value), "net · " + (item?.payload?.strategy || "")]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,.35)" />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {gameData.map((d) => (
                  <Cell key={d.name} fill={d.net >= 0 ? WIN : CRIMSON} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </section>
  );
}
