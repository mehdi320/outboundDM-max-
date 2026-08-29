import { useState } from "react";
import type { NewEntry, Platform, Script } from "@shared/types";
import { PLATFORMS } from "@shared/types";

interface Props {
  produitId: number;
  scripts: Script[];
  onSubmit: (data: NewEntry) => Promise<unknown>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EntryForm({ produitId, scripts, onSubmit }: Props) {
  const [scriptId, setScriptId] = useState<number | "">(scripts[0]?.id ?? "");
  const [plateforme, setPlateforme] = useState<Platform>("Instagram");
  const [date, setDate] = useState(today());
  const [envoyes, setEnvoyes] = useState("");
  const [reponses, setReponses] = useState("");
  const [closes, setCloses] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentScriptId: number | "" =
    scriptId === "" ? scripts[0]?.id ?? "" : scriptId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (currentScriptId === "" || scripts.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        produit_id: produitId,
        script_id: Number(currentScriptId),
        plateforme,
        date,
        nb_dm_envoyes: Number(envoyes) || 0,
        nb_reponses: Number(reponses) || 0,
        nb_deals_closes: Number(closes) || 0,
        note: note.trim() || null,
      });
      setEnvoyes("");
      setReponses("");
      setCloses("");
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }

  if (scripts.length === 0) {
    return (
      <div className="bg-base-850 border border-base-700 rounded-lg p-4 text-sm text-base-400">
        Crée d'abord un script pour pouvoir ajouter une entrée.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-base-850 border border-base-700 rounded-lg p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide">
        Nouvelle entrée
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-base-400 flex flex-col gap-1">
          Script
          <select
            className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm text-base-100 focus:outline-none focus:border-amber-500"
            value={currentScriptId}
            onChange={(e) => setScriptId(Number(e.target.value))}
          >
            {scripts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-base-400 flex flex-col gap-1">
          Plateforme
          <select
            className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm text-base-100 focus:outline-none focus:border-amber-500"
            value={plateforme}
            onChange={(e) => setPlateforme(e.target.value as Platform)}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-base-400 flex flex-col gap-1">
          Date
          <input
            type="date"
            className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm text-base-100 focus:outline-none focus:border-amber-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-base-400 flex flex-col gap-1">
          DM envoyés
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm text-base-100 focus:outline-none focus:border-pos-cyan"
            value={envoyes}
            onChange={(e) => setEnvoyes(e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="text-xs text-base-400 flex flex-col gap-1">
          Réponses
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm text-base-100 focus:outline-none focus:border-pos-cyan"
            value={reponses}
            onChange={(e) => setReponses(e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="text-xs text-base-400 flex flex-col gap-1">
          Deals closés
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm text-base-100 focus:outline-none focus:border-pos-cyan"
            value={closes}
            onChange={(e) => setCloses(e.target.value)}
            placeholder="0"
          />
        </label>
      </div>

      <label className="text-xs text-base-400 flex flex-col gap-1">
        Note (optionnel)
        <input
          className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm text-base-100 focus:outline-none focus:border-amber-500"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ex: batch envoyé le soir, ciblage niche X..."
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full text-sm px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold disabled:opacity-40"
      >
        Ajouter l'entrée
      </button>
    </form>
  );
}
