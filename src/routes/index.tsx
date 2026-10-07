import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ShieldCheck, ShieldAlert, Gauge } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DetectionWorkspace } from "@/components/Detection";
import { StatCard, Panel, Verdict, pct } from "@/components/ui-bits";
import { useHistory } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DeepSafe" },
      { name: "description", content: "Monitor media authenticity analysis and deepfake detection activity." },
      { property: "og:title", content: "Dashboard — DeepSafe" },
      { property: "og:description", content: "Monitor media authenticity analysis and deepfake detection activity." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const history = useHistory();
  const real = history.filter((h) => h.verdict === "REAL").length;
  const avg = history.length ? history.reduce((s, h) => s + h.confidence, 0) / history.length : null;
  return (
    <AppShell title="Dashboard" description="Monitor media authenticity analysis and detection activity.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Analyses" value={String(history.length)} icon={<Activity className="size-4" />} hint="In this browser" />
        <StatCard label="Authentic Media" value={String(real)} icon={<ShieldCheck className="size-4" />} />
        <StatCard label="Detected Deepfakes" value={String(history.length - real)} icon={<ShieldAlert className="size-4" />} />
        <StatCard label="Average Confidence" value={avg === null ? "—" : pct(avg)} icon={<Gauge className="size-4" />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <DetectionWorkspace />
        <Panel title="Recent activity" action={<Link to="/history" className="text-[13px] text-primary hover:underline">View all</Link>} className="h-fit">
          {history.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No analyses yet. Results appear here after you run DeepSafe.</p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {history.slice(0, 6).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-accent">
                  <div className="min-w-0"><div className="truncate text-[13px]">{h.file}</div><div className="text-xs text-muted-foreground">{new Date(h.date).toLocaleString()}</div></div>
                  <Verdict v={h.verdict} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
