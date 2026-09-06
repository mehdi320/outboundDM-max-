import { useState } from "react";
import type { Product } from "@shared/types";
import { errorMessage, useToast } from "@/components/Toast";

interface Props {
  products: Product[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: (nom: string) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

export function ProductTabs({ products, activeId, onSelect, onCreate, onDelete }: Props) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const { showError } = useToast();

  async function handleCreate() {
    const nom = newName.trim();
    if (!nom) return;
    try {
      await onCreate(nom);
      setNewName("");
      setAdding(false);
    } catch (err) {
      showError(errorMessage(err, "Impossible de créer le produit."));
    }
  }

  async function handleDelete(id: number, nom: string) {
    if (!confirm(`Supprimer le produit "${nom}" et toutes ses données associées ?`)) return;
    try {
      await onDelete(id);
    } catch (err) {
      showError(errorMessage(err, "Impossible de supprimer le produit."));
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-base-700 px-4 pt-3">
      {products.map((p) => {
        const active = p.id === activeId;
        return (
          <div
            key={p.id}
            className={`group flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${
              active
                ? "bg-base-850 text-accent-400 border-x border-t border-base-700"
                : "text-base-300 hover:text-base-100 hover:bg-base-900"
            }`}
            onClick={() => onSelect(p.id)}
          >
            <span>{p.nom}</span>
            <button
              className="opacity-0 group-hover:opacity-100 text-base-400 hover:text-neg-500 text-xs px-1"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(p.id, p.nom);
              }}
              title="Supprimer le produit"
            >
              ✕
            </button>
          </div>
        );
      })}

      {adding ? (
        <div className="flex items-center gap-1 pb-2">
          <input
            autoFocus
            className="bg-base-900 border border-base-600 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:border-accent-500"
            placeholder="Nom du produit"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <button
            className="text-xs px-2 py-1 rounded bg-accent-600 hover:bg-accent-500 text-base-950 font-semibold"
            onClick={handleCreate}
          >
            OK
          </button>
        </div>
      ) : (
        <button
          className="text-base-400 hover:text-accent-400 text-sm px-2 pb-2"
          onClick={() => setAdding(true)}
        >
          + Produit
        </button>
      )}
    </div>
  );
}
