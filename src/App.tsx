import { useEffect, useState } from "react";
import { ProductTabs } from "@/components/ProductTabs";
import { ScriptManager } from "@/components/ScriptManager";
import { EntryForm } from "@/components/EntryForm";
import { Dashboard } from "@/components/Dashboard";
import { Journal } from "@/components/Journal";
import { ExportButton } from "@/components/ExportButton";
import { useProducts } from "@/hooks/useProducts";
import { useScripts } from "@/hooks/useScripts";
import { useEntries } from "@/hooks/useEntries";

export default function App() {
  const { products, loading: loadingProducts, createProduct, removeProduct } = useProducts();
  const [activeProductId, setActiveProductId] = useState<number | null>(null);

  useEffect(() => {
    if (activeProductId == null && products.length > 0) {
      setActiveProductId(products[0].id);
    }
    if (activeProductId != null && !products.some((p) => p.id === activeProductId)) {
      setActiveProductId(products[0]?.id ?? null);
    }
  }, [products, activeProductId]);

  const { scripts, createScript, removeScript } = useScripts(activeProductId);
  const { entries, createEntry, updateEntry, removeEntry } = useEntries(activeProductId);

  return (
    <div className="min-h-screen bg-base-950 text-base-100 flex flex-col">
      <header className="border-b border-base-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">DM Tracker</h1>
          <p className="text-xs text-base-500">Suivi de prospection — Instagram / Threads / Twitter</p>
        </div>
        <ExportButton />
      </header>

      <ProductTabs
        products={products}
        activeId={activeProductId}
        onSelect={setActiveProductId}
        onCreate={createProduct}
        onDelete={removeProduct}
      />

      <main className="flex-1 px-4 py-6 max-w-7xl w-full mx-auto space-y-6">
        {loadingProducts ? (
          <p className="text-base-500 text-sm">Chargement...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-base-400">
            <p className="mb-2">Aucun produit pour le moment.</p>
            <p className="text-sm text-base-500">
              Utilise le bouton "+ Produit" en haut pour créer ton premier produit à suivre.
            </p>
          </div>
        ) : activeProductId != null ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ScriptManager scripts={scripts} onCreate={createScript} onDelete={removeScript} />
              <EntryForm produitId={activeProductId} scripts={scripts} onSubmit={createEntry} />
            </div>

            <Dashboard scripts={scripts} entries={entries} />

            <Journal
              entries={entries}
              scripts={scripts}
              onUpdate={updateEntry}
              onDelete={removeEntry}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
