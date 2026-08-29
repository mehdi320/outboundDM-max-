// Règles de cold outreach B2B appliquées au générateur de variantes :
// - le prospect (tu/vous) doit dominer sur l'émetteur (je/j'ai/nous)
// - un seul call-to-action par message, à faible friction (question ouverte,
//   jamais une demande d'appel/rdv)
// - {detail} doit être connecté au problème évoqué, jamais décoratif
// - pas de formules figées façon "IA générique" ni de jargon corporate
// - ton pair-à-pair, jamais pitch de vendeur
//
// Tout ce qui peut être corrigé mécaniquement sans risquer de casser la
// grammaire l'est automatiquement (généré par generateVariantsFromReference).
// Ce qui relève du jugement (ex: {detail} vraiment connecté au problème) est
// signalé via lintMessage() pour que l'humain tranche avant d'envoyer.

import { countMatches, splitSentences } from "./text";

export interface LintIssue {
  code: string;
  message: string;
}

// Sans "g" par défaut : les regex avec "g" gardent un état (lastIndex) entre
// deux appels de .test() sur des chaînes différentes, ce qui fait rater des
// correspondances de façon non déterministe quand on réutilise la même
// regex (cas de tous les tableaux de déclencheurs ci-dessous, construits une
// seule fois au chargement du module). Le flag "g" n'est repris explicitement
// que là où un .replace() global sur un seul appel est nécessaire.
function phraseRegex(phrase: string, flags = "iu"): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, flags);
}

// --- Pronoms : le prospect doit dominer ---
const SELF_PRONOUNS = ["je", "j'ai", "moi", "mon", "ma", "mes", "nous", "notre", "nos"];
const PROSPECT_PRONOUNS = [
  "tu",
  "toi",
  "ton",
  "ta",
  "tes",
  "te",
  "t'as",
  "t'es",
  "t'en",
  "t'intéresse",
  "vous",
  "votre",
  "vos",
];

const PROBLEM_LINK_OPENERS = [
  "Vu {detail}, je me demandais si ça te bouffait pas un peu de temps en ce moment.",
  "En regardant {detail}, un truc m'a interpellé — c'est souvent là que ça coince.",
  "{detail} — ça m'a fait tiquer, c'est exactement le genre de truc qui prend plus de temps que prévu.",
];

// Recentre le message sur le prospect si "je" y domine, en ancrant l'accroche
// sur {detail} ET un mot de friction/problème (sert aussi la règle {detail} non-décoratif).
export function ensureProspectFirst(text: string, seed: number): string {
  const selfCount = countMatches(text, SELF_PRONOUNS);
  const prospectCount = countMatches(text, PROSPECT_PRONOUNS);
  if (selfCount === 0 || selfCount <= prospectCount) return text;
  const opener = PROBLEM_LINK_OPENERS[seed % PROBLEM_LINK_OPENERS.length];
  return `${opener}\n\n${text.trim()}`;
}

export function prependProblemLinkedOpener(text: string, seed: number): string {
  const opener = PROBLEM_LINK_OPENERS[seed % PROBLEM_LINK_OPENERS.length];
  return `${opener}\n\n${text.trim()}`;
}

// --- CTA : un seul, à faible friction ---
const LOW_FRICTION_QUESTIONS = [
  "Ça te dit ?",
  "Ça te parle ?",
  "T'en penses quoi ?",
  "Ça t'intéresse d'en savoir plus ?",
  "Je te montre ?",
];

const LOW_FRICTION_STATEMENTS = ["Dis-moi si ça te parle.", "Curieux d'avoir ton avis.", "Fais-moi signe si ça t'intéresse."];

export const HIGH_FRICTION_CTA_TRIGGERS = [
  phraseRegex("un appel"),
  phraseRegex("un call"),
  phraseRegex("15 minutes"),
  phraseRegex("30 minutes"),
  phraseRegex("un rdv"),
  phraseRegex("un rendez-vous"),
  phraseRegex("rendez-vous"),
  phraseRegex("on se cale"),
  phraseRegex("caler un"),
  phraseRegex("planifier un"),
  phraseRegex("réserver un créneau"),
  phraseRegex("calendly"),
];

// Supprime entièrement les phrases qui portent une demande à forte friction
// (call, rdv, créneau...) plutôt que de simplement désamorcer leur "?" — sinon
// la phrase reste comme affirmation bancale ("On peut caler un rdv.") tout en
// continuant à violer la règle "CTA à faible friction".
export function stripHighFrictionCtaSentences(text: string): string {
  const sentences = splitSentences(text);
  // Pas de repli sur le texte d'origine si tout est filtré : mieux vaut un
  // corps vide (complété par le CTA à faible friction juste après) que de
  // garder la demande à forte friction pour "ne pas vider le message".
  return sentences.filter((s) => !HIGH_FRICTION_CTA_TRIGGERS.some((re) => re.test(s))).join(" ");
}

// Retire toute question résiduelle du corps (une seule question/CTA doit
// subsister, et c'est celle qu'on ajoute nous-mêmes à la fin — on la retire
// plutôt que de la démoter en "." pour éviter un doublon du style
// "Ça te parle . Ça te parle ?") puis ajoute un unique CTA à faible friction,
// question ou affirmation selon la structure.
export function normalizeSingleCta(text: string, wantsQuestion: boolean, seed: number): string {
  const sentences = splitSentences(text);
  const withoutQuestions = sentences.filter((s) => !s.trim().endsWith("?"));
  const body =
    withoutQuestions.length > 0
      ? withoutQuestions.join(" ").trim()
      : sentences.map((s) => s.replace(/\?+\s*$/, ".")).join(" ").trim();
  const cta = wantsQuestion
    ? LOW_FRICTION_QUESTIONS[seed % LOW_FRICTION_QUESTIONS.length]
    : LOW_FRICTION_STATEMENTS[seed % LOW_FRICTION_STATEMENTS.length];
  return `${body} ${cta}`.trim();
}

// Retire toute phrase correspondant à l'un des déclencheurs donnés. Pas de
// repli sur le texte d'origine si tout est filtré : mieux vaut un corps vide
// (le CTA ajouté ensuite comble le message) que de garder une phrase qui
// enfreint une règle juste pour "ne pas vider le message".
function removeSentencesMatching(text: string, triggers: RegExp[]): string {
  const sentences = splitSentences(text);
  return sentences.filter((s) => !triggers.some((re) => re.test(s))).join(" ");
}

// --- Formules figées façon IA générique : suppression de la phrase entière (sûr) ---
const REMOVABLE_FILLER_SENTENCE_TRIGGERS: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("j'espère que ce message vous trouve bien"), label: "j'espère que ce message vous trouve bien" },
  { pattern: phraseRegex("j'espère que ce mail vous trouve bien"), label: "j'espère que ce mail vous trouve bien" },
  { pattern: phraseRegex("j'espère que vous allez bien"), label: "j'espère que vous allez bien" },
  { pattern: phraseRegex("je reste à votre disposition"), label: "je reste à votre disposition" },
  { pattern: phraseRegex("dans l'attente de votre retour"), label: "dans l'attente de votre retour" },
];

export function stripFillerSentences(text: string): string {
  return removeSentencesMatching(
    text,
    REMOVABLE_FILLER_SENTENCE_TRIGGERS.map((t) => t.pattern)
  );
}

// --- Flatterie générique en ouverture ("j'adore ton contenu"...) : jamais un vrai compliment personnalisé ---
const FLATTERY_TRIGGERS: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("j'adore ton contenu"), label: "j'adore ton contenu" },
  { pattern: phraseRegex("j'adore ce que tu fais"), label: "j'adore ce que tu fais" },
  { pattern: phraseRegex("top ton contenu"), label: "top ton contenu" },
  { pattern: phraseRegex("super contenu"), label: "super contenu" },
  { pattern: phraseRegex("génial ce que tu fais"), label: "génial ce que tu fais" },
  { pattern: phraseRegex("j'adore ton profil"), label: "j'adore ton profil" },
];

export function stripFlatteryOpeners(text: string): string {
  return removeSentencesMatching(
    text,
    FLATTERY_TRIGGERS.map((t) => t.pattern)
  );
}

// --- Urgence artificielle ("plus que quelques places !") : jamais sur un premier contact ---
const URGENCY_TRIGGERS: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("plus que quelques places"), label: "plus que quelques places" },
  { pattern: phraseRegex("offre limitée"), label: "offre limitée" },
  { pattern: phraseRegex("dernière chance"), label: "dernière chance" },
  { pattern: phraseRegex("dépêche-toi"), label: "dépêche-toi" },
  { pattern: phraseRegex("aujourd'hui seulement"), label: "aujourd'hui seulement" },
  { pattern: phraseRegex("ne rate pas"), label: "ne rate pas" },
];

export function stripUrgencyLanguage(text: string): string {
  return removeSentencesMatching(
    text,
    URGENCY_TRIGGERS.map((t) => t.pattern)
  );
}

// --- Prix/offre : à garder pour une relance dédiée, jamais dans le message d'ouverture ---
const PRICING_TRIGGERS: RegExp[] = [
  /\d+\s?(€|\$|eur\b|euros?|dollars?)/iu,
  phraseRegex("tarif"),
  phraseRegex("abonnement"),
  phraseRegex("forfait"),
  phraseRegex("facturé"),
];

export function stripPricingDetails(text: string): string {
  return removeSentencesMatching(text, PRICING_TRIGGERS);
}

// --- Emoji : jamais plus d'un seul par message ---
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

export function capEmojis(text: string): string {
  let count = 0;
  return text.replace(EMOJI_PATTERN, (match) => {
    count += 1;
    return count <= 1 ? match : "";
  });
}

// --- Jargon corporate : remplacement par un équivalent simple (sûr, ne casse pas la phrase) ---
const JARGON_REPLACEMENTS: [phrase: string, fix: string][] = [
  ["leverage", "utiliser"],
  ["synergie", "collaboration"],
  ["best-in-class", "parmi les meilleurs"],
  ["proactif", "à l'affût"],
  ["disruptif", "différent"],
  ["scalable", "qui grandit facilement"],
  ["à valeur ajoutée", "utile"],
  ["actionnable", "concret"],
  ["impactant", "efficace"],
];

export function stripJargon(text: string): string {
  return JARGON_REPLACEMENTS.reduce((acc, [phrase, fix]) => acc.replace(phraseRegex(phrase, "giu"), fix), text);
}

// Formules repérées mais non corrigées automatiquement (la suppression casserait la phrase) : à corriger à la main.
const FLAG_ONLY_PHRASES: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("n'hésitez pas à"), label: "n'hésitez pas à" },
];

// --- {detail} connecté au problème, jamais décoratif ---
const PROBLEM_INDICATOR_STEMS = [
  "problème",
  "galère",
  "galér",
  "compliqu",
  "perdre du temps",
  "perd du temps",
  "prend du temps",
  "prenait",
  "prend plus de temps",
  "temps fou",
  "temps que prévu",
  "bloque",
  "bloquant",
  "difficile",
  "chronophage",
  "casse-tête",
  "frein",
  "manque de temps",
  "coince",
  "bouffe du temps",
  "bouffait",
  "coûte cher",
  "coûte du temps",
];

export function lintMessage(text: string): LintIssue[] {
  const issues: LintIssue[] = [];

  const selfCount = countMatches(text, SELF_PRONOUNS);
  const prospectCount = countMatches(text, PROSPECT_PRONOUNS);
  if (selfCount > 0 && selfCount > prospectCount) {
    issues.push({ code: "self_dominant", message: 'Le "je" domine sur le "tu/vous" — recentre sur le prospect.' });
  }

  const sentences = splitSentences(text);
  const questionCount = sentences.filter((s) => s.trim().endsWith("?")).length;
  if (questionCount > 1) {
    issues.push({ code: "multi_cta", message: "Plusieurs questions détectées — n'en garde qu'une comme CTA." });
  }

  if (HIGH_FRICTION_CTA_TRIGGERS.some((re) => re.test(text))) {
    issues.push({
      code: "high_friction_cta",
      message: "CTA à forte friction détecté (appel/rdv) — préfère une question ouverte légère.",
    });
  }

  for (const { pattern, label } of FLAG_ONLY_PHRASES) {
    if (pattern.test(text)) issues.push({ code: "flagged_phrase", message: `Tournure à éviter : "${label}".` });
  }
  for (const [phrase] of JARGON_REPLACEMENTS) {
    if (phraseRegex(phrase).test(text)) issues.push({ code: "jargon", message: `Jargon corporate détecté : "${phrase}".` });
  }
  for (const { pattern, label } of REMOVABLE_FILLER_SENTENCE_TRIGGERS) {
    if (pattern.test(text)) issues.push({ code: "ai_filler", message: `Formule générique type IA détectée : "${label}".` });
  }
  for (const { pattern, label } of FLATTERY_TRIGGERS) {
    if (pattern.test(text)) issues.push({ code: "flattery", message: `Flatterie générique détectée : "${label}" — jamais un vrai compliment personnalisé.` });
  }
  for (const { pattern, label } of URGENCY_TRIGGERS) {
    if (pattern.test(text)) issues.push({ code: "urgency", message: `Langage d'urgence détecté : "${label}" — pas sur un premier contact.` });
  }
  if (PRICING_TRIGGERS.some((re) => re.test(text))) {
    issues.push({
      code: "pricing_in_opener",
      message: "Détail de prix/offre détecté — garde-le pour une relance dédiée, pas dans le message d'ouverture.",
    });
  }

  const emojiCount = (text.match(EMOJI_PATTERN) ?? []).length;
  if (emojiCount > 1) {
    issues.push({ code: "emoji_stacking", message: `${emojiCount} emojis détectés — un seul maximum, pas d'empilement.` });
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 60) {
    issues.push({
      code: "too_long",
      message: `${wordCount} mots — un DM à froid vise plutôt 30-50 mots, raccourcis si possible.`,
    });
  }

  if (text.includes("{detail}")) {
    const detailSentence = sentences.find((s) => s.includes("{detail}")) ?? text;
    const lower = detailSentence.toLowerCase();
    const hasProblemLink = PROBLEM_INDICATOR_STEMS.some((stem) => lower.includes(stem));
    if (!hasProblemLink) {
      issues.push({
        code: "detail_decorative",
        message: "{detail} semble décoratif — connecte-le explicitement au problème du prospect.",
      });
    }
  }

  return issues;
}
