// DeepSafe API client. Talks to the existing FastAPI backend without changing its contracts.
// Base URL comes from VITE_API_URL (defaults to the local FastAPI port).
export const API_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8000";

const TOKEN_KEY = "deepsafe_token";
const USER_KEY = "deepsafe_user";

export const auth = {
  token: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  user: () => (typeof window === "undefined" ? null : localStorage.getItem(USER_KEY)),
  set(token: string, user: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, user);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

function headers(): HeadersInit {
  const t = auth.token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function errorText(res: Response) {
  try {
    const j = await res.json();
    return typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail ?? j);
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

async function tokenRequest(path: string, username: string, password: string) {
  const body = new URLSearchParams({ username, password });
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(await errorText(res));
  const j = await res.json();
  if (!j.access_token) throw new Error("No access token returned by server.");
  auth.set(j.access_token, username);
}

export const login = (username: string, password: string) => tokenRequest("/token", username, password);

// Backend /register uses OAuth2PasswordRequestForm (username + password only) and returns a token.
export const register = (username: string, _email: string, password: string) =>
  tokenRequest("/register", username, password);

/** Validates the stored token against GET /users/me. Clears it if invalid. */
export async function getMe(): Promise<{ username?: string } & Record<string, unknown>> {
  const res = await fetch(`${API_URL}/users/me`, { headers: headers() });
  if (res.status === 401 || res.status === 403) {
    auth.clear();
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(await errorText(res));
  return res.json();
}

export type ModelStatus = "online" | "loading" | "degraded" | "offline";
export interface HealthInfo {
  overall: ModelStatus;
  models: Record<string, ModelStatus>;
  raw: unknown;
}

function toStatus(v: unknown): ModelStatus {
  const s = String(typeof v === "object" && v ? (v as any).status ?? "" : v).toLowerCase();
  if (/(healthy|ok|online|up|ready)/.test(s)) return "online";
  if (/(load|start|init)/.test(s)) return "loading";
  if (/(degrad|partial|warn)/.test(s)) return "degraded";
  return "offline";
}

export async function getHealth(): Promise<HealthInfo> {
  const res = await fetch(`${API_URL}/health`, { headers: headers() });
  if (!res.ok) throw new Error(await errorText(res));
  const raw = await res.json();
  const src = raw.models ?? raw.services ?? raw.model_services ?? {};
  const models: Record<string, ModelStatus> = {};
  for (const [k, v] of Object.entries(src)) models[k] = toStatus(v);
  return { overall: toStatus(raw.status ?? raw.overall_status ?? "ok"), models, raw };
}

export interface ModelResult {
  name: string;
  probability: number; // deepfake probability 0..1
  verdict: "REAL" | "FAKE";
}
export interface DetectionResult {
  verdict: "REAL" | "FAKE";
  deepfakeProbability: number;
  authenticProbability: number;
  confidence: number;
  method: string;
  models: ModelResult[];
  consensus: { agree: number; total: number };
  raw: unknown;
}

export function normalizeDetection(raw: any, threshold = 0.5): DetectionResult {
  const p = Number(
    raw.deepfake_probability ?? raw.probability ?? raw.ensemble_score ?? raw.score ?? 0,
  );
  const verdict: "REAL" | "FAKE" =
    raw.is_likely_deepfake !== undefined
      ? raw.is_likely_deepfake ? "FAKE" : "REAL"
      : raw.prediction
        ? String(raw.prediction).toUpperCase().includes("FAKE") ? "FAKE" : "REAL"
        : p >= threshold ? "FAKE" : "REAL";
  const mr = raw.model_results ?? raw.individual_results ?? raw.models ?? {};
  const models: ModelResult[] = Object.entries(mr).map(([name, v]: [string, any]) => {
    const prob = Number(typeof v === "number" ? v : v?.probability ?? v?.deepfake_probability ?? v?.score ?? 0);
    const pred = typeof v === "object" ? v?.prediction ?? v?.class : undefined;
    return {
      name,
      probability: prob,
      verdict: pred !== undefined
        ? (String(pred).toUpperCase().includes("FAKE") || pred === 1 ? "FAKE" : "REAL")
        : prob >= threshold ? "FAKE" : "REAL",
    };
  });
  const agree = models.filter((m) => m.verdict === verdict).length;
  return {
    verdict,
    deepfakeProbability: p,
    authenticProbability: 1 - p,
    confidence: verdict === "FAKE" ? p : 1 - p,
    method: String(raw.ensemble_method_used ?? raw.ensemble_method ?? raw.method ?? "ensemble"),
    models,
    consensus: { agree, total: models.length },
    raw,
  };
}

export async function detect(
  file: File,
  opts: { threshold: number; ensembleMethod: string; models: string[] },
): Promise<DetectionResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("threshold", String(opts.threshold));
  fd.append("ensemble_method", opts.ensembleMethod);
  if (opts.models.length) fd.append("models", opts.models.join(","));
  const res = await fetch(`${API_URL}/detect`, { method: "POST", headers: headers(), body: fd });
  if (res.status === 401) {
    auth.clear();
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) throw new Error(await errorText(res));
  return normalizeDetection(await res.json(), opts.threshold);
}
