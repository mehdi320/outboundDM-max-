import type { GeneratedVariant, Longueur, Structure } from "@shared/types";

type Replacement = [phrase: string, replacement: string];

// Adaptation tu/vous approximative (sur les tournures les plus courantes en DM).
// Le résultat est à relire avant envoi — c'est le principe même de l'app (rien n'est envoyé automatiquement).
const TU_TO_VOUS: Replacement[] = [
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

const VOUS_TO_TU: Replacement[] = [
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

// \b de JS ne traite pas les lettres accentuées comme des caractères de mot :
// on utilise donc des limites Unicode-safe pour éviter de matcher "tes" à
// l'intérieur de "êtes", "votre" à l'intérieur d'un mot accentué, etc.
function wordBoundaryRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "giu");
}

function replacePreserveCase(text: string, phrase: string, replacement: string): string {
  return text.replace(wordBoundaryRegex(phrase), (match) => {
    const isCapitalized = match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase();
    return isCapitalized ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
  });
}

function applyReplacements(text: string, replacements: Replacement[]): string {
  return replacements.reduce((acc, [phrase, replacement]) => replacePreserveCase(acc, phrase, replacement), text);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Version courte : garde la phrase d'accroche + la dernière (souvent le CTA), sans réécrire le fond.
function buildCourte(sentences: string[]): string {
  if (sentences.length <= 2) return sentences.join(" ");
  const first = sentences[0];
  const last = sentences[sentences.length - 1];
  return first === last ? first : `${first} ${last}`;
}

const QUESTION_CTAS = [
  "Ça te parle ?",
  "T'en penses quoi ?",
  "Ça résonne avec ce que tu vis en ce moment ?",
];

function ensureEndsWithQuestion(text: string, seed: number): string {
  const trimmed = text.trim();
  if (trimmed.endsWith("?")) return trimmed;
  const withoutTrailingPunct = trimmed.replace(/[.!]+$/, "");
  const cta = QUESTION_CTAS[seed % QUESTION_CTAS.length];
  return `${withoutTrailingPunct}. ${cta}`;
}

function ensureAffirmation(text: string): string {
  return text.trim().replace(/\?+\s*$/, ".");
}

const ACTIVITY_OPENERS = [
  "En jetant un œil à {detail}, je me suis dit que ça pouvait te parler.",
  "En regardant {detail}, un truc m'a fait penser à toi.",
];

function prependActivityReference(text: string, seed: number): string {
  const opener = ACTIVITY_OPENERS[seed % ACTIVITY_OPENERS.length];
  return `${opener}\n\n${text.trim()}`;
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
// on ne fait que recomposer/adapter les phrases fournies par l'utilisateur.
export function generateVariantsFromReference(reference: string): GeneratedVariant[] {
  const clean = reference.trim();
  if (!clean) return [];

  const sentences = splitSentences(clean);
  const courteBase = buildCourte(sentences);

  return COMBOS.map(({ structure, longueur }, i) => {
    let base = longueur === "courte" ? courteBase : clean;

    switch (structure) {
      case "question_ouverte":
        base = ensureEndsWithQuestion(base, i);
        break;
      case "affirmation_directe":
        base = ensureAffirmation(base);
        break;
      case "reference_activite":
        base = prependActivityReference(base, i);
        break;
      case "ton_formel":
        base = applyReplacements(base, TU_TO_VOUS);
        break;
      case "ton_familier":
        base = applyReplacements(base, VOUS_TO_TU);
        break;
    }

    return { texte: base, structure, longueur };
  });
}
