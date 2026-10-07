import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — DeepSafe" },
      { name: "description", content: "Create a DeepSafe account for media authenticity analysis." },
      { property: "og:title", content: "Create account — DeepSafe" },
      { property: "og:description", content: "Create a DeepSafe account for media authenticity analysis." },
    ],
  }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ u: "", e: "", p: "", c: "" });
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setErr(null);
    if (f.p !== f.c) return setErr("Passwords do not match.");
    setBusy(true);
    try { await register(f.u, f.e, f.p); toast.success("Account created. Please sign in."); nav({ to: "/login" }); }
    catch (x) { setErr(x instanceof Error ? x.message : "Registration failed"); }
    finally { setBusy(false); }
  };
  const field = (k: keyof typeof f, label: string, type = "text", ac?: string) => (
    <div className="space-y-1.5"><Label htmlFor={k}>{label}</Label><Input id={k} type={type} autoComplete={ac} required value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  return (
    <AuthCard title="Create account" subtitle="Start analyzing media with DeepSafe." footer={<>Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {field("u", "Username", "text", "username")}
        {field("e", "Email", "email", "email")}
        {field("p", "Password", "password", "new-password")}
        {field("c", "Confirm password", "password", "new-password")}
        {err && <p className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      </form>
    </AuthCard>
  );
}
