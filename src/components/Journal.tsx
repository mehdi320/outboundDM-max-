import { useMemo, useState } from "react";
import type { Entry, NewEntry, Script, UpdateEntry } from "@shared/types";
import { JournalRow } from "@/components/JournalRow";

interface Props {
  entries: Entry[];
  scripts: Script[];
  onUpdate: (id: number, data: UpdateEntry) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  onCreate: (data: NewEntry) => Promise<unknown>;
}

type SortKey = "date" | "script" | "plateforme" | "nb_dm_envoyes" | "nb_reponses" | "nb_deals_closes";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function Journal({ entries, scripts, onUpdate, onDelete, onCreate }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const scriptLabelOf = (scriptId: number) => scripts.find((s) => s.id === scriptId)?.label ?? "?";

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = term
      ? entries.filter(
          (e) =>
            scriptLabelOf(e.script_id).toLowerCase().includes(term) ||
            e.plateforme.toLowerCase().includes(term) ||
            (e.note ?? "").toLowerCase().includes(term)
        )
      : entries;

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "script":
          cmp = scriptLabelOf(a.script_id).localeCompare(scriptLabelOf(b.script_id));
          break;
        case "plateforme":
          cmp = a.plateforme.localeCompare(b.plateforme);
          break;
        default:
          cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, scripts, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function handleDuplicate(entry: Entry) {
    await onCreate({
      produit_id: entry.produit_id,
      script_id: entry.script_id,
      plateforme: entry.plateforme,
      date: today(),
      nb_dm_envoyes: 0,
      nb_reponses: 0,
      nb_deals_closes: 0,
      note: null,
    });
  }

  function SortHeader({ label, sortKeyValue, align = "left" }: { label: string; sortKeyValue: SortKey; align?: "left" | "right" }) {
    const active = sortKey === sortKeyValue;
    return (
      <th
        className={`px-3 py-2 font-medium cursor-pointer select-none hover:text-base-200 ${
          align === "right" ? "text-right" : "text-left"
        }`}
        onClick={() => toggleSort(sortKeyValue)}
      >
        {label} {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
      </th>
    );
  }

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-base-700">
        <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide whitespace-nowrap">
          Journal ({filtered.length}/{entries.length})
        </h2>
        <input
          className="bg-base-900 border border-base-600 rounded px-2 py-1 text-sm w-56 focus:outline-none focus:border-amber-500"
          placeholder="Rechercher (script, plateforme, note)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-base-400 text-xs uppercase tracking-wide border-b border-base-700">
              <SortHeader label="Date" sortKeyValue="date" />
              <SortHeader label="Script" sortKeyValue="script" />
              <SortHeader label="Plateforme" sortKeyValue="plateforme" />
              <SortHeader label="Envoyés" sortKeyValue="nb_dm_envoyes" align="right" />
              <SortHeader label="Réponses" sortKeyValue="nb_reponses" align="right" />
              <SortHeader label="Closés" sortKeyValue="nb_deals_closes" align="right" />
              <th className="px-3 py-2 font-medium text-left">Note</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-base-500">
                  {entries.length === 0 ? "Aucune entrée pour l'instant." : "Aucun résultat pour cette recherche."}
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <JournalRow
                  key={entry.id}
                  entry={entry}
                  scripts={scripts}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onDuplicate={handleDuplicate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
