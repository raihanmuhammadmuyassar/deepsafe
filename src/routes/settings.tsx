import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/ui-bits";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { KNOWN_MODELS, settingsStore, useSettings, type Settings } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DeepSafe" },
      { name: "description", content: "Configure detection threshold, ensemble strategy and models." },
      { property: "og:title", content: "Settings — DeepSafe" },
      { property: "og:description", content: "Configure detection threshold, ensemble strategy and models." },
    ],
  }),
  component: SettingsPage,
});

function Row({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="text-sm font-medium">{label}</div><div className="text-[13px] text-muted-foreground">{hint}</div></div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const s = useSettings();
  const set = (p: Partial<Settings>) => settingsStore.set({ ...settingsStore.get(), ...p });
  return (
    <AppShell title="Settings" description="Preferences are saved in this browser.">
      <div className="mx-auto max-w-3xl space-y-6">
        <Panel title="Detection">
          <div className="divide-y">
            <Row label="Threshold" hint="Deepfake probability above which media is marked FAKE.">
              <div className="flex w-full items-center gap-4 sm:w-64">
                <Slider min={0.05} max={0.95} step={0.05} value={[s.threshold]} onValueChange={([v]) => set({ threshold: v ?? 0.5 })} />
                <span className="w-10 text-right font-mono text-sm">{s.threshold.toFixed(2)}</span>
              </div>
            </Row>
            <Row label="Ensemble strategy" hint="How individual model scores are combined.">
              <div className="panel-flat flex p-0.5">
                {(["voting", "average", "stacking"] as const).map((m) => (
                  <button key={m} onClick={() => set({ ensembleMethod: m })} className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors", s.ensembleMethod === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{m}</button>
                ))}
              </div>
            </Row>
          </div>
        </Panel>
        <Panel title="Models" description="Choose which models participate in detection.">
          <div className="divide-y">
            {KNOWN_MODELS.map((m) => (
              <Row key={m.id} label={m.name} hint={`${m.media} · ${m.role}`}>
                <Switch checked={s.enabledModels.includes(m.id)} onCheckedChange={(on) => set({ enabledModels: on ? [...s.enabledModels, m.id] : s.enabledModels.filter((x) => x !== m.id) })} />
              </Row>
            ))}
          </div>
        </Panel>
        <Panel title="Appearance">
          <div className="divide-y">
            <Row label="Dark mode" hint="Use a darker interface."><Switch checked={s.darkMode} onCheckedChange={(v) => set({ darkMode: v })} /></Row>
            <Row label="Developer mode" hint="Show raw API responses beneath results."><Switch checked={s.debug} onCheckedChange={(v) => set({ debug: v })} /></Row>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
