import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileImage, FileVideo, X, RefreshCw, Download, Play, Check, AlertCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import { detect, type DetectionResult } from "@/lib/api";
import { addHistory, KNOWN_MODELS, useSettings } from "@/lib/store";
import { Panel, Verdict, bytes, pct } from "./ui-bits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPT = ".jpg,.jpeg,.png,.mp4,.avi";

export function DetectionWorkspace() {
  const settings = useSettings();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const pick = (f?: File | null) => {
    if (!f) return;
    if (!/\.(jpe?g|png|mp4|avi)$/i.test(f.name)) { toast.error("Unsupported format. Use JPG, PNG, MP4 or AVI."); return; }
    setFile(f); setUrl(URL.createObjectURL(f)); setResult(null); setError(null);
  };
  const clear = () => { setFile(null); setUrl(null); setResult(null); setError(null); if (input.current) input.current.value = ""; };
  const isVideo = !!file?.type.startsWith("video") || /\.(mp4|avi)$/i.test(file?.name ?? "");
  const modelsInPlay = KNOWN_MODELS.filter((m) => settings.enabledModels.includes(m.id) && m.media === (isVideo ? "Video" : "Image"));

  const run = async () => {
    if (!file) return;
    setRunning(true); setError(null); setResult(null);
    try {
      const r = await detect(file, { threshold: settings.threshold, ensembleMethod: settings.ensembleMethod, models: settings.enabledModels });
      setResult(r); addHistory(file, r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
    } finally { setRunning(false); }
  };

  return (
    <div className="space-y-6">
      <Panel title="Analyze Media" description="Upload an image or video to evaluate its authenticity.">
        <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center transition-colors",
              drag ? "border-primary bg-primary-soft" : "border-input bg-surface-2",
            )}
          >
            <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><UploadCloud className="size-5" /></div>
            <p className="mt-4 text-sm font-medium">Drag and drop a file here</p>
            <p className="mt-1 text-[13px] text-muted-foreground">JPG, PNG, MP4, AVI</p>
            <Button className="mt-5" onClick={() => input.current?.click()}>Browse Files</Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-xl border bg-secondary">
              {isVideo
                ? <video src={url!} controls className="aspect-video w-full bg-foreground/90 object-contain" />
                : <img src={url!} alt={file.name} className="aspect-video w-full object-contain" />}
            </div>
            <div className="flex flex-col">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  {isVideo ? <FileVideo className="size-4" /> : <FileImage className="size-4" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{isVideo ? "Video" : "Image"} · {file.type || "unknown"} · {bytes(file.size)}</div>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
                <div className="panel-flat p-3"><dt className="text-muted-foreground">Threshold</dt><dd className="mt-0.5 font-mono">{settings.threshold.toFixed(2)}</dd></div>
                <div className="panel-flat p-3"><dt className="text-muted-foreground">Ensemble</dt><dd className="mt-0.5 capitalize">{settings.ensembleMethod}</dd></div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button onClick={run} disabled={running} className="flex-1 sm:flex-none"><Play className="size-4" />Run DeepSafe</Button>
                <Button variant="outline" onClick={() => input.current?.click()} disabled={running}><RefreshCw className="size-4" />Change</Button>
                <Button variant="ghost" onClick={clear} disabled={running}><X className="size-4" />Remove</Button>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {running && file && (
        <Panel className="rise-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Analyzing {file.name}</div>
              <div className="text-[13px] text-muted-foreground">Running models and combining scores with {settings.ensembleMethod} ensemble.</div>
            </div>
            <span className="text-xs text-muted-foreground">In progress</span>
          </div>
          <div className="progress-indeterminate mt-4 h-1 rounded-full bg-secondary" />
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {(modelsInPlay.length ? modelsInPlay : KNOWN_MODELS).map((m) => (
              <li key={m.id} className="panel-flat flex items-center gap-2 px-3 py-2 text-[13px]">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />{m.name}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {error && (
        <div className="panel rise-in flex items-start gap-3 border-destructive/20 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div><div className="font-medium">Analysis failed</div><div className="text-[13px] text-muted-foreground">{error}</div></div>
        </div>
      )}

      {result && file && <ResultsSection result={result} fileName={file.name} debug={settings.debug} />}
    </div>
  );
}

export function ResultsSection({ result, fileName, debug }: { result: DetectionResult; fileName: string; debug: boolean }) {
  const real = result.verdict === "REAL";
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ file: fileName, ...result, raw: undefined, response: result.raw }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `deepsafe-${fileName}.json`; a.click();
  };
  const chart = result.models.map((m) => ({ name: m.name, value: +(m.probability * 100).toFixed(1), fake: m.verdict === "FAKE" }));

  return (
    <div className="rise-in space-y-6">
      <section className={cn("panel overflow-hidden", real ? "border-success/20" : "border-destructive/20")}>
        <div className="grid gap-px bg-border md:grid-cols-[1.2fr_2fr]">
          <div className={cn("p-6", real ? "bg-success-soft" : "bg-danger-soft")}>
            <div className="text-[13px] text-muted-foreground">Verdict</div>
            <div className={cn("mt-2 text-5xl font-semibold tracking-tight", real ? "text-success" : "text-destructive")}>{result.verdict}</div>
            <div className="mt-2 font-mono text-lg tabular-nums">{pct(result.confidence)} <span className="font-sans text-sm text-muted-foreground">confidence</span></div>
            <div className="mt-4 truncate text-xs text-muted-foreground">{fileName}</div>
          </div>
          <div className="bg-card p-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                ["Deepfake probability", pct(result.deepfakeProbability)],
                ["Authentic probability", pct(result.authenticProbability)],
                ["Ensemble method", result.method],
                ["Model consensus", result.consensus.total ? `${result.consensus.agree} / ${result.consensus.total}` : "—"],
              ].map(([k, v]) => (
                <div key={k}><div className="text-xs text-muted-foreground">{k}</div><div className="mt-1 font-mono text-[15px] capitalize tabular-nums">{v}</div></div>
              ))}
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Authentic</span><span>Deepfake</span></div>
              <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-secondary">
                <div className="bg-success" style={{ width: pct(result.authenticProbability) }} />
                <div className="bg-destructive" style={{ width: pct(result.deepfakeProbability) }} />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="outline" size="sm" onClick={exportJson}><Download className="size-4" />Export report</Button>
            </div>
          </div>
        </div>
      </section>

      {result.models.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Panel title="Individual models" description="Deepfake probability per model.">
            <ul className="space-y-2">
              {result.models.map((m) => (
                <li key={m.name} className="panel-flat flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    {m.verdict === result.verdict ? <Check className="size-3.5 text-success" /> : <AlertCircle className="size-3.5 text-warning" />}
                    <span className="truncate">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3"><Verdict v={m.verdict} /><span className="w-14 text-right font-mono text-sm tabular-nums">{pct(m.verdict === "FAKE" ? m.probability : 1 - m.probability)}</span></div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Model comparison" description="Dashed line marks the decision threshold.">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v) => [`${v}%`, "Deepfake probability"]} />
                  <ReferenceLine y={50} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chart.map((c) => <Cell key={c.name} fill={c.fake ? "var(--destructive)" : "var(--success)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      {debug && (
        <Panel title="Debug information" description="Raw /detect response.">
          <pre className="max-h-80 overflow-auto rounded-lg bg-secondary p-4 font-mono text-xs">{JSON.stringify(result.raw, null, 2)}</pre>
        </Panel>
      )}
    </div>
  );
}
