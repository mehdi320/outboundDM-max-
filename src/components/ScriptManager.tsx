import { useState } from "react";
import type { Script, UpdateScript } from "@shared/types";
import { errorMessage, useToast } from "@/components/Toast";

interface Props {
  scripts: Script[];
  onCreate: (label: string, contenu: string | null) => Promise<unknown>;
  onUpdate: (id: number, data: UpdateScript) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

export function ScriptManager({ scripts, onCreate, onUpdate, onDelete }: Props) {
  const [label, setLabel] = useState("");
  const [contenu, setContenu] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editContenu, setEditContenu] = useState("");
  const { showError } = useToast();

  async function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed) return;
    try {
      await onCreate(trimmed, contenu.trim() || null);
      setLabel("");
      setContenu("");
    } catch (err) {
      showError(errorMessage(err, "Impossible de créer le script."));
    }
  }

  async function handleDelete(id: number, scriptLabel: string) {
    if (!confirm(`Supprimer le script "${scriptLabel}" et ses logs associés ?`)) return;
    try {
      await onDelete(id);
    } catch (err) {
      showError(errorMessage(err, "Impossible de supprimer le script."));
    }
  }

  function startEdit(s: Script) {
    setEditingId(s.id);
    setEditLabel(s.label);
    setEditContenu(s.contenu ?? "");
    setExpanded(s.id);
  }

  async function saveEdit(id: number) {
    try {
      await onUpdate(id, { label: editLabel.trim(), contenu: editContenu.trim() || null });
      setEditingId(null);
    } catch (err) {
      showError(errorMessage(err, "Impossible de sauvegarder le script."));
    }
  }

  async function handleToggleActif(id: number, actif: boolean) {
    try {
      await onUpdate(id, { actif });
    } catch (err) {
      showError(errorMessage(err, "Impossible de mettre à jour le script."));
    }
  }

  const nbActifs = scripts.filter((s) => s.actif).length;

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide">Scripts</h2>
        <span className="text-xs text-base-500">{nbActifs} actif(s) pour la rotation A/B</span>
      </div>

      <p className="text-xs text-base-500 mb-3">
        Variables disponibles dans le texte : <code className="text-amber-400">{"{prenom}"}</code>,{" "}
        <code className="text-amber-400">{"{detail}"}</code>,{" "}
        <code className="text-amber-400">{"{produit}"}</code>
      </p>

      <div className="space-y-2 mb-4">
        {scripts.length === 0 && <p className="text-base-400 text-sm">Aucun script pour ce produit.</p>}
        {scripts.map((s) => (
          <div
            key={s.id}
            className={`border rounded-md ${s.actif ? "border-base-700" : "border-base-800 opacity-60"}`}
          >
            <div className="flex items-center justify-between px-3 py-2 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={s.actif}
                  onChange={(e) => handleToggleActif(s.id, e.target.checked)}
                  title="Actif dans la rotation A/B de la file d'exécution"
                  className="shrink-0 cursor-pointer"
                />
                <button
                  type="button"
                  className="text-sm font-medium text-base-100 hover:text-amber-400 text-left truncate"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  {s.label}
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="text-xs text-base-400 hover:text-amber-400" onClick={() => startEdit(s)}>
                  Éditer
                </button>
                <button
                  className="text-xs text-base-400 hover:text-neg-500"
                  onClick={() => handleDelete(s.id, s.label)}
                >
                  Supprimer
                </button>
              </div>
            </div>

            {expanded === s.id && editingId !== s.id && (
              <div className="px-3 pb-3 text-sm text-base-300 whitespace-pre-wrap border-t border-base-700 pt-2">
                {s.contenu || <span className="italic text-base-500">Pas de texte enregistré.</span>}
              </div>
            )}

            {editingId === s.id && (
              <div className="px-3 pb-3 border-t border-base-700 pt-2 space-y-2">
                <input
                  className="w-full bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
                <textarea
                  className="w-full bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm resize-y"
                  rows={4}
                  value={editContenu}
                  onChange={(e) => setEditContenu(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="text-xs px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold"
                    onClick={() => saveEdit(s.id)}
                  >
                    Sauver
                  </button>
                  <button
                    className="text-xs text-base-400 hover:text-base-200"
                    onClick={() => setEditingId(null)}
                  >
                    Annuler
                  </button>
                </div>
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
          placeholder="Texte du message, ex: Salut {prenom} ! {detail}..."
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
