import type { Entry, Script } from "@shared/types";

export const MIN_DM_FOR_ELIGIBILITY = 10;

export interface ScriptMetrics {
  script: Script;
  nbEntries: number;
  totalEnvoyes: number;
  totalReponses: number;
  totalCloses: number;
  tauxReponse: number; // % réponses / envoyés
  tauxCloseSurRepondants: number; // % closes / réponses
  tauxCloseGlobal: number; // % closes / envoyés
  eligible: boolean;
}

export function computeScriptMetrics(script: Script, entries: Entry[]): ScriptMetrics {
  const scriptEntries = entries.filter((e) => e.script_id === script.id);
  const totalEnvoyes = sum(scriptEntries, "nb_dm_envoyes");
  const totalReponses = sum(scriptEntries, "nb_reponses");
  const totalCloses = sum(scriptEntries, "nb_deals_closes");

  return {
    script,
    nbEntries: scriptEntries.length,
    totalEnvoyes,
    totalReponses,
    totalCloses,
    tauxReponse: ratio(totalReponses, totalEnvoyes),
    tauxCloseSurRepondants: ratio(totalCloses, totalReponses),
    tauxCloseGlobal: ratio(totalCloses, totalEnvoyes),
    eligible: totalEnvoyes >= MIN_DM_FOR_ELIGIBILITY,
  };
}

export function computeAllScriptMetrics(scripts: Script[], entries: Entry[]): ScriptMetrics[] {
  return scripts.map((script) => computeScriptMetrics(script, entries));
}

export function findBestScript(metrics: ScriptMetrics[]): ScriptMetrics | null {
  const eligible = metrics.filter((m) => m.eligible);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, current) =>
    current.tauxReponse > best.tauxReponse ? current : best
  );
}

function sum(entries: Entry[], key: keyof Pick<Entry, "nb_dm_envoyes" | "nb_reponses" | "nb_deals_closes">): number {
  return entries.reduce((acc, e) => acc + (e[key] ?? 0), 0);
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
