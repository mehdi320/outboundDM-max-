import { useState } from "react";
import type { Script } from "@shared/types";

interface Props {
  scripts: Script[];
  onCreate: (label: string, contenu: string | null) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

export function ScriptManager({ scripts, onCreate, onDelete }: Props) {
  const [label, setLabel] = useState("");
  const [contenu, setContenu] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  async function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed) return;
    await onCreate(trimmed, contenu.trim() || null);
    setLabel("");
    setContenu("");
  }

  async function handleDelete(id: number, scriptLabel: string) {
    if (!confirm(`Supprimer le script "${scriptLabel}" et ses entrées associées ?`)) return;
    await onDelete(id);
  }

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide mb-3">
        Scripts
      </h2>

      <div className="space-y-2 mb-4">
        {scripts.length === 0 && (
          <p className="text-base-400 text-sm">Aucun script pour ce produit.</p>
        )}
        {scripts.map((s) => (
          <div key={s.id} className="border border-base-700 rounded-md">
            <div className="flex items-center justify-between px-3 py-2">
              <button
                className="text-sm font-medium text-base-100 hover:text-amber-400 text-left"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                {s.label}
              </button>
              <button
                className="text-xs text-base-400 hover:text-neg-500"
                onClick={() => handleDelete(s.id, s.label)}
              >
                Supprimer
              </button>
            </div>
            {expanded === s.id && (
              <div className="px-3 pb-3 text-sm text-base-300 whitespace-pre-wrap border-t border-base-700 pt-2">
                {s.contenu || <span className="italic text-base-500">Pas de texte enregistré.</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-base-700 pt-3 space-y-2">
        <input
          className="w-full bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
          placeholder="Label (ex: Script A)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <textarea
          className="w-full bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500 resize-y"
          placeholder="Texte du message (optionnel)"
          rows={3}
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
        />
        <button
          className="w-full text-sm px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold disabled:opacity-40"
          disabled={!label.trim()}
          onClick={handleCreate}
        >
          + Ajouter le script
        </button>
      </div>
    </div>
  );
}
