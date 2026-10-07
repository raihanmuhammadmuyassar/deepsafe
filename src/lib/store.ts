import { useEffect, useState, useSyncExternalStore } from "react";
import type { DetectionResult } from "./api";

export const KNOWN_MODELS = [
  { id: "npr_deepfake", name: "NPR DeepFake", media: "Image", role: "Up-sampling artifact detection" },
  { id: "universal_fake_detect", name: "UniversalFakeDetect", media: "Image", role: "CLIP-based generalized detection" },
  { id: "cross_efficient_vit", name: "Cross Efficient ViT", media: "Video", role: "Frame-level face manipulation" },
] as const;

export interface Settings {
  threshold: number;
  ensembleMethod: "voting" | "average" | "stacking";
  enabledModels: string[];
  darkMode: boolean;
  debug: boolean;
}
const DEFAULT_SETTINGS: Settings = {
  threshold: 0.5,
  ensembleMethod: "stacking",
  enabledModels: KNOWN_MODELS.map((m) => m.id),
  darkMode: false,
  debug: false,
};

export interface HistoryEntry {
  id: string;
  file: string;
  mediaType: "Image" | "Video";
  verdict: "REAL" | "FAKE";
  confidence: number;
  method: string;
  date: string;
  status: "Completed" | "Failed";
  models: { name: string; probability: number; verdict: "REAL" | "FAKE" }[];
}

// Tiny localStorage-backed store; history only ever contains real analyses run in this browser.
function createStore<T>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  const subs = new Set<() => void>();
  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const s = localStorage.getItem(key);
      if (s) value = { ...(initial as any), ...JSON.parse(s) };
      if (Array.isArray(initial) && s) value = JSON.parse(s);
    } catch {}
  };
  return {
    get: () => (load(), value),
    set(next: T) {
      value = next;
      localStorage.setItem(key, JSON.stringify(next));
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) {
      subs.add(f);
      return () => subs.delete(f);
    },
    initial,
  };
}

export const settingsStore = createStore<Settings>("deepsafe_settings", DEFAULT_SETTINGS);
export const historyStore = createStore<HistoryEntry[]>("deepsafe_history", []);

function useStore<T>(s: ReturnType<typeof createStore<T>>) {
  const v = useSyncExternalStore(s.subscribe, s.get, () => s.initial);
  const [hydrated, setH] = useState(false);
  useEffect(() => setH(true), []);
  return hydrated ? v : s.initial;
}
export const useSettings = () => useStore(settingsStore);
export const useHistory = () => useStore(historyStore);

export function addHistory(file: File, r: DetectionResult) {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    file: file.name,
    mediaType: file.type.startsWith("video") ? "Video" : "Image",
    verdict: r.verdict,
    confidence: r.confidence,
    method: r.method,
    date: new Date().toISOString(),
    status: "Completed",
    models: r.models,
  };
  historyStore.set([entry, ...historyStore.get()].slice(0, 500));
}
