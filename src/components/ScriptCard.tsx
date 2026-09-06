import type { ScriptMetrics } from "@/utils/metrics";
import { formatPercent, MIN_DM_FOR_ELIGIBILITY } from "@/utils/metrics";

interface Props {
  metrics: ScriptMetrics;
  isBest: boolean;
}

export function ScriptCard({ metrics, isBest }: Props) {
  const { script, totalEnvoyes, totalReponses, totalCloses, tauxReponse, tauxCloseSurRepondants, tauxCloseGlobal, eligible } = metrics;

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        isBest
          ? "border-accent-500 bg-accent-500/5 shadow-[0_0_0_1px_rgba(99,102,241,0.3)]"
          : "border-base-700 bg-base-850"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base-100">{script.label}</h3>
        {isBest && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-accent-400 bg-accent-500/10 border border-accent-500/40 rounded px-1.5 py-0.5">
            🏆 Meilleur
          </span>
        )}
        {!eligible && (
          <span className="text-[10px] uppercase tracking-wide text-base-500 bg-base-800 border border-base-600 rounded px-1.5 py-0.5">
            Pas assez de données
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="DM envoyés" value={String(totalEnvoyes)} />
        <Metric label="Réponses" value={String(totalReponses)} />
        <Metric label="Deals closés" value={String(totalCloses)} />
        <Metric label="Logs" value={String(metrics.nbLogs)} />
      </div>

      <div className="border-t border-base-700 pt-3 grid grid-cols-3 gap-2">
        <RateMetric label="Taux réponse" value={tauxReponse} highlight />
        <RateMetric label="Close / répondants" value={tauxCloseSurRepondants} />
        <RateMetric label="Close global" value={tauxCloseGlobal} />
      </div>

      {!eligible && (
        <p className="text-[11px] text-base-500 italic">
          Seuil d'éligibilité : {MIN_DM_FOR_ELIGIBILITY} DM envoyés minimum.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-base-400 text-xs">{label}</div>
      <div className="text-base-100 font-mono text-base">{value}</div>
    </div>
  );
}

function RateMetric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="text-center bg-base-900 rounded-md py-2">
      <div className="text-base-400 text-[10px] uppercase tracking-wide">{label}</div>
      <div
        className={`font-mono text-lg font-semibold ${
          highlight ? "text-pos-cyan" : "text-pos-400"
        }`}
      >
        {formatPercent(value)}
      </div>
    </div>
  );
}
