import { useEffect, useMemo, useState } from "react";
import type { Log, Platform, Product, Prospect, Script } from "@shared/types";
import { PLATFORMS } from "@shared/types";
import { renderTemplateDetailed } from "@/utils/template";
import { localToday } from "@/utils/date";
import { errorMessage, useToast } from "@/components/Toast";

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

const today = localToday;

// Rotation équilibrée sur l'historique : chaque prospect reçoit le script actif
// le moins envoyé jusqu'ici sur cette plateforme. Une rotation qui repart de A à
// chaque session sur-représente A dès qu'on s'arrête sur un nombre impair.
function buildQueue(
  prospects: Prospect[],
  plateforme: Platform,
  scriptsActifs: Script[],
  logs: Log[]
): QueueItem[] {
  if (scriptsActifs.length === 0) return [];
  const aContacter = prospects
    .filter((p) => p.plateforme === plateforme && p.statut === "a_contacter")
    .sort((a, b) => a.date_ajout.localeCompare(b.date_ajout) || a.id - b.id);

  const counts = new Map<number, number>(scriptsActifs.map((s) => [s.id, 0]));
  for (const l of logs) {
    if (l.envoye && l.plateforme === plateforme && counts.has(l.script_id)) {
      counts.set(l.script_id, counts.get(l.script_id)! + 1);
    }
  }

  return aContacter.map((prospect) => {
    let script = scriptsActifs[0];
    for (const s of scriptsActifs) if (counts.get(s.id)! < counts.get(script.id)!) script = s;
    counts.set(script.id, counts.get(script.id)! + 1);
    return { prospect, script };
  });
}

const VAR_LABELS = { prenom: "prénom", detail: "détail de personnalisation" } as const;

export function Queue({ product, scripts, prospects, logs, onContact, onIgnore, onExit }: Props) {
  // ouvre la file sur la plateforme qui a le plus de prospects à contacter
  const [plateforme, setPlateforme] = useState<Platform>(() => {
    const count = (pl: Platform) => prospects.filter((p) => p.plateforme === pl && p.statut === "a_contacter").length;
    return [...PLATFORMS].sort((a, b) => count(b) - count(a))[0];
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const { showError } = useToast();

  const scriptsActifs = useMemo(() => scripts.filter((s) => s.actif), [scripts]);

  function reload() {
    setQueue(buildQueue(prospects, plateforme, scriptsActifs, logs));
    setCursor(0);
    setCopied(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, [product.id, plateforme]);

  const current = queue[cursor];
  const rendered = current
    ? renderTemplateDetailed(current.script.contenu ?? "", current.prospect, product.nom)
    : null;

  // le message reste modifiable avant copie (ex: compléter un détail manquant)
  useEffect(() => {
    setDraft(rendered?.texte ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.prospect.id, current?.script.id]);

  const message = draft;

  const envoyesAujourdhui = logs.filter((l) => l.date === today() && l.envoye).length;

  async function handleCopy() {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showError("Impossible de copier automatiquement — sélectionne le texte et copie-le à la main.");
    }
  }

  async function handleNext() {
    if (!current || busy) return;
    setBusy(true);
    try {
      await onContact(current.prospect.id, current.script.id);
      setCursor((c) => c + 1);
      setCopied(false);
    } catch (err) {
      showError(errorMessage(err, "Impossible de marquer ce prospect comme contacté."));
    } finally {
      setBusy(false);
    }
  }

  function handleSkip() {
    if (!current) return;
    setCursor((c) => c + 1);
    setCopied(false);
  }

  async function handleIgnore() {
    if (!current || busy) return;
    setBusy(true);
    try {
      await onIgnore(current.prospect.id);
      setCursor((c) => c + 1);
      setCopied(false);
    } catch (err) {
      showError(errorMessage(err, "Impossible d'ignorer ce prospect."));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!current || busy) return;
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleCopy();
      } else if (e.key === "Enter" || e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSkip();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, busy, message]);

  return (
    <div className="min-h-screen bg-base-950 text-base-100 flex flex-col">
      <header className="border-b border-base-800">
        <div className="flex items-center justify-between px-4 py-2">
          <button className="text-sm text-base-400 hover:text-base-100 shrink-0" onClick={onExit}>
            ← Quitter
          </button>
          <div className="text-right shrink-0">
            <div className="font-mono text-sm text-base-200">
              {Math.min(cursor, queue.length)}/{queue.length} traités
            </div>
            {product.objectif_dm_jour != null && (
              <div className="text-xs text-base-500">
                {envoyesAujourdhui}/{product.objectif_dm_jour} DM aujourd'hui
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 px-4 pb-2">
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

            {rendered && rendered.manquantes.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-600/50 rounded-md px-4 py-2 text-sm text-amber-300">
                ⚠ Ce script utilise {rendered.manquantes.map((v) => `{${v}}`).join(" et ")} mais ce prospect n'a pas de{" "}
                {rendered.manquantes.map((v) => VAR_LABELS[v]).join(" ni de ")} : la variable a été retirée. Relis la
                phrase (tu peux la corriger directement ci-dessous) avant de copier.
              </div>
            )}

            <div className="bg-base-850 border border-base-700 rounded-lg p-1">
              {current.script.contenu ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  rows={Math.min(12, Math.max(4, draft.split("\n").length + 2))}
                  className="w-full bg-transparent p-4 text-lg sm:text-xl leading-relaxed text-base-100 resize-y focus:outline-none"
                />
              ) : (
                <p className="p-4 italic text-base-500">Ce script n'a pas de texte.</p>
              )}
            </div>

            <button
              onClick={handleCopy}
              className={`w-full text-lg font-semibold py-4 rounded-lg transition-colors ${
                copied
                  ? "bg-pos-500 text-base-950"
                  : "bg-amber-600 hover:bg-amber-500 text-base-950"
              }`}
            >
              {copied ? "✓ Copié !" : "📋 Copier le message"} <span className="text-sm font-normal opacity-60">(C)</span>
            </button>

            <button
              onClick={handleNext}
              disabled={busy}
              className="w-full text-lg font-semibold py-4 rounded-lg bg-pos-500 hover:bg-pos-400 text-base-950 disabled:opacity-40 transition-colors"
            >
              Suivant → <span className="text-sm font-normal opacity-60">(Entrée)</span>
            </button>

            <div className="flex justify-center gap-6 pt-2">
              <button
                onClick={handleSkip}
                disabled={busy}
                className="text-sm text-base-400 hover:text-base-200 disabled:opacity-40"
              >
                Passer <span className="opacity-60">(S)</span>
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
