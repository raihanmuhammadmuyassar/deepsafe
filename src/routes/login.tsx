import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — DeepSafe" },
      { name: "description", content: "Sign in to DeepSafe media authenticity analysis." },
      { property: "og:title", content: "Sign in — DeepSafe" },
      { property: "og:description", content: "Sign in to DeepSafe media authenticity analysis." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await login(u, p); nav({ to: "/" }); }
    catch (x) { setErr(x instanceof Error ? x.message : "Sign in failed"); }
    finally { setBusy(false); }
  };
  return (
    <AuthCard title="Sign in" subtitle="Access your DeepSafe workspace." footer={<>No account? <Link to="/register" className="text-primary hover:underline">Create one</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="u">Username</Label><Input id="u" autoComplete="username" required value={u} onChange={(e) => setU(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="p">Password</Label><Input id="p" type="password" autoComplete="current-password" required value={p} onChange={(e) => setP(e.target.value)} /></div>
        {err && <p className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </AuthCard>
  );
}
