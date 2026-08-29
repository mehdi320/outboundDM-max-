import { useMemo, useState } from "react";
import type { Log, Prospect, Script } from "@shared/types";
import { JournalRow } from "@/components/JournalRow";
import { api } from "@/api/client";

interface Props {
  logs: Log[];
  scripts: Script[];
  prospects: Prospect[];
  onDelete: (id: number) => Promise<unknown>;
  onRefresh: () => Promise<unknown>;
}

type SortKey = "date" | "prospect" | "script" | "plateforme";

export function Journal({ logs, scripts, prospects, onDelete, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const scriptLabelOf = (id: number) => scripts.find((s) => s.id === id)?.label ?? "?";
  const prospectPseudoOf = (id: number | null) =>
    id ? prospects.find((p) => p.id === id)?.pseudo ?? "?" : "—";

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = term
      ? logs.filter(
          (l) =>
            scriptLabelOf(l.script_id).toLowerCase().includes(term) ||
            prospectPseudoOf(l.prospect_id).toLowerCase().includes(term) ||
            l.plateforme.toLowerCase().includes(term) ||
            (l.note ?? "").toLowerCase().includes(term)
        )
      : logs;

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "prospect":
          cmp = prospectPseudoOf(a.prospect_id).localeCompare(prospectPseudoOf(b.prospect_id));
          break;
        case "script":
          cmp = scriptLabelOf(a.script_id).localeCompare(scriptLabelOf(b.script_id));
          break;
        case "plateforme":
          cmp = a.plateforme.localeCompare(b.plateforme);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, scripts, prospects, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function handleToggle(id: number, field: "envoye" | "reponse" | "close", value: boolean) {
    await api.logs.update(id, { [field]: value });
    await onRefresh();
  }

  function SortHeader({ label, sortKeyValue }: { label: string; sortKeyValue: SortKey }) {
    const active = sortKey === sortKeyValue;
    return (
      <th
        className="px-3 py-2 font-medium text-left cursor-pointer select-none hover:text-base-200"
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
          Journal ({filtered.length}/{logs.length})
        </h2>
        <input
          className="bg-base-900 border border-base-600 rounded px-2 py-1 text-sm w-56 focus:outline-none focus:border-amber-500"
          placeholder="Rechercher (prospect, script, note)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-base-400 text-xs uppercase tracking-wide border-b border-base-700">
              <SortHeader label="Date" sortKeyValue="date" />
              <SortHeader label="Prospect" sortKeyValue="prospect" />
              <SortHeader label="Script" sortKeyValue="script" />
              <SortHeader label="Plateforme" sortKeyValue="plateforme" />
              <th className="px-3 py-2 font-medium text-center">Env.</th>
              <th className="px-3 py-2 font-medium text-center">Rép.</th>
              <th className="px-3 py-2 font-medium text-center">Close</th>
              <th className="px-3 py-2 font-medium text-left">Note</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-base-500">
                  {logs.length === 0 ? "Aucun log pour l'instant." : "Aucun résultat pour cette recherche."}
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <JournalRow
                  key={log.id}
                  log={log}
                  scriptLabel={scriptLabelOf(log.script_id)}
                  prospectPseudo={prospectPseudoOf(log.prospect_id)}
                  onToggle={handleToggle}
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
