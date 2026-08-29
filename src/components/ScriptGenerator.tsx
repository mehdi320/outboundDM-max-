import { useMemo, useState } from "react";
import type { GeneratedVariant } from "@shared/types";
import { STRUCTURE_LABELS, TONE_LABELS } from "@shared/types";
import { generateVariantsFromReference } from "@/utils/generator";
import { lintMessage } from "@/utils/copywritingRules";
import { errorMessage, useToast } from "@/components/Toast";

interface Props {
  onSaveAsScript: (label: string, contenu: string) => Promise<unknown>;
}

const VARIANT_LETTERS = ["B", "C", "D", "E", "F"];

function LintBadges({ text }: { text: string }) {
  const issues = useMemo(() => lintMessage(text), [text]);
  if (!text.trim()) return null;
  if (issues.length === 0) {
    return <p className="text-xs text-pos-400">✓ Conforme aux bonnes pratiques cold outreach</p>;
  }
  return (
    <ul className="space-y-0.5">
      {issues.map((issue, i) => (
        <li key={`${issue.code}-${i}`} className="text-xs text-amber-400 flex items-start gap-1">
          <span>⚠</span>
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScriptGenerator({ onSaveAsScript }: Props) {
  const [reference, setReference] = useState("");
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  // texte exact déjà sauvegardé comme Script A (pas juste un booléen : si la
  // référence change, ce texte ne correspond plus et il faut re-proposer la sauvegarde)
  const [savedReferenceText, setSavedReferenceText] = useState<string | null>(null);
  const [savingA, setSavingA] = useState(false);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const { showError } = useToast();

  const scriptASaved = savedReferenceText === reference.trim();

  async function handleGenerate() {
    const clean = reference.trim();
    if (!clean) return;

    setVariants(generateVariantsFromReference(clean));
    setSavedIndexes(new Set());

    if (savedReferenceText !== clean) {
      setSavingA(true);
      try {
        await onSaveAsScript("Script A", clean);
        setSavedReferenceText(clean);
      } catch (err) {
        showError(errorMessage(err, "Impossible de sauvegarder le message de référence."));
      } finally {
        setSavingA(false);
      }
    }
  }

  async function handleSaveVariant(variant: GeneratedVariant, index: number) {
    const letter = VARIANT_LETTERS[index] ?? String(index + 2);
    const toneSuffix = variant.tone !== "neutre" ? ` · ${TONE_LABELS[variant.tone]}` : "";
    const label = `Script ${letter} · ${STRUCTURE_LABELS[variant.structure]}${toneSuffix}`;
    try {
      await onSaveAsScript(label, variant.texte);
      setSavedIndexes((prev) => new Set(prev).add(index));
    } catch (err) {
      showError(errorMessage(err, "Impossible de sauvegarder cette variante."));
    }
  }

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide mb-1">
        Générateur de variantes A/B
      </h2>
      <p className="text-xs text-base-500 mb-3">
        Colle ton message habituel : il devient <span className="text-amber-400">Script A</span>, et l'app
        génère des variantes qui gardent le même fond mais changent la forme (longueur, structure — le ton
        formel/familier ne varie jamais seul). Les variantes appliquent automatiquement les bonnes pratiques
        cold outreach (prospect avant l'outil, un seul CTA à faible friction, pas de jargon/flatterie/urgence/
        prix ni de formules IA génériques) — relis quand même avant d'envoyer, surtout pour vérifier que{" "}
        <code className="text-amber-400">{"{detail}"}</code> est bien connecté au problème du prospect.
      </p>

      <textarea
        className="w-full bg-base-900 border border-base-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-y"
        rows={4}
        placeholder="Salut {prenom} ! J'ai vu {detail}, ça m'a fait penser à toi. Tu es ouvert(e) à en discuter ?"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <div className="mt-1.5">
        <LintBadges text={reference} />
      </div>

      <div className="flex items-center gap-3 mt-2 mb-4">
        <button
          className="text-sm px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold disabled:opacity-40"
          disabled={!reference.trim() || savingA}
          onClick={handleGenerate}
        >
          {savingA ? "..." : "Générer les variantes"}
        </button>
        {scriptASaved && (
          <span className="text-xs text-pos-400">✓ Message de référence sauvegardé comme Script A</span>
        )}
      </div>

      {variants.length === 0 ? (
        <p className="text-base-500 text-sm">
          Colle un message déjà rédigé ci-dessus puis clique sur "Générer" pour obtenir des variantes
          prêtes à tester en A/B.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {variants.map((v, i) => {
            const letter = VARIANT_LETTERS[i] ?? String(i + 2);
            return (
              <div key={i} className="border border-base-700 rounded-md p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-base-500">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                    Script {letter}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-base-800">{STRUCTURE_LABELS[v.structure]}</span>
                  <span className="px-1.5 py-0.5 rounded bg-base-800">
                    {v.longueur === "courte" ? "Court" : "Développé"}
                  </span>
                  {v.tone !== "neutre" && (
                    <span className="px-1.5 py-0.5 rounded bg-base-800">{TONE_LABELS[v.tone]}</span>
                  )}
                </div>
                <p className="text-sm text-base-200 whitespace-pre-wrap flex-1">{v.texte}</p>
                <LintBadges text={v.texte} />
                <button
                  disabled={savedIndexes.has(i)}
                  className="self-start text-xs px-2 py-1 rounded border border-base-600 text-base-300 hover:text-pos-cyan hover:border-pos-cyan disabled:opacity-40 disabled:hover:text-base-300 disabled:hover:border-base-600 transition-colors"
                  onClick={() => handleSaveVariant(v, i)}
                >
                  {savedIndexes.has(i) ? `✓ Sauvegardé comme Script ${letter}` : `Sauvegarder comme Script ${letter}`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
