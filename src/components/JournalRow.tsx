import { useState } from "react";
import type { Entry, Platform, Script, UpdateEntry } from "@shared/types";
import { PLATFORMS } from "@shared/types";

interface Props {
  entry: Entry;
  scripts: Script[];
  onUpdate: (id: number, data: UpdateEntry) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

export function JournalRow({ entry, scripts, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Entry>(entry);
  const [saving, setSaving] = useState(false);

  const scriptLabel = scripts.find((s) => s.id === entry.script_id)?.label ?? "?";

  async function save() {
    setSaving(true);
    try {
      await onUpdate(entry.id, {
        script_id: draft.script_id,
        plateforme: draft.plateforme,
        date: draft.date,
        nb_dm_envoyes: draft.nb_dm_envoyes,
        nb_reponses: draft.nb_reponses,
        nb_deals_closes: draft.nb_deals_closes,
        note: draft.note,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette entrée ?")) return;
    await onDelete(entry.id);
  }

  if (!editing) {
    return (
      <tr className="border-b border-base-800 hover:bg-base-900/50">
        <td className="px-3 py-2 text-base-300 font-mono text-xs">{entry.date}</td>
        <td className="px-3 py-2 text-base-100">{scriptLabel}</td>
        <td className="px-3 py-2 text-base-300">{entry.plateforme}</td>
        <td className="px-3 py-2 text-right font-mono text-base-100">{entry.nb_dm_envoyes}</td>
        <td className="px-3 py-2 text-right font-mono text-pos-cyan">{entry.nb_reponses}</td>
        <td className="px-3 py-2 text-right font-mono text-amber-400">{entry.nb_deals_closes}</td>
        <td className="px-3 py-2 text-base-400 text-xs max-w-[200px] truncate" title={entry.note ?? ""}>
          {entry.note}
        </td>
        <td className="px-3 py-2 text-right whitespace-nowrap">
          <button
            className="text-xs text-base-400 hover:text-amber-400 mr-3"
            onClick={() => {
              setDraft(entry);
              setEditing(true);
            }}
          >
            Éditer
          </button>
          <button className="text-xs text-base-400 hover:text-neg-500" onClick={handleDelete}>
            Supprimer
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-base-800 bg-base-900/60">
      <td className="px-2 py-2">
        <input
          type="date"
          className="bg-base-950 border border-base-600 rounded px-1.5 py-1 text-xs w-32"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
        />
      </td>
      <td className="px-2 py-2">
        <select
          className="bg-base-950 border border-base-600 rounded px-1.5 py-1 text-xs w-28"
          value={draft.script_id}
          onChange={(e) => setDraft({ ...draft, script_id: Number(e.target.value) })}
        >
          {scripts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <select
          className="bg-base-950 border border-base-600 rounded px-1.5 py-1 text-xs w-24"
          value={draft.plateforme}
          onChange={(e) => setDraft({ ...draft, plateforme: e.target.value as Platform })}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          className="bg-base-950 border border-base-600 rounded px-1.5 py-1 text-xs w-16 text-right"
          value={draft.nb_dm_envoyes}
          onChange={(e) => setDraft({ ...draft, nb_dm_envoyes: Number(e.target.value) })}
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          className="bg-base-950 border border-base-600 rounded px-1.5 py-1 text-xs w-16 text-right"
          value={draft.nb_reponses}
          onChange={(e) => setDraft({ ...draft, nb_reponses: Number(e.target.value) })}
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          className="bg-base-950 border border-base-600 rounded px-1.5 py-1 text-xs w-16 text-right"
          value={draft.nb_deals_closes}
          onChange={(e) => setDraft({ ...draft, nb_deals_closes: Number(e.target.value) })}
        />
      </td>
      <td className="px-2 py-2">
        <input
          className="bg-base-950 border border-base-600 rounded px-1.5 py-1 text-xs w-32"
          value={draft.note ?? ""}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        />
      </td>
      <td className="px-2 py-2 text-right whitespace-nowrap">
        <button
          disabled={saving}
          className="text-xs text-pos-cyan hover:text-pos-400 mr-3 disabled:opacity-40"
          onClick={save}
        >
          Sauver
        </button>
        <button className="text-xs text-base-400 hover:text-base-200" onClick={() => setEditing(false)}>
          Annuler
        </button>
      </td>
    </tr>
  );
}
