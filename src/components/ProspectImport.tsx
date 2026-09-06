import { useRef, useState } from "react";
import type { NewProspect } from "@shared/types";
import { parseProspectsCsv } from "@/utils/csv";

interface Props {
  onImport: (rows: Omit<NewProspect, "produit_id">[]) => Promise<{ inserted: number; ignored: number }>;
}

export function ProspectImport({ onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ prospects: Omit<NewProspect, "produit_id">[]; skipped: number } | null>(
    null
  );
  const [result, setResult] = useState<{ inserted: number; ignored: number } | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const parsed = parseProspectsCsv(text);
    setPreview(parsed);
    setResult(null);
  }

  async function confirmImport() {
    if (!preview) return;
    setImporting(true);
    try {
      const res = await onImport(preview.prospects);
      setResult(res);
      setPreview(null);
    } catch {
      // déjà signalé à l'utilisateur par le composant parent (toast)
    } finally {
      setImporting(false);
    }
  }

  if (!open) {
    return (
      <button
        className="text-xs px-3 py-1.5 rounded border border-base-600 text-base-300 hover:text-accent-400 hover:border-accent-500 transition-colors"
        onClick={() => setOpen(true)}
      >
        ⬆ Importer CSV
      </button>
    );
  }

  return (
    <div className="bg-base-900 border border-base-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-base-200">Import CSV de prospects</h3>
        <button
          className="text-xs text-base-400 hover:text-base-200"
          onClick={() => {
            setOpen(false);
            setPreview(null);
            setResult(null);
          }}
        >
          Fermer
        </button>
      </div>

      <p className="text-xs text-base-500">
        Colonnes attendues : <code className="text-accent-400">pseudo</code>,{" "}
        <code className="text-accent-400">plateforme</code> (Instagram/Threads/Twitter),{" "}
        <code className="text-accent-400">detail</code> (optionnel). Ligne d'en-tête recommandée.
      </p>

      <button
        className="text-xs px-3 py-1.5 rounded bg-accent-600 hover:bg-accent-500 text-base-950 font-semibold"
        onClick={() => fileInputRef.current?.click()}
      >
        Choisir un fichier .csv
      </button>
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />

      {preview && (
        <div className="bg-base-950 border border-base-700 rounded-md p-3 text-sm space-y-2">
          <p className="text-base-200">
            <span className="text-pos-400 font-semibold">{preview.prospects.length}</span> prospect(s) valides
            {preview.skipped > 0 && (
              <span className="text-base-500"> — {preview.skipped} ligne(s) ignorée(s) (pseudo ou plateforme manquant/invalide)</span>
            )}
          </p>
          <div className="max-h-40 overflow-y-auto text-xs text-base-400 space-y-0.5">
            {preview.prospects.slice(0, 8).map((p, i) => (
              <div key={i}>
                {p.pseudo} · {p.plateforme} {p.detail_personnalisation ? `· ${p.detail_personnalisation}` : ""}
              </div>
            ))}
            {preview.prospects.length > 8 && <div>… et {preview.prospects.length - 8} de plus</div>}
          </div>
          <button
            disabled={importing || preview.prospects.length === 0}
            className="text-xs px-3 py-1.5 rounded bg-pos-500 hover:bg-pos-400 text-base-950 font-semibold disabled:opacity-40"
            onClick={confirmImport}
          >
            {importing ? "Import..." : `Importer ${preview.prospects.length} prospect(s)`}
          </button>
        </div>
      )}

      {result && (
        <p className="text-sm text-pos-400">
          {result.inserted} prospect(s) importé(s).
          {result.ignored > 0 && <span className="text-base-500"> {result.ignored} doublon(s) ignoré(s).</span>}
        </p>
      )}
    </div>
  );
}
