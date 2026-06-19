// src/components/AnalyticsDashboard.jsx
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
  PieChart, Pie, Legend,
} from "recharts";
import {
  useCrapsStore, selectAverageRoll, selectAccuracy,
} from "../store/useCrapsStore.js";
import { formatMoney, round2 } from "../engine/CrapsMath.js";

const GOLD = "#e9c46a";
const CRIMSON = "#e23b54";
const WIN = "#36d399";
const AXIS = "#9fb3ab";
const PROP = "#c084fc"; // prop-bet volume slice

// Compact currency for axis ticks so big center-table swings stay readable
// (e.g. -$1.2k instead of -$1,250).
function compactMoney(v) {
  const neg = v < 0;
  const a = Math.abs(v);
  const s = a >= 1000 ? (a / 1000).toFixed(a % 1000 === 0 ? 0 : 1) + "k" : String(round2(a));
  return (neg ? "-$" : "$") + s;
}

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
  const lineVolume = useCrapsStore((s) => s.lineVolume);
  const propVolume = useCrapsStore((s) => s.propVolume);
  const avgRoll = useCrapsStore(selectAverageRoll);
  const accuracy = useCrapsStore(selectAccuracy);

  const distData = [];
  for (let k = 2; k <= 12; k++) distData.push({ name: String(k), count: distribution[k] });

  const gameData = games.map((g, i) => ({
    name: "G" + (i + 1),
    net: g.net,
    strategy: g.strategy,
  }));

  const totalVolume = round2(lineVolume + propVolume);
  const mixData = [
    { name: "Line & odds", value: lineVolume, fill: GOLD },
    { name: "Center props", value: propVolume, fill: PROP },
  ].filter((d) => d.value > 0);
  const propShare = totalVolume > 0 ? Math.round((100 * propVolume) / totalVolume) : 0;

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
            <BarChart data={gameData} margin={{ top: 8, right: 8, left: 6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 12 }} stroke="rgba(255,255,255,.2)" />
              <YAxis
                tick={{ fill: AXIS, fontSize: 12 }}
                stroke="rgba(255,255,255,.2)"
                width={56}
                domain={[(min) => Math.min(0, min), (max) => Math.max(0, max)]}
                tickFormatter={compactMoney}
              />
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

        <div className="lg:col-span-2">
          <ChartShell
            title="Bet mix · line vs prop volume"
            subtitle={totalVolume > 0 ? `${propShare}% on center props` : ""}
            empty={totalVolume === 0}
            emptyMsg="Place bets to see how your wagered volume splits between line/odds bets and high-variance center-table props."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mixData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="rgba(0,0,0,.35)"
                >
                  {mixData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    `${formatMoney(value)} · ${totalVolume > 0 ? Math.round((100 * value) / totalVolume) : 0}%`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  formatter={(v) => <span style={{ color: AXIS, fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>
      </div>
    </section>
  );
}
