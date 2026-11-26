import { askConfirm } from "@/components/ConfirmDialog";
import { useRef, useState } from "react";
import type { BackupPayload } from "@shared/types";
import { api } from "@/api/client";
import { saveFile } from "@/utils/saveFile";
import { localToday } from "@/utils/date";

export function BackupControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    try {
      const payload = await api.backup.exportJson();
      await saveFile(
        `dm-prospection-backup-${localToday()}.json`,
        JSON.stringify(payload, null, 2),
        "application/json"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la sauvegarde.");
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;

      if (
        !Array.isArray(payload.products) ||
        !Array.isArray(payload.scripts) ||
        !Array.isArray(payload.prospects) ||
        !Array.isArray(payload.logs)
      ) {
        throw new Error("Ce fichier ne ressemble pas à une sauvegarde valide.");
      }

      const confirmed = await askConfirm(
        `Restaurer cette sauvegarde va REMPLACER toutes les données actuelles par :\n` +
          `${payload.products.length} produit(s), ${payload.scripts.length} script(s), ` +
          `${payload.prospects.length} prospect(s), ${payload.logs.length} log(s).\n\n` +
          `Cette action est irréversible. Continuer ?`,
        "Restaurer"
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
      <button
        onClick={handleExport}
        className="text-xs px-3 py-1.5 rounded border border-base-600 text-base-300 hover:text-amber-400 hover:border-amber-500 transition-colors"
        title="Télécharger une sauvegarde complète (produits, scripts, prospects, logs)"
      >
        ⬇ Sauvegarde JSON
      </button>
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
