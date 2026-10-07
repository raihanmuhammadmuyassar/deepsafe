import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, History as HistoryIcon, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Empty, Panel, Verdict, pct } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { historyStore, useHistory } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — DeepSafe" },
      { name: "description", content: "Review past media authenticity analyses." },
      { property: "og:title", content: "History — DeepSafe" },
      { property: "og:description", content: "Review past media authenticity analyses." },
    ],
  }),
  component: HistoryPage,
});

type SortKey = "date" | "confidence" | "file";

function HistoryPage() {
  const history = useHistory();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | "REAL" | "FAKE">("ALL");
  const [sort, setSort] = useState<{ k: SortKey; asc: boolean }>({ k: "date", asc: false });

  const rows = useMemo(() => {
    const r = history.filter((h) => (filter === "ALL" || h.verdict === filter) && h.file.toLowerCase().includes(q.toLowerCase()));
    return [...r].sort((a, b) => {
      const d = sort.k === "confidence" ? a.confidence - b.confidence : String(a[sort.k]).localeCompare(String(b[sort.k]));
      return sort.asc ? d : -d;
    });
  }, [history, q, filter, sort]);

  const th = (k: SortKey, label: string) => (
    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ k, asc: s.k === k ? !s.asc : false }))}>
      {label}<ArrowUpDown className="size-3" />
    </button>
  );

  return (
    <AppShell title="History" description="Analyses run from this browser.">
      <Panel>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search files" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="panel-flat flex p-0.5">
            {(["ALL", "REAL", "FAKE"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>
          {history.length > 0 && <Button variant="ghost" size="sm" onClick={() => historyStore.set([])}><Trash2 className="size-4" />Clear</Button>}
        </div>
        {rows.length === 0 ? (
          <Empty icon={<HistoryIcon className="size-5" />} title={history.length ? "No matching analyses" : "No analysis history yet"}
            body={history.length ? "Try a different search or filter." : "Completed detections are recorded here automatically."}
            action={!history.length && <Button asChild><Link to="/detection">Analyze media</Link></Button>} />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-y bg-surface-2 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-6 py-2.5 font-medium">{th("file", "File")}</th>
                  <th className="px-3 py-2.5 font-medium">Media Type</th>
                  <th className="px-3 py-2.5 font-medium">Verdict</th>
                  <th className="px-3 py-2.5 font-medium">{th("confidence", "Confidence")}</th>
                  <th className="px-3 py-2.5 font-medium">Detection Method</th>
                  <th className="px-3 py-2.5 font-medium">{th("date", "Date")}</th>
                  <th className="px-6 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((h) => (
                  <tr key={h.id} className="transition-colors hover:bg-accent/60">
                    <td className="max-w-56 truncate px-6 py-3">{h.file}</td>
                    <td className="px-3 py-3 text-muted-foreground">{h.mediaType}</td>
                    <td className="px-3 py-3"><Verdict v={h.verdict} /></td>
                    <td className="px-3 py-3 font-mono tabular-nums">{pct(h.confidence)}</td>
                    <td className="px-3 py-3 capitalize text-muted-foreground">{h.method}</td>
                    <td className="px-3 py-3 text-muted-foreground">{new Date(h.date).toLocaleString()}</td>
                    <td className="px-6 py-3"><span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">{h.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
