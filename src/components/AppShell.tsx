import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, ScanSearch, History, BarChart3, Cpu, Settings, LogOut, Menu, X, ShieldCheck, User,
} from "lucide-react";
import { auth, getHealth, getMe } from "@/lib/api";
import { useSettings } from "@/lib/store";
import { StatusDot } from "./ui-bits";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/detection", label: "Detection", icon: ScanSearch },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/models", label: "Models", icon: Cpu },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 30000, retry: 0 });
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-4.5" strokeWidth={2.2} />
      </div>
      <span className="text-[15px] font-semibold tracking-tight">DeepSafe</span>
    </div>
  );
}

export function AppShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const settings = useSettings();
  const health = useHealth();

  useEffect(() => {
    if (!auth.token()) { navigate({ to: "/login" }); return; }
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        setUser((typeof me.username === "string" && me.username) || auth.user());
        setReady(true);
      })
      .catch(() => { if (!cancelled) { auth.clear(); navigate({ to: "/login" }); } });
    return () => { cancelled = true; };
  }, [navigate]);
  useEffect(() => { document.documentElement.classList.toggle("dark", settings.darkMode); }, [settings.darkMode]);
  useEffect(() => setOpen(false), [path]);

  const status = health.isError ? "offline" : health.data?.overall ?? "loading";
  const statusLabel = { online: "All systems operational", loading: "Checking…", degraded: "Degraded", offline: "API unreachable" }[status];

  if (!ready) return <div className="min-h-screen" />;

  const logout = () => { auth.clear(); navigate({ to: "/login" }); };

  return (
    <div className="min-h-screen lg:pl-60">
      {open && <div className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn(
        "glass fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-y-0 border-l-0 px-3 py-5 transition-transform duration-200 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button className="rounded-md p-1 text-muted-foreground lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-4" /></button>
        </div>
        <nav className="mt-8 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link key={to} to={to} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-primary-soft font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}>
                <Icon className="size-4" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="panel-flat mt-auto p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">System</div>
          <div className="mt-2 flex items-center gap-2 text-xs"><StatusDot status={status} />{statusLabel}</div>
          {health.data && (
            <div className="mt-1 text-xs text-muted-foreground">
              {Object.values(health.data.models).filter((s) => s === "online").length}/{Object.keys(health.data.models).length || "–"} models online
            </div>
          )}
        </div>
      </aside>

      <header className="glass sticky top-0 z-20 border-x-0 border-t-0 shadow-none">
        <div className="flex items-center gap-4 px-4 py-3.5 sm:px-8">
          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold tracking-tight">{title}</h1>
            <p className="hidden truncate text-[13px] text-muted-foreground sm:block">{description}</p>
          </div>
          <div className="panel-flat hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs md:flex"><StatusDot status={status} />{statusLabel}</div>
          <div className="flex items-center gap-2 text-sm">
            <div className="grid size-8 place-items-center rounded-full bg-secondary text-muted-foreground"><User className="size-4" /></div>
            <span className="hidden max-w-32 truncate sm:inline">{user}</span>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <LogOut className="size-4" /><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
