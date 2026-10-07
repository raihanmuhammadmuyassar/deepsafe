import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ModelStatus } from "@/lib/api";

export function StatusDot({ status }: { status: ModelStatus }) {
  const c = { online: "bg-success", loading: "bg-info animate-pulse", degraded: "bg-warning", offline: "bg-destructive" }[status];
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", c)} />;
}

export function StatusBadge({ status }: { status: ModelStatus }) {
  const c = {
    online: "bg-success-soft text-success",
    loading: "bg-primary-soft text-primary",
    degraded: "bg-warning-soft text-warning",
    offline: "bg-danger-soft text-destructive",
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize", c)}>
      <StatusDot status={status} />{status}
    </span>
  );
}

export function Verdict({ v, size = "sm" }: { v: "REAL" | "FAKE"; size?: "sm" | "md" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md font-semibold tracking-wide",
      size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      v === "REAL" ? "bg-success-soft text-success" : "bg-danger-soft text-destructive",
    )}>{v}</span>
  );
}

export function Panel({ title, description, action, children, className }: {
  title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("panel p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground">{icon}</div>
      <div className="mt-4 text-sm font-medium">{title}</div>
      <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: ReactNode }) {
  return (
    <div className="panel lift p-5">
      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        {label}<span className="text-muted-foreground/70">{icon}</span>
      </div>
      <div className="mt-3 font-mono text-[26px] font-medium tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;
export const bytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
