import { useState } from "react";
import type { Log, Product } from "@shared/types";

interface Props {
  product: Product;
  logs: Log[];
  onSetGoal: (objectif: number | null) => Promise<unknown>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyGoal({ product, logs, onSetGoal }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(product.objectif_dm_jour ?? ""));

  const envoyesAujourdhui = logs.filter((l) => l.date === today() && l.envoye).length;

  const objectif = product.objectif_dm_jour;
  const pct = objectif ? Math.min(100, (envoyesAujourdhui / objectif) * 100) : 0;
  const atteint = objectif != null && envoyesAujourdhui >= objectif;

  async function save() {
    const parsed = draft.trim() === "" ? null : Math.max(0, Number(draft));
    await onSetGoal(Number.isFinite(parsed) ? parsed : null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-base-900 border border-base-700 rounded-md px-3 py-2">
        <span className="text-xs text-base-400">Objectif DM/jour</span>
        <input
          autoFocus
          type="number"
          min={0}
          className="w-16 bg-base-950 border border-base-600 rounded px-2 py-1 text-sm text-base-100"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          className="text-xs px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold"
          onClick={save}
        >
          OK
        </button>
        <button
          className="text-xs text-base-400 hover:text-base-200"
          onClick={() => setEditing(false)}
        >
          Annuler
        </button>
      </div>
    );
  }

  if (objectif == null) {
    return (
      <button
        className="text-xs text-base-400 hover:text-amber-400 bg-base-900 border border-base-700 hover:border-amber-500 rounded-md px-3 py-2 transition-colors"
        onClick={() => setEditing(true)}
      >
        + Fixer un objectif quotidien
      </button>
    );
  }

  return (
    <button
      className="flex items-center gap-3 bg-base-900 border border-base-700 hover:border-base-600 rounded-md px-3 py-2 transition-colors"
      onClick={() => {
        setDraft(String(objectif));
        setEditing(true);
      }}
      title="Cliquer pour modifier l'objectif"
    >
      <span className="text-xs text-base-400 whitespace-nowrap">Objectif du jour</span>
      <div className="w-32 h-2 rounded-full bg-base-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${atteint ? "bg-pos-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`font-mono text-sm font-semibold whitespace-nowrap ${
          atteint ? "text-pos-400" : "text-base-100"
        }`}
      >
        {envoyesAujourdhui} / {objectif}
        {atteint ? " ✓" : ""}
      </span>
    </button>
  );
}
