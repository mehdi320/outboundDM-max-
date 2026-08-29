import { useRef, useState } from "react";
import type { BackupPayload } from "@shared/types";
import { api } from "@/api/client";

export function BackupControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;

      if (!Array.isArray(payload.products) || !Array.isArray(payload.scripts) || !Array.isArray(payload.entries)) {
        throw new Error("Ce fichier ne ressemble pas à une sauvegarde DM Tracker valide.");
      }

      const confirmed = confirm(
        `Restaurer cette sauvegarde va REMPLACER toutes les données actuelles par :\n` +
          `${payload.products.length} produit(s), ${payload.scripts.length} script(s), ${payload.entries.length} entrée(s).\n\n` +
          `Cette action est irréversible. Continuer ?`
      );
      if (!confirmed) return;

      setImporting(true);
      await api.backup.importJson(payload);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'import.");
      setImporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={api.backup.exportJsonUrl()}
        download
        className="text-xs px-3 py-1.5 rounded border border-base-600 text-base-300 hover:text-amber-400 hover:border-amber-500 transition-colors"
        title="Télécharger une sauvegarde complète (produits, scripts, entrées)"
      >
        ⬇ Sauvegarde JSON
      </a>
      <button
        className="text-xs px-3 py-1.5 rounded border border-base-600 text-base-300 hover:text-amber-400 hover:border-amber-500 transition-colors disabled:opacity-40"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        title="Restaurer depuis un fichier de sauvegarde JSON (remplace toutes les données)"
      >
        {importing ? "Restauration..." : "⬆ Restaurer"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileSelected}
      />
      {error && <span className="text-xs text-neg-500">{error}</span>}
    </div>
  );
}
