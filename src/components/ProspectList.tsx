import { useMemo, useState } from "react";
import type { NewProspect, Platform, Prospect, Statut, UpdateProspect } from "@shared/types";
import { PLATFORMS, STATUTS, STATUT_LABELS } from "@shared/types";
import { ProspectImport } from "@/components/ProspectImport";

interface Props {
  produitId: number;
  prospects: Prospect[];
  onCreate: (data: NewProspect) => Promise<unknown>;
  onBulkCreate: (rows: Omit<NewProspect, "produit_id">[]) => Promise<{ inserted: number; ignored: number }>;
  onUpdate: (id: number, data: UpdateProspect) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

const STATUT_COLORS: Record<Statut, string> = {
  a_contacter: "text-base-300",
  contacte: "text-pos-cyan",
  repondu: "text-amber-400",
  close: "text-pos-400",
  ignore: "text-base-600",
};

export function ProspectList({ produitId, prospects, onCreate, onBulkCreate, onUpdate, onDelete }: Props) {
  const [platformFilter, setPlatformFilter] = useState<Platform | "Toutes">("Toutes");
  const [statutFilter, setStatutFilter] = useState<Statut | "Tous">("Tous");
  const [showAddForm, setShowAddForm] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [plateforme, setPlateforme] = useState<Platform>("Threads");
  const [detail, setDetail] = useState("");

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (platformFilter !== "Toutes" && p.plateforme !== platformFilter) return false;
      if (statutFilter !== "Tous" && p.statut !== statutFilter) return false;
      return true;
    });
  }, [prospects, platformFilter, statutFilter]);

  async function handleAdd() {
    if (!pseudo.trim()) return;
    await onCreate({
      produit_id: produitId,
      pseudo: pseudo.trim().replace(/^@/, ""),
      plateforme,
      detail_personnalisation: detail.trim() || null,
    });
    setPseudo("");
    setDetail("");
  }

  async function handleDelete(id: number, p: string) {
    if (!confirm(`Supprimer le prospect "${p}" ?`)) return;
    await onDelete(id);
  }

  const bulkImport = (rows: Omit<NewProspect, "produit_id">[]) => onBulkCreate(rows);

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-base-700">
        <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide">
          Prospects ({filtered.length}/{prospects.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-base-900 border border-base-600 rounded px-2 py-1 text-xs text-base-200"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | "Toutes")}
          >
            <option value="Toutes">Toutes plateformes</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className="bg-base-900 border border-base-600 rounded px-2 py-1 text-xs text-base-200"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value as Statut | "Tous")}
          >
            <option value="Tous">Tous statuts</option>
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {STATUT_LABELS[s]}
              </option>
            ))}
          </select>
          <ProspectImport onImport={bulkImport} />
          <button
            className="text-xs px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold"
            onClick={() => setShowAddForm((v) => !v)}
          >
            + Prospect
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="flex flex-wrap items-end gap-2 px-4 py-3 border-b border-base-700 bg-base-900/40">
          <label className="text-xs text-base-400 flex flex-col gap-1">
            Pseudo
            <input
              className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm w-40"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="@pseudo"
            />
          </label>
          <label className="text-xs text-base-400 flex flex-col gap-1">
            Plateforme
            <select
              className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm"
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
          <label className="text-xs text-base-400 flex flex-col gap-1 flex-1 min-w-[200px]">
            Détail personnalisation
            <input
              className="bg-base-900 border border-base-600 rounded px-2 py-1.5 text-sm w-full"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="ex: dernier post sur le fitness, secteur immobilier..."
            />
          </label>
          <button
            className="text-sm px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold disabled:opacity-40"
            disabled={!pseudo.trim()}
            onClick={handleAdd}
          >
            Ajouter
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-base-400 text-xs uppercase tracking-wide border-b border-base-700">
              <th className="px-3 py-2 font-medium">Pseudo</th>
              <th className="px-3 py-2 font-medium">Plateforme</th>
              <th className="px-3 py-2 font-medium">Détail</th>
              <th className="px-3 py-2 font-medium">Statut</th>
              <th className="px-3 py-2 font-medium">Ajouté le</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-base-500">
                  {prospects.length === 0
                    ? "Aucun prospect. Ajoute-en un ou importe un CSV."
                    : "Aucun prospect pour ce filtre."}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-base-800 hover:bg-base-900/50">
                  <td className="px-3 py-2 text-base-100 font-medium">{p.pseudo}</td>
                  <td className="px-3 py-2 text-base-300">{p.plateforme}</td>
                  <td className="px-3 py-2 text-base-400 text-xs max-w-[240px] truncate" title={p.detail_personnalisation ?? ""}>
                    {p.detail_personnalisation}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={`bg-base-900 border border-base-700 rounded px-2 py-1 text-xs ${STATUT_COLORS[p.statut]}`}
                      value={p.statut}
                      onChange={(e) => onUpdate(p.id, { statut: e.target.value as Statut })}
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>
                          {STATUT_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-base-500 font-mono text-xs">{p.date_ajout.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-xs text-base-400 hover:text-neg-500"
                      onClick={() => handleDelete(p.id, p.pseudo)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
