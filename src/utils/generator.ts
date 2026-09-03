import type { GeneratedVariant, Longueur, Structure, Tone } from "@shared/types";
import { applyReplacements, splitSentences } from "./text";
import {
  capEmojis,
  ensureProspectFirst,
  normalizeSingleCta,
  prependProblemLinkedOpener,
  stripFillerSentences,
  stripFlatteryOpeners,
  stripHighFrictionCtaSentences,
  stripJargon,
  stripPricingDetails,
  stripUrgencyLanguage,
} from "./copywritingRules";

// Adaptation tu/vous approximative (sur les tournures les plus courantes en DM).
// Le résultat est à relire avant envoi — c'est le principe même de l'app (rien n'est envoyé automatiquement).
const TU_TO_VOUS: [string, string][] = [
  ["t'as", "vous avez"],
  ["t'intéresse", "vous intéresse"],
  ["t'en penses quoi", "vous en pensez quoi"],
  ["dis-moi", "dites-moi"],
  ["fais-moi", "faites-moi"],
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
  // "te" (objet, ex: "ça te dit") avant le "tu" generique -- forme distincte,
  // couvre les CTA/accroches figes de ce module (LOW_FRICTION_*, PROBLEM_LINK_OPENERS).
  ["te", "vous"],
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
  tone: Tone;
}

// 5 combinaisons où (structure, longueur) n'est JAMAIS répété : le ton
// (formel/familier) n'est appliqué que sur des combos par ailleurs déjà
// uniques, pour ne jamais faire varier le ton seul entre deux variantes —
// une variante de même longueur/structure avec un simple changement de
// mots n'est pas un vrai test A/B, juste du bruit (règle du skill
// dm-prospecting).
const COMBOS: Combo[] = [
  { structure: "question_ouverte", longueur: "courte", tone: "neutre" },
  { structure: "affirmation_directe", longueur: "courte", tone: "neutre" },
  { structure: "reference_activite", longueur: "developpee", tone: "neutre" },
  { structure: "question_ouverte", longueur: "developpee", tone: "formel" },
  { structure: "reference_activite", longueur: "courte", tone: "familier" },
];

// Génère 3-5 variantes qui gardent le fond du message de référence mais varient
// la forme : longueur (courte/développée), structure d'ouverture (question,
// affirmation, référence à l'activité) et — en plus, jamais seul — le ton
// (formel/familier). Aucun contenu n'est inventé : on recompose/adapte les
// phrases fournies, puis on applique les règles de cold outreach (prospect
// avant l'outil, un seul CTA à faible friction, pas de jargon/flatterie/
// urgence/prix dans l'ouverture) — voir copywritingRules.ts.
export function generateVariantsFromReference(reference: string): GeneratedVariant[] {
  const clean = reference.trim();
  if (!clean) return [];

  const sentences = splitSentences(clean);
  const courteBase = buildCourte(sentences);

  return COMBOS.map(({ structure, longueur, tone }, i) => {
    let base = longueur === "courte" ? courteBase : clean;

    if (structure === "reference_activite") {
      base = prependProblemLinkedOpener(base, i);
    }

    // pas de formules IA génériques / flatterie / urgence / prix / jargon /
    // demandes à forte friction — fait avant l'équilibrage des pronoms, car
    // ce nettoyage change le compte des "je"/"vous"
    // (ex: retirer "j'espère que vous allez bien")
    base = stripFillerSentences(base);
    base = stripFlatteryOpeners(base);
    base = stripUrgencyLanguage(base);
    base = stripPricingDetails(base);
    base = stripHighFrictionCtaSentences(base);
    base = stripJargon(base);
    base = capEmojis(base);

    // un seul CTA, à faible friction : question pour toutes les structures
    // sauf l'affirmation directe qui conclut par une relance affirmative
    base = normalizeSingleCta(base, structure !== "affirmation_directe", i);

    // le prospect doit dominer sur l'émetteur — recentre si besoin (no-op
    // sinon). Fait avant le ton, CTA inclus, pour un comptage fiable.
    if (structure !== "reference_activite") {
      base = ensureProspectFirst(base, i);
    }

    // Le ton (formel/familier) s'applique en tout dernier, sur le texte
    // complet (accroche + CTA inclus) : les accroches de PROBLEM_LINK_OPENERS
    // et les CTA de LOW_FRICTION_QUESTIONS/STATEMENTS sont écrits en dur au
    // tutoiement. Appliqué plus tôt, le swap tu/vous les laisserait de côté
    // (ajoutés après lui) et une variante "formel" finirait par "Ça te dit ?"
    // au lieu de "Ça vous dit ?" — un message vouvoyé qui se termine tutoyé.
    if (tone === "formel") {
      base = applyReplacements(base, TU_TO_VOUS);
    } else if (tone === "familier") {
      base = applyReplacements(base, VOUS_TO_TU);
    }

    return { texte: base, structure, longueur, tone };
  });
}
