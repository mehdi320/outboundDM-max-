import { useMemo, useState } from "react";
import type { Entry, Platform, Script } from "@shared/types";
import { PlatformFilter } from "@/components/PlatformFilter";
import { ScriptCard } from "@/components/ScriptCard";
import { PlatformMatrix } from "@/components/PlatformMatrix";
import { TrendChart } from "@/components/TrendChart";
import { computeAllScriptMetrics, findBestScript } from "@/utils/metrics";

interface Props {
  scripts: Script[];
  entries: Entry[];
}

export function Dashboard({ scripts, entries }: Props) {
  const [platform, setPlatform] = useState<Platform | "Toutes">("Toutes");

  const filteredEntries = useMemo(
    () => (platform === "Toutes" ? entries : entries.filter((e) => e.plateforme === platform)),
    [entries, platform]
  );

  const metrics = useMemo(
    () => computeAllScriptMetrics(scripts, filteredEntries),
    [scripts, filteredEntries]
  );

  const best = useMemo(() => findBestScript(metrics), [metrics]);

  if (scripts.length === 0) {
    return (
      <div className="bg-base-850 border border-base-700 rounded-lg p-6 text-center text-base-400 text-sm">
        Aucun script pour ce produit. Crée un script pour voir le dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide">
          Dashboard scripts (A/B test)
        </h2>
        <PlatformFilter value={platform} onChange={setPlatform} />
      </div>

      {filteredEntries.length === 0 ? (
        <div className="bg-base-850 border border-base-700 rounded-lg p-6 text-center text-base-400 text-sm">
          Aucune donnée pour ce filtre.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {metrics
              .sort((a, b) => b.tauxReponse - a.tauxReponse)
              .map((m) => (
                <ScriptCard key={m.script.id} metrics={m} isBest={best?.script.id === m.script.id} />
              ))}
          </div>

          <TrendChart scripts={scripts} entries={filteredEntries} />
        </>
      )}

      <PlatformMatrix scripts={scripts} entries={entries} />
    </div>
  );
}
