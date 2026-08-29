import { useEffect, useMemo, useState } from "react";
import type { Log, Platform, Product, Prospect, Script } from "@shared/types";
import { PLATFORMS } from "@shared/types";
import { renderTemplate } from "@/utils/template";

interface Props {
  product: Product;
  scripts: Script[];
  prospects: Prospect[];
  logs: Log[];
  onContact: (prospectId: number, scriptId: number) => Promise<unknown>;
  onIgnore: (prospectId: number) => Promise<unknown>;
  onExit: () => void;
}

interface QueueItem {
  prospect: Prospect;
  script: Script;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildQueue(prospects: Prospect[], plateforme: Platform, scriptsActifs: Script[]): QueueItem[] {
  const aContacter = prospects
    .filter((p) => p.plateforme === plateforme && p.statut === "a_contacter")
    .sort((a, b) => a.date_ajout.localeCompare(b.date_ajout));
  if (scriptsActifs.length === 0) return [];
  return aContacter.map((prospect, i) => ({ prospect, script: scriptsActifs[i % scriptsActifs.length] }));
}

export function Queue({ product, scripts, prospects, logs, onContact, onIgnore, onExit }: Props) {
  const [plateforme, setPlateforme] = useState<Platform>("Threads");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const scriptsActifs = useMemo(() => scripts.filter((s) => s.actif), [scripts]);

  function reload() {
    setQueue(buildQueue(prospects, plateforme, scriptsActifs));
    setCursor(0);
    setCopied(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, [product.id, plateforme]);

  const current = queue[cursor];
  const message = current
    ? renderTemplate(current.script.contenu ?? "", current.prospect, product.nom)
    : "";

  const envoyesAujourdhui = logs.filter((l) => l.date === today() && l.envoye).length;

  async function handleCopy() {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleNext() {
    if (!current) return;
    setBusy(true);
    try {
      await onContact(current.prospect.id, current.script.id);
      setCursor((c) => c + 1);
      setCopied(false);
    } finally {
      setBusy(false);
    }
  }

  function handleSkip() {
    setCursor((c) => c + 1);
    setCopied(false);
  }

  async function handleIgnore() {
    if (!current) return;
    setBusy(true);
    try {
      await onIgnore(current.prospect.id);
      setCursor((c) => c + 1);
      setCopied(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-950 text-base-100 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-base-800">
        <button className="text-sm text-base-400 hover:text-base-100" onClick={onExit}>
          ← Quitter
        </button>
        <div className="flex items-center gap-1 bg-base-900 border border-base-700 rounded-md p-1">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlateforme(p)}
              className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                plateforme === p
                  ? "bg-amber-600 text-base-950"
                  : "text-base-300 hover:text-base-100 hover:bg-base-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-base-200">
            {Math.min(cursor, queue.length)}/{queue.length} traités
          </div>
          {product.objectif_dm_jour != null && (
            <div className="text-xs text-base-500">
              {envoyesAujourdhui}/{product.objectif_dm_jour} DM aujourd'hui
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {scriptsActifs.length === 0 ? (
          <EmptyState
            title="Aucun script actif"
            detail={`Active au moins un script pour "${product.nom}" dans l'onglet Scripts pour lancer la file.`}
          />
        ) : !current ? (
          <EmptyState
            title={cursor === 0 ? "Aucun prospect à contacter" : "File terminée 🎉"}
            detail={
              cursor === 0
                ? `Aucun prospect "à contacter" sur ${plateforme} pour ce produit.`
                : `${cursor} prospect(s) traité(s) sur ${plateforme} cette session.`
            }
            onReload={reload}
          />
        ) : (
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-base-500 mb-1">
                {current.prospect.plateforme} · {current.script.label}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-amber-400 break-words">
                {current.prospect.pseudo}
              </h1>
              {current.prospect.detail_personnalisation && (
                <p className="text-base-400 text-sm mt-2 italic">
                  "{current.prospect.detail_personnalisation}"
                </p>
              )}
            </div>

            <div className="bg-base-850 border border-base-700 rounded-lg p-5">
              <p className="text-lg sm:text-xl leading-relaxed text-base-100 whitespace-pre-wrap">
                {message || <span className="italic text-base-500">Ce script n'a pas de texte.</span>}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full text-lg font-semibold py-4 rounded-lg transition-colors ${
                copied
                  ? "bg-pos-500 text-base-950"
                  : "bg-amber-600 hover:bg-amber-500 text-base-950"
              }`}
            >
              {copied ? "✓ Copié !" : "📋 Copier le message"}
            </button>

            <button
              onClick={handleNext}
              disabled={busy}
              className="w-full text-lg font-semibold py-4 rounded-lg bg-pos-500 hover:bg-pos-400 text-base-950 disabled:opacity-40 transition-colors"
            >
              Suivant →
            </button>

            <div className="flex justify-center gap-6 pt-2">
              <button
                onClick={handleSkip}
                disabled={busy}
                className="text-sm text-base-400 hover:text-base-200 disabled:opacity-40"
              >
                Passer
              </button>
              <button
                onClick={handleIgnore}
                disabled={busy}
                className="text-sm text-base-400 hover:text-neg-500 disabled:opacity-40"
              >
                Ignorer définitivement
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({
  title,
  detail,
  onReload,
}: {
  title: string;
  detail: string;
  onReload?: () => void;
}) {
  return (
    <div className="text-center max-w-md">
      <h2 className="text-2xl font-bold text-base-100 mb-2">{title}</h2>
      <p className="text-base-400 text-sm mb-4">{detail}</p>
      {onReload && (
        <button
          onClick={onReload}
          className="text-sm px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold"
        >
          Recharger la file
        </button>
      )}
    </div>
  );
}
