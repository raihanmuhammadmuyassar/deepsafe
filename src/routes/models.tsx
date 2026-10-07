import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { AppShell, useHealth } from "@/components/AppShell";
import { Panel, StatusBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { KNOWN_MODELS, useSettings } from "@/lib/store";
import type { ModelStatus } from "@/lib/api";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Models — DeepSafe" },
      { name: "description", content: "Status and availability of DeepSafe detection models." },
      { property: "og:title", content: "Models — DeepSafe" },
      { property: "og:description", content: "Status and availability of DeepSafe detection models." },
    ],
  }),
  component: Models,
});

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function Models() {
  const health = useHealth();
  const settings = useSettings();
  const statusFor = (id: string, name: string): ModelStatus => {
    if (health.isLoading) return "loading";
    if (health.isError || !health.data) return "offline";
    const hit = Object.entries(health.data.models).find(([k]) => norm(k).includes(norm(id).slice(0, 6)) || norm(name).includes(norm(k)));
    return hit ? hit[1] : "offline";
  };
  return (
    <AppShell title="Models" description="Detection models served by the DeepSafe backend.">
      <Panel title="Model health" description={health.isError ? "Could not reach /health." : "Live status from /health, refreshed every 30 seconds."}
        action={<Button variant="outline" size="sm" onClick={() => health.refetch()}><RefreshCw className={health.isFetching ? "size-4 animate-spin" : "size-4"} />Refresh</Button>}>
        <div className="grid gap-4 md:grid-cols-3">
          {KNOWN_MODELS.map((m) => {
            const s = statusFor(m.id, m.name);
            return (
              <div key={m.id} className="panel-flat lift p-5">
                <div className="flex items-start justify-between gap-2"><div className="text-sm font-medium">{m.name}</div><StatusBadge status={s} /></div>
                <p className="mt-1 text-[13px] text-muted-foreground">{m.role}</p>
                <dl className="mt-5 space-y-2 text-[13px]">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Media type</dt><dd>{m.media}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Availability</dt><dd>{s === "online" ? "Available" : "Unavailable"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">In ensemble</dt><dd>{settings.enabledModels.includes(m.id) ? "Enabled" : "Disabled"}</dd></div>
                </dl>
              </div>
            );
          })}
        </div>
      </Panel>
    </AppShell>
  );
}
