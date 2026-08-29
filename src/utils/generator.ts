import type { GeneratedVariant, Longueur, Structure } from "@shared/types";
import { applyReplacements, splitSentences } from "./text";
import {
  ensureProspectFirst,
  normalizeSingleCta,
  prependProblemLinkedOpener,
  stripFillerSentences,
  stripHighFrictionCtaSentences,
  stripJargon,
} from "./copywritingRules";

// Adaptation tu/vous approximative (sur les tournures les plus courantes en DM).
// Le résultat est à relire avant envoi — c'est le principe même de l'app (rien n'est envoyé automatiquement).
const TU_TO_VOUS: [string, string][] = [
  ["t'as", "vous avez"],
  ["tu as", "vous avez"],
  ["tu es", "vous êtes"],
  ["tu peux", "vous pouvez"],
  ["tu veux", "vous voulez"],
  ["tu fais", "vous faites"],
  ["tu penses", "vous pensez"],
  ["tu bosses", "vous bossez"],
  ["tu vois", "vous voyez"],
  ["toi-même", "vous-même"],
  ["ton", "votre"],
  ["ta", "votre"],
  ["tes", "vos"],
  ["toi", "vous"],
  ["tu", "vous"],
  ["salut", "bonjour"],
  ["yo", "bonjour"],
  ["hey", "bonjour"],
];

const VOUS_TO_TU: [string, string][] = [
  ["vous êtes", "tu es"],
  ["vous avez", "tu as"],
  ["vous pouvez", "tu peux"],
  ["vous voulez", "tu veux"],
  ["vous faites", "tu fais"],
  ["vous pensez", "tu penses"],
  ["vous bossez", "tu bosses"],
  ["vous voyez", "tu vois"],
  ["vous-même", "toi-même"],
  ["votre", "ton"],
  ["vos", "tes"],
  ["avec vous", "avec toi"],
  ["pour vous", "pour toi"],
  ["chez vous", "chez toi"],
  ["vous", "tu"],
  ["bonjour", "hey"],
];

// Version courte : garde la phrase d'accroche + la dernière (souvent le CTA), sans réécrire le fond.
function buildCourte(sentences: string[]): string {
  if (sentences.length <= 2) return sentences.join(" ");
  const first = sentences[0];
  const last = sentences[sentences.length - 1];
  return first === last ? first : `${first} ${last}`;
}

interface Combo {
  structure: Structure;
  longueur: Longueur;
}

const COMBOS: Combo[] = [
  { structure: "question_ouverte", longueur: "courte" },
  { structure: "ton_familier", longueur: "courte" },
  { structure: "reference_activite", longueur: "developpee" },
  { structure: "ton_formel", longueur: "developpee" },
  { structure: "affirmation_directe", longueur: "courte" },
];

// Génère 3-5 variantes qui gardent le fond du message de référence mais varient
// la forme : longueur (courte/développée) et structure (question, affirmation,
// référence à l'activité, ton formel/familier). Aucun contenu n'est inventé :
// on recompose/adapte les phrases fournies, puis on applique les règles de
// cold outreach (prospect avant l'outil, un seul CTA à faible friction, pas
// de jargon/formules IA génériques) — voir copywritingRules.ts.
export function generateVariantsFromReference(reference: string): GeneratedVariant[] {
  const clean = reference.trim();
  if (!clean) return [];

  const sentences = splitSentences(clean);
  const courteBase = buildCourte(sentences);

  return COMBOS.map(({ structure, longueur }, i) => {
    let base = longueur === "courte" ? courteBase : clean;

    switch (structure) {
      case "reference_activite":
        base = prependProblemLinkedOpener(base, i);
        break;
      case "ton_formel":
        base = applyReplacements(base, TU_TO_VOUS);
        break;
      case "ton_familier":
        base = applyReplacements(base, VOUS_TO_TU);
        break;
      // question_ouverte / affirmation_directe : le CTA est géré uniformément plus bas
    }

    // pas de formules IA génériques / jargon corporate / demandes à forte friction —
    // fait avant l'équilibrage des pronoms, car ce nettoyage change le compte
    // des "je"/"vous" (ex: retirer "j'espère que vous allez bien")
    base = stripFillerSentences(base);
    base = stripHighFrictionCtaSentences(base);
    base = stripJargon(base);

    // un seul CTA, à faible friction : question pour toutes les structures
    // sauf l'affirmation directe qui conclut par une relance affirmative
    base = normalizeSingleCta(base, structure !== "affirmation_directe", i);

    // le prospect doit dominer sur l'émetteur — recentre si besoin (no-op
    // sinon). Fait en dernier, CTA inclus, pour un comptage fiable.
    if (structure !== "reference_activite") {
      base = ensureProspectFirst(base, i);
    }

    return { texte: base, structure, longueur };
  });
}
