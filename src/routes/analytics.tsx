import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Empty, Panel, pct } from "@/components/ui-bits";
import { useHistory } from "@/lib/store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — DeepSafe" },
      { name: "description", content: "Detection volume, verdict distribution and model comparison." },
      { property: "og:title", content: "Analytics — DeepSafe" },
      { property: "og:description", content: "Detection volume, verdict distribution and model comparison." },
    ],
  }),
  component: Analytics,
});

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const tip = { borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 };

function Analytics() {
  const h = useHistory();
  if (!h.length)
    return (
      <AppShell title="Analytics" description="Insights from your detection activity.">
        <Panel><Empty icon={<BarChart3 className="size-5" />} title="No data to analyze yet" body="Analytics are computed from completed detections. Run an analysis to populate these charts." /></Panel>
      </AppShell>
    );

  const byDay = Object.entries(h.reduce<Record<string, number>>((a, e) => { const d = e.date.slice(0, 10); a[d] = (a[d] ?? 0) + 1; return a; }, {}))
    .sort().slice(-14).map(([d, n]) => ({ d: d.slice(5), n }));
  const real = h.filter((e) => e.verdict === "REAL").length;
  const dist = [{ name: "Real", v: real, c: "var(--success)" }, { name: "Fake", v: h.length - real, c: "var(--destructive)" }];
  const bins = ["50–60", "60–70", "70–80", "80–90", "90–100"].map((label, i) => ({
    label, n: h.filter((e) => e.confidence >= 0.5 + i * 0.1 && (i === 4 ? e.confidence <= 1 : e.confidence < 0.6 + i * 0.1)).length,
  }));
  const models = Object.entries(h.flatMap((e) => e.models.map((m) => ({ ...m, agree: m.verdict === e.verdict }))).reduce<Record<string, { n: number; a: number }>>((acc, m) => {
    const s = (acc[m.name] ??= { n: 0, a: 0 }); s.n++; if (m.agree) s.a++; return acc;
  }, {})).map(([name, s]) => ({ name, agreement: +((s.a / s.n) * 100).toFixed(1), runs: s.n }));

  return (
    <AppShell title="Analytics" description="Insights from your detection activity.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Detection volume" description="Analyses per day">
          <div className="h-56"><ResponsiveContainer><BarChart data={byDay} margin={{ left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="d" tick={axis} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="n" name="Analyses" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Real vs fake" description={`${h.length} analyses`}>
          <div className="flex h-56 items-center gap-6">
            <ResponsiveContainer width="55%"><PieChart><Pie data={dist} dataKey="v" innerRadius="62%" outerRadius="90%" stroke="none">{dist.map((d) => <Cell key={d.name} fill={d.c} />)}</Pie><Tooltip contentStyle={tip} /></PieChart></ResponsiveContainer>
            <ul className="space-y-3 text-sm">{dist.map((d) => (
              <li key={d.name} className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: d.c }} />{d.name}<span className="ml-2 font-mono text-muted-foreground">{pct(d.v / h.length)}</span></li>
            ))}</ul>
          </div>
        </Panel>
        <Panel title="Confidence distribution" description="Verdict confidence (%)">
          <div className="h-56"><ResponsiveContainer><BarChart data={bins} margin={{ left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="n" name="Analyses" fill="var(--info)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Model agreement" description="How often each model matched the ensemble verdict">
          {models.length ? (
            <ul className="space-y-4">{models.map((m) => (
              <li key={m.name}>
                <div className="flex justify-between text-[13px]"><span>{m.name}</span><span className="font-mono text-muted-foreground">{m.agreement}% · {m.runs} runs</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${m.agreement}%` }} /></div>
              </li>
            ))}</ul>
          ) : <p className="text-[13px] text-muted-foreground">No per-model results were returned for these analyses.</p>}
        </Panel>
      </div>
    </AppShell>
  );
}
