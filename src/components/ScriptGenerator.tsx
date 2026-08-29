import { useState } from "react";
import type { Angle, GeneratedVariant } from "@shared/types";
import { ANGLES, ANGLE_LABELS, STRUCTURE_LABELS } from "@shared/types";
import { generateVariants } from "@/utils/generator";

interface Props {
  produitNom: string;
  onSaveAsScript: (label: string, contenu: string) => Promise<unknown>;
}

export function ScriptGenerator({ produitNom, onSaveAsScript }: Props) {
  const [angle, setAngle] = useState<Angle>("douleur");
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());

  function handleGenerate() {
    setVariants(generateVariants(produitNom, angle));
    setSavedIndexes(new Set());
  }

  async function handleSave(variant: GeneratedVariant, index: number) {
    const label = `${ANGLE_LABELS[variant.angle]} · ${STRUCTURE_LABELS[variant.structure]}`;
    await onSaveAsScript(label, variant.texte);
    setSavedIndexes((prev) => new Set(prev).add(index));
  }

  return (
    <div className="bg-base-850 border border-base-700 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-base-200 uppercase tracking-wide mb-3">
        Générateur de messages A/B
      </h2>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 bg-base-900 border border-base-700 rounded-md p-1">
          {ANGLES.map((a) => (
            <button
              key={a}
              onClick={() => setAngle(a)}
              className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                angle === a
                  ? "bg-amber-600 text-base-950"
                  : "text-base-300 hover:text-base-100 hover:bg-base-800"
              }`}
            >
              {ANGLE_LABELS[a]}
            </button>
          ))}
        </div>
        <button
          className="text-sm px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold"
          onClick={handleGenerate}
        >
          Générer 5 variantes
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="text-base-500 text-sm">
          Choisis un angle puis clique sur "Générer" pour obtenir des variantes de message prêtes à
          tester en A/B.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {variants.map((v, i) => (
            <div key={i} className="border border-base-700 rounded-md p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-base-500">
                <span className="px-1.5 py-0.5 rounded bg-base-800">{STRUCTURE_LABELS[v.structure]}</span>
                <span className="px-1.5 py-0.5 rounded bg-base-800">
                  {v.longueur === "courte" ? "Court" : "Développé"}
                </span>
              </div>
              <p className="text-sm text-base-200 whitespace-pre-wrap flex-1">{v.texte}</p>
              <button
                disabled={savedIndexes.has(i)}
                className="self-start text-xs px-2 py-1 rounded border border-base-600 text-base-300 hover:text-pos-cyan hover:border-pos-cyan disabled:opacity-40 disabled:hover:text-base-300 disabled:hover:border-base-600 transition-colors"
                onClick={() => handleSave(v, i)}
              >
                {savedIndexes.has(i) ? "✓ Sauvegardé comme script" : "Sauvegarder comme script"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
