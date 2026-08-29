import type { Log, Script } from "@shared/types";

export const MIN_DM_FOR_ELIGIBILITY = 10;

export interface ScriptMetrics {
  script: Script;
  nbLogs: number;
  totalEnvoyes: number;
  totalReponses: number;
  totalCloses: number;
  tauxReponse: number; // % réponses / envoyés
  tauxCloseSurRepondants: number; // % closes / réponses
  tauxCloseGlobal: number; // % closes / envoyés
  eligible: boolean;
}

export function computeScriptMetrics(script: Script, logs: Log[]): ScriptMetrics {
  const scriptLogs = logs.filter((l) => l.script_id === script.id);
  const totalEnvoyes = countTrue(scriptLogs, "envoye");
  const totalReponses = countTrue(scriptLogs, "reponse");
  const totalCloses = countTrue(scriptLogs, "close");

  return {
    script,
    nbLogs: scriptLogs.length,
    totalEnvoyes,
    totalReponses,
    totalCloses,
    tauxReponse: ratio(totalReponses, totalEnvoyes),
    tauxCloseSurRepondants: ratio(totalCloses, totalReponses),
    tauxCloseGlobal: ratio(totalCloses, totalEnvoyes),
    eligible: totalEnvoyes >= MIN_DM_FOR_ELIGIBILITY,
  };
}

export function computeAllScriptMetrics(scripts: Script[], logs: Log[]): ScriptMetrics[] {
  return scripts.map((script) => computeScriptMetrics(script, logs));
}

export function findBestScript(metrics: ScriptMetrics[]): ScriptMetrics | null {
  const eligible = metrics.filter((m) => m.eligible);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, current) =>
    current.tauxReponse > best.tauxReponse ? current : best
  );
}

function countTrue(logs: Log[], key: "envoye" | "reponse" | "close"): number {
  return logs.reduce((acc, l) => acc + (l[key] ? 1 : 0), 0);
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
