import type { Entry, Script, UpdateEntry } from "@shared/types";
import { JournalRow } from "@/components/JournalRow";

interface Props {
  entries: Entry[];
  scripts: Script[];
  onUpdate: (id: number, data: UpdateEntry) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

export function Journal({ entries, scripts, onUpdate, onDelete }: Props) {
  return (
    <div className="bg-base-850 border border-base-700 rounded-lg overflow-hidden">
      <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide px-4 py-3 border-b border-base-700">
        Journal ({entries.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-base-400 text-xs uppercase tracking-wide border-b border-base-700">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Script</th>
              <th className="px-3 py-2 font-medium">Plateforme</th>
              <th className="px-3 py-2 font-medium text-right">Envoyés</th>
              <th className="px-3 py-2 font-medium text-right">Réponses</th>
              <th className="px-3 py-2 font-medium text-right">Closés</th>
              <th className="px-3 py-2 font-medium">Note</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-base-500">
                  Aucune entrée pour l'instant.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <JournalRow
                  key={entry.id}
                  entry={entry}
                  scripts={scripts}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
