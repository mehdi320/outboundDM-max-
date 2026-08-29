import type { Log, Script } from "@shared/types";
import { PLATFORMS } from "@shared/types";
import { formatPercent } from "@/utils/metrics";

interface Props {
  scripts: Script[];
  logs: Log[];
}

interface Cell {
  envoyes: number;
  tauxReponse: number;
}

function computeCell(logs: Log[]): Cell {
  const envoyes = logs.reduce((acc, l) => acc + (l.envoye ? 1 : 0), 0);
  const reponses = logs.reduce((acc, l) => acc + (l.reponse ? 1 : 0), 0);
  return { envoyes, tauxReponse: envoyes > 0 ? (reponses / envoyes) * 100 : 0 };
}

function cellColor(cell: Cell): string {
  if (cell.envoyes === 0) return "text-base-600";
  if (cell.tauxReponse >= 30) return "text-pos-400";
  if (cell.tauxReponse >= 15) return "text-pos-cyan";
  return "text-base-300";
}

export function PlatformMatrix({ scripts, logs }: Props) {
  if (scripts.length === 0) return null;

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg overflow-hidden">
      <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide px-4 py-3 border-b border-base-700">
        Script × Plateforme (taux de réponse)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-base-400 text-xs uppercase tracking-wide border-b border-base-700">
              <th className="px-3 py-2 font-medium">Script</th>
              {PLATFORMS.map((p) => (
                <th key={p} className="px-3 py-2 font-medium text-center">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scripts.map((script) => {
              const scriptLogs = logs.filter((l) => l.script_id === script.id);
              return (
                <tr key={script.id} className="border-b border-base-800 last:border-0">
                  <td className="px-3 py-2 text-base-100 font-medium">{script.label}</td>
                  {PLATFORMS.map((p) => {
                    const cell = computeCell(scriptLogs.filter((l) => l.plateforme === p));
                    return (
                      <td key={p} className="px-3 py-2 text-center">
                        {cell.envoyes === 0 ? (
                          <span className="text-base-600">—</span>
                        ) : (
                          <div>
                            <span className={`font-mono font-semibold ${cellColor(cell)}`}>
                              {formatPercent(cell.tauxReponse)}
                            </span>
                            <div className="text-[10px] text-base-500">{cell.envoyes} envoyés</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
