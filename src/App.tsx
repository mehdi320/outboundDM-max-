import { useEffect, useMemo, useState } from "react";
import { ProductTabs } from "@/components/ProductTabs";
import { ScriptManager } from "@/components/ScriptManager";
import { ScriptGenerator } from "@/components/ScriptGenerator";
import { ProspectList } from "@/components/ProspectList";
import { Dashboard } from "@/components/Dashboard";
import { Journal } from "@/components/Journal";
import { Queue } from "@/components/Queue";
import { ExportButton } from "@/components/ExportButton";
import { BackupControls } from "@/components/BackupControls";
import { DailyGoal } from "@/components/DailyGoal";
import { errorMessage, useToast } from "@/components/Toast";
import { useProducts } from "@/hooks/useProducts";
import { useScripts } from "@/hooks/useScripts";
import { useProspects } from "@/hooks/useProspects";
import { useLogs } from "@/hooks/useLogs";

type Section = "prospects" | "scripts" | "dashboard";

export default function App() {
  const {
    products,
    loading: loadingProducts,
    createProduct,
    updateProduct,
    removeProduct,
  } = useProducts();
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [view, setView] = useState<"normal" | "queue">("normal");
  const [section, setSection] = useState<Section>("prospects");
  const { showError } = useToast();

  useEffect(() => {
    if (activeProductId == null && products.length > 0) {
      setActiveProductId(products[0].id);
    }
    if (activeProductId != null && !products.some((p) => p.id === activeProductId)) {
      setActiveProductId(products[0]?.id ?? null);
    }
  }, [products, activeProductId]);

  const activeProduct = useMemo(
    () => products.find((p) => p.id === activeProductId) ?? null,
    [products, activeProductId]
  );

  const { scripts, createScript, updateScript, removeScript } = useScripts(activeProductId);
  const {
    prospects,
    createProspect,
    bulkCreateProspects,
    updateProspect,
    contactProspect,
    removeProspect,
  } = useProspects(activeProductId);
  const { logs, removeLog, refresh: refreshLogs } = useLogs(activeProductId);

  const aContacterCount = useMemo(
    () => prospects.filter((p) => p.statut === "a_contacter").length,
    [prospects]
  );

  async function handleContact(prospectId: number, scriptId: number) {
    await contactProspect(prospectId, scriptId);
    await refreshLogs();
  }

  async function handleIgnore(prospectId: number) {
    await updateProspect(prospectId, { statut: "ignore" });
  }

  if (view === "queue" && activeProduct) {
    return (
      <Queue
        product={activeProduct}
        scripts={scripts}
        prospects={prospects}
        logs={logs}
        onContact={handleContact}
        onIgnore={handleIgnore}
        onExit={() => setView("normal")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base-950 text-base-100 flex flex-col">
      <header className="border-b border-base-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-base font-bold tracking-tight">DM Prospection</h1>
          <p className="text-xs text-base-500 hidden sm:block">
            Threads / Instagram / Twitter — préparation, pas d'envoi automatisé
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ExportButton />
          <BackupControls />
        </div>
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
        ) : activeProductId != null && activeProduct != null ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-base-900 border border-base-700 rounded-md p-1">
                {(["prospects", "scripts", "dashboard"] as Section[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSection(s)}
                    className={`text-sm px-3 py-1.5 rounded font-medium capitalize transition-colors ${
                      section === s
                        ? "bg-amber-600 text-base-950"
                        : "text-base-300 hover:text-base-100 hover:bg-base-800"
                    }`}
                  >
                    {s === "prospects" ? "Prospects" : s === "scripts" ? "Scripts" : "Dashboard"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <DailyGoal
                  product={activeProduct}
                  logs={logs}
                  onSetGoal={async (objectif) => {
                    try {
                      await updateProduct(activeProduct.id, { objectif_dm_jour: objectif });
                    } catch (err) {
                      showError(errorMessage(err, "Impossible de mettre à jour l'objectif."));
                    }
                  }}
                />
                <button
                  onClick={() => setView("queue")}
                  className="text-sm px-4 py-2 rounded-md bg-pos-500 hover:bg-pos-400 text-base-950 font-bold"
                >
                  ▶ Lancer la file d'exécution
                  {aContacterCount > 0 && (
                    <span className="ml-1.5 text-xs font-normal opacity-80">({aContacterCount} à contacter)</span>
                  )}
                </button>
              </div>
            </div>

            {section === "prospects" && (
              <ProspectList
                produitId={activeProductId}
                prospects={prospects}
                onCreate={createProspect}
                onBulkCreate={bulkCreateProspects}
                onUpdate={updateProspect}
                onDelete={removeProspect}
              />
            )}

            {section === "scripts" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <ScriptManager
                  scripts={scripts}
                  onCreate={createScript}
                  onUpdate={updateScript}
                  onDelete={removeScript}
                />
                <ScriptGenerator onSaveAsScript={(label, contenu) => createScript(label, contenu)} />
              </div>
            )}

            {section === "dashboard" && (
              <>
                <Dashboard scripts={scripts} logs={logs} />
                <Journal
                  logs={logs}
                  scripts={scripts}
                  prospects={prospects}
                  onDelete={removeLog}
                  onRefresh={refreshLogs}
                />
              </>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
